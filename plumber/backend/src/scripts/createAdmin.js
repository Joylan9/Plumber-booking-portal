require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plumber_booking_portal');
    console.log('MongoDB Connected');

    const adminEmail = 'admin@flowmatch.com';
    const adminPassword = 'adminpassword123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    // Create new admin
    const adminUser = new User({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
