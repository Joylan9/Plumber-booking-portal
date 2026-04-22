const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    // Allowed fields to update
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.area !== undefined) user.area = req.body.area;
    if (req.body.bio !== undefined) user.bio = req.body.bio;

    // Plumber specific fields
    if (user.role === 'plumber') {
      if (req.body.experience !== undefined) user.experience = Number(req.body.experience);
      if (req.body.hourlyRate !== undefined) user.hourlyRate = Number(req.body.hourlyRate);
      if (req.body.services !== undefined && Array.isArray(req.body.services)) {
        user.services = req.body.services;
      }
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        area: updatedUser.area,
        bio: updatedUser.bio,
        experience: updatedUser.experience,
        hourlyRate: updatedUser.hourlyRate,
        services: updatedUser.services,
        profileImage: updatedUser.profileImage,
        rating: updatedUser.rating,
        totalReviews: updatedUser.totalReviews
      },
    });
  } catch (error) {
    return next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createHttpError(400, 'No image file provided'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    // Set URL (assuming express serves static from /uploads)
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        profileImage: user.profileImage,
      },
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  updateProfile,
  uploadAvatar,
};
