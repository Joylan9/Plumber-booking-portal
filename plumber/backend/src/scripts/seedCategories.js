const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Category = require('../models/Category');

dotenv.config();

const categories = [
  {
    name: 'Leak Repair',
    description: 'Fix leaking pipes, faucets, fixtures, and fittings.',
  },
  {
    name: 'Pipe Installation',
    description: 'Install or replace plumbing lines and pipe systems.',
  },
  {
    name: 'Drain Cleaning',
    description: 'Clear blocked drains and restore smooth water flow.',
  },
  {
    name: 'Water Heater',
    description: 'Repair, service, or install water heater systems.',
  },
  {
    name: 'Toilet Repair',
    description: 'Handle toilet leaks, clogs, flush issues, and replacements.',
  },
  {
    name: 'Emergency',
    description: 'Urgent plumbing support for burst pipes and critical breakdowns.',
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    for (const category of categories) {
      await Category.updateOne(
        { name: category.name },
        { $set: category },
        { upsert: true }
      );
    }

    console.log('Categories seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Failed to seed categories: ${error.message}`);
    process.exit(1);
  }
};

seedCategories();
