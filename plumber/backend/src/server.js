const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Mount routers (placeholders - will be created later)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/plumbers', require('./routes/plumbers'));
// app.use('/api/bookings', require('./routes/bookings'));
// app.use('/api/reviews', require('./routes/reviews'));

app.get('/', (req, res) => {
  res.send('MERN Plumber Booking Portal API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
