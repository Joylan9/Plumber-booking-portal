const Category = require('../models/Category');
const { createHttpError } = require('../utils/httpError');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive = true } = req.body;

    if (!name || !name.trim()) {
      return next(createHttpError(400, 'Category name is required', 'name'));
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
};
