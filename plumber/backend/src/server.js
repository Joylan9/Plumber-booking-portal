const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { createHttpError } = require('./utils/httpError');

// Core internal routes
const authRoutes = require('./routes/authRoutes');
const plumberRoutes = require('./routes/plumberRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load env vars
dotenv.config();

const app = express();

const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '');
const allowedOrigins = [
  'https://internship-five-tau.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean),
];
const allowedOriginsSet = new Set(allowedOrigins.map((origin) => normalizeOrigin(origin)));

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginsSet.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    return callback(createHttpError(403, 'Origin not allowed by CORS'));
  },
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/plumbers', plumberRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('MERN Plumber Booking Portal API is running');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  // 1. Start listening on the port immediately so the API is accessible
  server = app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Server] API is running and listening on port ${PORT}`);
    }
  });

  // 2. Attempt to connect to the database asynchronously
  try {
    await connectDB();
  } catch (error) {
    console.error(`[Server] Failed to connect to database during startup: ${error.message}`);
    console.warn(`[Server] Warning: API is running but database is unreachable.`);
    // We intentionally DO NOT process.exit(1) here so the server remains up
  }
};

startServer();

// Graceful Shutdown Implementation
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close(false);
        console.log('[MongoDB] Database connection gracefully closed.');
        process.exit(0);
      } catch (err) {
        console.error(`[MongoDB] Error closing database connection: ${err.message}`);
        process.exit(1);
      }
    });
    
    // Force close server after 10 seconds
    setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
