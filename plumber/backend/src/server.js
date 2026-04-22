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

// Root route
app.get('/', (req, res) => {
  res.send('MERN Plumber Booking Portal API is running');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Server running on port ${PORT}`);
      }
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
