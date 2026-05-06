const mongoose = require('mongoose');
const { createHttpError } = require('../utils/httpError');

// Enterprise-grade MongoDB Connection handling
const connectDB = async (retries = 5, delay = 1000) => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw createHttpError(500, 'MongoDB connection string is not configured');
  }

  // Set up connection event listeners
  mongoose.connection.on('connected', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MongoDB] Connected to ${mongoose.connection.host}`);
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected to database');
  });

  // Retry logic with exponential backoff
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s default
      });
      return conn;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`[MongoDB] Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error('[MongoDB] All connection attempts failed.');
        throw error;
      }
    }
  }
};

module.exports = connectDB;
