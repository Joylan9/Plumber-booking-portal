const sanitizeUser = (user, token) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    area: user.area || '',
    bio: user.bio || '',
    experience: user.experience ?? null,
    hourlyRate: user.hourlyRate ?? null,
    services: Array.isArray(user.services) ? user.services : [],
    availability: user.availability || '',
    rating: user.rating ?? 0,
    totalReviews: user.totalReviews ?? 0,
    ...(token ? { token } : {}),
  };
};

module.exports = sanitizeUser;
