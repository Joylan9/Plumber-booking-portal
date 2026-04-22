const mongoose = require('mongoose');
const { createHttpError } = require('../utils/httpError');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw createHttpError(500, 'MongoDB connection string is not configured');
  }

  const conn = await mongoose.connect(mongoUri);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }

  return conn;
};

module.exports = connectDB;
