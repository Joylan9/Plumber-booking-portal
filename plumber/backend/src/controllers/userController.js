const User = require('../models/User');
const sanitizeUser = require('../utils/sanitizeUser');
const { createHttpError } = require('../utils/httpError');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeServices = (services) => {
  if (!Array.isArray(services)) {
    return [];
  }

  return [...new Set(
    services
      .map((service) => normalizeString(service))
      .filter(Boolean)
  )];
};

const parseNonNegativeNumber = (value, field) => {
  if (value === undefined) {
    return { hasValue: false, value: undefined };
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw createHttpError(400, `${field} must be a non-negative number`, field);
  }

  return { hasValue: true, value: parsedValue };
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    if (req.body.name !== undefined) {
      const name = normalizeString(req.body.name);

      if (!name) {
        return next(createHttpError(400, 'Name is required', 'name'));
      }

      user.name = name;
    }

    if (req.body.phone !== undefined) user.phone = normalizeString(req.body.phone);
    if (req.body.area !== undefined) user.area = normalizeString(req.body.area);
    if (req.body.bio !== undefined) user.bio = normalizeString(req.body.bio);
    if (req.body.availability !== undefined) user.availability = normalizeString(req.body.availability);

    if (user.role === 'plumber') {
      const experience = parseNonNegativeNumber(req.body.experience, 'experience');
      const hourlyRate = parseNonNegativeNumber(req.body.hourlyRate, 'hourlyRate');

      if (experience.hasValue) {
        user.experience = experience.value;
      }

      if (hourlyRate.hasValue) {
        user.hourlyRate = hourlyRate.value;
      }

      if (req.body.services !== undefined) {
        const services = normalizeServices(req.body.services);

        if (services.length === 0) {
          return next(createHttpError(400, 'At least one service is required for plumbers', 'services'));
        }

        user.services = services;
      }
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      data: sanitizeUser(updatedUser),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createHttpError(400, 'No image file provided', 'avatar'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    // Set URL (assuming express serves static from /uploads)
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
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
