const dotenv = require('dotenv');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');

dotenv.config();

const BASE_URL = (process.env.SMOKE_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const state = {
  customer: null,
  secondCustomer: null,
  plumber: null,
  secondPlumber: null,
  admin: null,
  bookingId: null,
  reviewId: null,
  avatarPaths: [],
};

const SANITIZED_USER_KEYS = [
  '_id',
  'name',
  'email',
  'role',
  'phone',
  'area',
  'profileImage',
  'bio',
  'experience',
  'hourlyRate',
  'services',
  'availability',
  'rating',
  'totalReviews',
];

const request = async (path, { method = 'GET', token, body } = {}) => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = { raw: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    payload,
  };
};

const assertStatus = (result, expectedStatus, label) => {
  if (result.status !== expectedStatus) {
    throw new Error(`${label} failed: expected ${expectedStatus}, received ${result.status} with payload ${JSON.stringify(result.payload)}`);
  }
};

const assert = (condition, label) => {
  if (!condition) {
    throw new Error(`${label} failed`);
  }
};

const assertObjectHasKeys = (value, keys, label) => {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} object`);

  for (const key of keys) {
    assert(Object.prototype.hasOwnProperty.call(value, key), `${label} contains ${key}`);
  }
};

const assertNoRawErrorDetails = (payload, label) => {
  assert(payload && typeof payload.message === 'string' && payload.message.trim(), `${label} message`);
  assert(!Object.prototype.hasOwnProperty.call(payload, 'stack'), `${label} omits stack`);
};

const assertSanitizedUserShape = (user, label, { expectToken = false } = {}) => {
  assertObjectHasKeys(user, SANITIZED_USER_KEYS, label);
  assert(Array.isArray(user.services), `${label} services array`);
  assert(typeof user.rating === 'number', `${label} rating number`);
  assert(typeof user.totalReviews === 'number', `${label} totalReviews number`);

  if (expectToken) {
    assert(typeof user.token === 'string' && user.token.length > 0, `${label} token`);
  } else {
    assert(!Object.prototype.hasOwnProperty.call(user, 'token'), `${label} omits token`);
  }
};

const assertPlumberShape = (plumber, label) => {
  assertObjectHasKeys(
    plumber,
    ['_id', 'name', 'area', 'bio', 'experience', 'hourlyRate', 'services', 'rating', 'totalReviews'],
    label
  );
  assert(Array.isArray(plumber.services), `${label} services array`);
};

const assertPopulatedBooking = (booking, label) => {
  assertObjectHasKeys(
    booking,
    ['_id', 'customerId', 'plumberId', 'serviceType', 'date', 'time', 'address', 'issueDescription', 'status'],
    label
  );
  assertObjectHasKeys(booking.customerId, ['_id', 'name', 'email', 'phone', 'area'], `${label} customerId`);
  assertObjectHasKeys(
    booking.plumberId,
    ['_id', 'name', 'email', 'phone', 'area', 'services', 'hourlyRate', 'rating', 'totalReviews', 'experience'],
    `${label} plumberId`
  );
  assert(Array.isArray(booking.plumberId.services), `${label} plumberId services array`);
};

const assertReviewShape = (review, label) => {
  assertObjectHasKeys(review, ['_id', 'bookingId', 'customerId', 'plumberId', 'rating', 'comment'], label);
  assertObjectHasKeys(review.customerId, ['_id', 'name'], `${label} customerId`);
  assertObjectHasKeys(review.plumberId, ['_id', 'name', 'rating', 'totalReviews'], `${label} plumberId`);
};

const logStep = (message) => {
  console.log(`- ${message}`);
};

const getUploadFilePath = (avatarPath) => {
  if (typeof avatarPath !== 'string' || !avatarPath.startsWith('/uploads/')) {
    return null;
  }

  return path.join(__dirname, '../../uploads', path.basename(avatarPath));
};

const createApiUser = async ({ name, role, password, email: providedEmail, extra = {} }) => {
  const email = providedEmail || `${role}.${runId}.${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name,
      email,
      password,
      role,
      ...extra,
    },
  });

  assertStatus(response, 201, `register ${role}`);
  assert(response.payload?.data?.token, `register ${role} token`);
  assertSanitizedUserShape(response.payload?.data, `register ${role}`, { expectToken: true });

  return {
    email,
    password,
    user: response.payload.data,
  };
};

const loginApiUser = async ({ email, password }, expectedStatus = 200) => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  assertStatus(response, expectedStatus, `login ${email}`);
  const user = response.payload?.data || null;

  if (expectedStatus === 200) {
    assertSanitizedUserShape(user, `login ${email}`, { expectToken: true });
  }

  return user;
};

const seedAdminUser = async () => {
  const email = `admin.${runId}@example.com`;
  const password = 'Admin123!';

  await User.create({
    name: 'FlowMatch Admin',
    email,
    password,
    role: 'admin',
  });

  const admin = await loginApiUser({ email, password });
  return { email, password, user: admin };
};

const issueResetOtp = async (email) => {
  const user = await User.findOne({ email });
  const otp = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  return otp;
};

const cleanupArtifacts = async () => {
  if (state.reviewId) {
    await Review.deleteMany({ _id: state.reviewId });
  }

  if (state.bookingId) {
    await Booking.deleteMany({ _id: state.bookingId });
  }

  await Category.deleteMany({ name: { $in: [`Smoke Category ${runId}`] } });

  const ids = [
    state.customer?._id,
    state.secondCustomer?._id,
    state.plumber?._id,
    state.secondPlumber?._id,
    state.admin?._id,
  ].filter(Boolean);
  if (ids.length) {
    await User.deleteMany({ _id: { $in: ids } });
  }

  await Promise.allSettled(
    state.avatarPaths
      .map((avatarPath) => getUploadFilePath(avatarPath))
      .filter(Boolean)
      .map((filePath) => fs.rm(filePath, { force: true }))
  );
};

const main = async () => {
  console.log(`Running backend smoke test against ${BASE_URL}`);

  await connectDB();

  try {
    const customerSeed = await createApiUser({
      name: 'Smoke Customer',
      role: 'customer',
      password: 'Customer123!',
    });
    state.customer = customerSeed.user;
    logStep('customer register/login contract verified');

    const invalidPlumberExperience = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Invalid Plumber Experience',
        email: `invalid.experience.${runId}@example.com`,
        password: 'Plumber123!',
        role: 'plumber',
        experience: -1,
        hourlyRate: 75,
        services: ['Leak Repair'],
      },
    });
    assertStatus(invalidPlumberExperience, 400, 'invalid plumber experience rejected');
    assertNoRawErrorDetails(invalidPlumberExperience.payload, 'invalid plumber experience error');
    assert(invalidPlumberExperience.payload?.field === 'experience', 'invalid plumber experience field');

    const invalidPlumberHourlyRate = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Invalid Plumber Rate',
        email: `invalid.hourly.${runId}@example.com`,
        password: 'Plumber123!',
        role: 'plumber',
        experience: 4,
        hourlyRate: 'not-a-number',
        services: ['Leak Repair'],
      },
    });
    assertStatus(invalidPlumberHourlyRate, 400, 'invalid plumber hourly rate rejected');
    assertNoRawErrorDetails(invalidPlumberHourlyRate.payload, 'invalid plumber hourly rate error');
    assert(invalidPlumberHourlyRate.payload?.field === 'hourlyRate', 'invalid plumber hourly rate field');

    const plumberSeed = await createApiUser({
      name: 'Smoke Plumber',
      role: 'plumber',
      password: 'Plumber123!',
      extra: {
        phone: '9999999999',
        area: 'Smoke Area',
        bio: 'Production-ready plumber for smoke tests.',
        experience: 5,
        hourlyRate: 80,
        services: ['Leak Repair', 'Drain Cleaning'],
      },
    });
    state.plumber = plumberSeed.user;
    logStep('plumber register contract verified');

    const secondCustomerSeed = await createApiUser({
      name: 'Other Customer',
      email: `other.customer.${runId}@example.technology`,
      role: 'customer',
      password: 'Customer123!',
    });
    state.secondCustomer = secondCustomerSeed.user;

    const secondPlumberSeed = await createApiUser({
      name: 'Other Plumber',
      role: 'plumber',
      password: 'Plumber123!',
      extra: {
        phone: '8888888888',
        area: 'Second Smoke Area',
        bio: 'Second plumber for authorization checks.',
        experience: 8,
        hourlyRate: 95,
        services: ['Water Heater'],
      },
    });
    state.secondPlumber = secondPlumberSeed.user;

    const adminSeed = await seedAdminUser();
    state.admin = adminSeed.user;
    logStep('admin login contract verified');

    const adminRegisterBlocked = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Blocked Admin',
        email: `blocked.admin.${runId}@example.com`,
        password: 'Admin123!',
        role: 'admin',
      },
    });
    assertStatus(adminRegisterBlocked, 403, 'admin registration blocked');
    assertNoRawErrorDetails(adminRegisterBlocked.payload, 'admin registration blocked error');

    const forgotPasswordResult = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: customerSeed.email },
    });
    assertStatus(forgotPasswordResult, 200, 'forgot password');
    logStep('forgot password route verified');

    const resetOtp = await issueResetOtp(customerSeed.email);
    const resetOtpResult = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: customerSeed.email,
        otp: resetOtp,
        password: 'Customer456!',
      },
    });
    assertStatus(resetOtpResult, 200, 'OTP reset password');
    assertSanitizedUserShape(resetOtpResult.payload?.data, 'OTP reset password user', { expectToken: true });
    state.customer = resetOtpResult.payload.data;
    await loginApiUser({ email: customerSeed.email, password: 'Customer456!' });

    const resetTokenPost = await issueResetOtp(customerSeed.email);
    const resetTokenPostResult = await request(`/api/auth/reset-password/${resetTokenPost}`, {
      method: 'POST',
      body: { password: 'Customer789!' },
    });
    assertStatus(resetTokenPostResult, 200, 'token reset password POST');
    assertSanitizedUserShape(resetTokenPostResult.payload?.data, 'token reset password POST user', { expectToken: true });
    state.customer = resetTokenPostResult.payload.data;
    await loginApiUser({ email: customerSeed.email, password: 'Customer789!' });

    const resetTokenPut = await issueResetOtp(customerSeed.email);
    const resetTokenPutResult = await request(`/api/auth/reset-password/${resetTokenPut}`, {
      method: 'PUT',
      body: { password: 'Customer999!' },
    });
    assertStatus(resetTokenPutResult, 200, 'token reset password PUT');
    assertSanitizedUserShape(resetTokenPutResult.payload?.data, 'token reset password PUT user', { expectToken: true });
    state.customer = resetTokenPutResult.payload.data;
    await loginApiUser({ email: customerSeed.email, password: 'Customer999!' });
    logStep('password reset OTP and token route compatibility verified');

    const customerProfileUpdate = await request('/api/users/profile', {
      method: 'PUT',
      token: state.customer.token,
      body: {
        name: 'Smoke Customer Updated',
        phone: '7777777777',
        area: 'Updated Customer Area',
        bio: 'Customer profile update from smoke test.',
      },
    });
    assertStatus(customerProfileUpdate, 200, 'customer profile update');
    assert(customerProfileUpdate.payload?.data?.name === 'Smoke Customer Updated', 'customer profile name updated');
    assertSanitizedUserShape(customerProfileUpdate.payload?.data, 'customer profile update user');
    state.customer = { ...state.customer, ...customerProfileUpdate.payload.data };

    const plumberProfileUpdate = await request('/api/users/profile', {
      method: 'PUT',
      token: state.plumber.token,
      body: {
        name: 'Smoke Plumber Updated',
        phone: '9999999998',
        area: 'Updated Plumber Area',
        bio: 'Plumber profile update from smoke test.',
        experience: 6,
        hourlyRate: 85,
        services: ['Leak Repair', 'Emergency'],
      },
    });
    assertStatus(plumberProfileUpdate, 200, 'plumber profile update');
    assert(plumberProfileUpdate.payload?.data?.services?.includes('Emergency'), 'plumber profile services updated');
    assertSanitizedUserShape(plumberProfileUpdate.payload?.data, 'plumber profile update user');
    state.plumber = { ...state.plumber, ...plumberProfileUpdate.payload.data };

    const avatarForm = new FormData();
    avatarForm.append('avatar', new Blob(['flowmatch-avatar'], { type: 'image/png' }), 'avatar.png');
    const avatarUpload = await request('/api/users/upload-avatar', {
      method: 'POST',
      token: state.customer.token,
      body: avatarForm,
    });
    assertStatus(avatarUpload, 200, 'avatar upload');
    assert(avatarUpload.payload?.data?.profileImage?.startsWith('/uploads/'), 'avatar upload profile image path');
    assertSanitizedUserShape(avatarUpload.payload?.data, 'avatar upload user');
    state.customer = { ...state.customer, ...avatarUpload.payload.data };
    state.avatarPaths.push(avatarUpload.payload.data.profileImage);

    const avatarAssetResponse = await fetch(`${BASE_URL}${avatarUpload.payload.data.profileImage}`);
    if (!avatarAssetResponse.ok) {
      throw new Error(`avatar static file failed: expected 200, received ${avatarAssetResponse.status}`);
    }
    logStep('profile update and avatar upload routes verified');

    const missingTokenResult = await request('/api/bookings');
    assertStatus(missingTokenResult, 401, 'missing token rejected');
    assertNoRawErrorDetails(missingTokenResult.payload, 'missing token error');

    const invalidTokenResult = await request('/api/bookings', {
      token: 'not-a-valid-token',
    });
    assertStatus(invalidTokenResult, 401, 'invalid token rejected');
    assertNoRawErrorDetails(invalidTokenResult.payload, 'invalid token error');

    const expiredToken = jwt.sign(
      { id: state.customer._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const expiredTokenResult = await request('/api/bookings', {
      token: expiredToken,
    });
    assertStatus(expiredTokenResult, 401, 'expired token rejected');
    assertNoRawErrorDetails(expiredTokenResult.payload, 'expired token error');
    logStep('auth guard token failures verified');

    const plumbersList = await request('/api/plumbers');
    assertStatus(plumbersList, 200, 'plumber list');
    assert(Array.isArray(plumbersList.payload?.data), 'plumber list array');
    assert(plumbersList.payload.data.length >= 2, 'plumber list contains seeded plumbers');
    plumbersList.payload.data.forEach((plumber, index) => {
      assertPlumberShape(plumber, `plumber list item ${index}`);
    });

    const filteredByArea = await request(`/api/plumbers?area=${encodeURIComponent('Updated Plumber Area')}`);
    assertStatus(filteredByArea, 200, 'plumber list area filter');
    assert(filteredByArea.payload?.data?.some((plumber) => plumber._id === state.plumber._id), 'plumber area filter returns updated plumber');
    assert(filteredByArea.payload?.data?.every((plumber) => (plumber.area || '').toLowerCase().includes('updated plumber area')), 'plumber area filter narrows results');

    const filteredByService = await request(`/api/plumbers?service=${encodeURIComponent('Emergency')}`);
    assertStatus(filteredByService, 200, 'plumber list service filter');
    assert(filteredByService.payload?.data?.some((plumber) => plumber._id === state.plumber._id), 'plumber service filter returns updated plumber');
    assert(filteredByService.payload?.data?.every((plumber) => Array.isArray(plumber.services) && plumber.services.includes('Emergency')), 'plumber service filter narrows results');

    const plumberDetail = await request(`/api/plumbers/${state.plumber._id}`);
    assertStatus(plumberDetail, 200, 'plumber detail');
    assertPlumberShape(plumberDetail.payload?.data, 'plumber detail');
    logStep('plumber list/detail routes verified');

    const bookingCreate = await request('/api/bookings', {
      method: 'POST',
      token: state.customer.token,
      body: {
        plumberId: state.plumber._id,
        date: new Date(Date.now() + 86400000).toISOString(),
        time: '10:00',
        address: '123 Smoke Test Street',
        issueDescription: 'Kitchen sink is leaking heavily.',
        notes: 'Please bring tools.',
      },
    });
    assertStatus(bookingCreate, 201, 'booking create');
    assert(bookingCreate.payload?.data?.serviceType === 'Leak Repair', 'booking serviceType derived');
    assertPopulatedBooking(bookingCreate.payload?.data, 'booking create');
    state.bookingId = bookingCreate.payload.data._id;

    const customerBookings = await request('/api/bookings', { token: state.customer.token });
    assertStatus(customerBookings, 200, 'booking list alias');
    assert(Array.isArray(customerBookings.payload?.data), 'booking list data');
    customerBookings.payload.data.forEach((booking, index) => {
      assertPopulatedBooking(booking, `booking list alias item ${index}`);
    });

    const customerMyBookings = await request('/api/bookings/my-bookings', { token: state.customer.token });
    assertStatus(customerMyBookings, 200, 'booking my-bookings');
    customerMyBookings.payload.data.forEach((booking, index) => {
      assertPopulatedBooking(booking, `booking my-bookings item ${index}`);
    });

    const plumberMyBookings = await request('/api/bookings/my-bookings', { token: state.plumber.token });
    assertStatus(plumberMyBookings, 200, 'plumber my-bookings');
    plumberMyBookings.payload.data.forEach((booking, index) => {
      assertPopulatedBooking(booking, `plumber my-bookings item ${index}`);
    });

    const adminBookings = await request('/api/bookings', { token: state.admin.token });
    assertStatus(adminBookings, 200, 'admin booking list');
    assert(adminBookings.payload?.data?.some((booking) => booking._id === state.bookingId), 'admin booking list contains seeded booking');

    const bookingDetailCustomer = await request(`/api/bookings/${state.bookingId}`, { token: state.customer.token });
    assertStatus(bookingDetailCustomer, 200, 'booking detail customer');
    assertPopulatedBooking(bookingDetailCustomer.payload?.data, 'booking detail customer');

    const bookingDetailPlumber = await request(`/api/bookings/${state.bookingId}`, { token: state.plumber.token });
    assertStatus(bookingDetailPlumber, 200, 'booking detail plumber');
    assertPopulatedBooking(bookingDetailPlumber.payload?.data, 'booking detail plumber');

    const bookingDetailAdmin = await request(`/api/bookings/${state.bookingId}`, { token: state.admin.token });
    assertStatus(bookingDetailAdmin, 200, 'booking detail admin');
    assertPopulatedBooking(bookingDetailAdmin.payload?.data, 'booking detail admin');

    const bookingDetailOtherCustomer = await request(`/api/bookings/${state.bookingId}`, { token: state.secondCustomer.token });
    assertStatus(bookingDetailOtherCustomer, 403, 'booking detail unauthorized');
    assertNoRawErrorDetails(bookingDetailOtherCustomer.payload, 'booking detail unauthorized error');

    const bookingDetailOtherPlumber = await request(`/api/bookings/${state.bookingId}`, { token: state.secondPlumber.token });
    assertStatus(bookingDetailOtherPlumber, 403, 'booking detail other plumber forbidden');
    assertNoRawErrorDetails(bookingDetailOtherPlumber.payload, 'booking detail other plumber error');

    const invalidCustomerStatusUpdate = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PUT',
      token: state.customer.token,
      body: { status: 'accepted' },
    });
    assertStatus(invalidCustomerStatusUpdate, 403, 'customer status update forbidden');
    assertNoRawErrorDetails(invalidCustomerStatusUpdate.payload, 'customer status update error');

    const unrelatedPlumberStatusUpdate = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PATCH',
      token: state.secondPlumber.token,
      body: { status: 'accepted' },
    });
    assertStatus(unrelatedPlumberStatusUpdate, 403, 'unrelated plumber status update forbidden');
    assertNoRawErrorDetails(unrelatedPlumberStatusUpdate.payload, 'unrelated plumber status update error');

    const reviewBeforeComplete = await request('/api/reviews', {
      method: 'POST',
      token: state.customer.token,
      body: {
        bookingId: state.bookingId,
        plumberId: state.plumber._id,
        rating: 5,
        comment: 'Very helpful and quick service.',
      },
    });
    assertStatus(reviewBeforeComplete, 400, 'review before booking completed');
    assertNoRawErrorDetails(reviewBeforeComplete.payload, 'review before complete error');

    const acceptBooking = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PATCH',
      token: state.plumber.token,
      body: { status: 'accepted' },
    });
    assertStatus(acceptBooking, 200, 'booking accept');
    assertPopulatedBooking(acceptBooking.payload?.data, 'booking accept');

    const invalidTransition = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PATCH',
      token: state.plumber.token,
      body: { status: 'pending' },
    });
    assertStatus(invalidTransition, 400, 'invalid booking transition');
    assertNoRawErrorDetails(invalidTransition.payload, 'invalid booking transition error');
    assert(invalidTransition.payload?.field === 'status', 'invalid booking transition field');

    const completeBooking = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PUT',
      token: state.plumber.token,
      body: { status: 'completed' },
    });
    assertStatus(completeBooking, 200, 'booking complete');
    assertPopulatedBooking(completeBooking.payload?.data, 'booking complete');
    logStep('booking create/list/detail/status flows verified');

    const reviewCreate = await request('/api/reviews', {
      method: 'POST',
      token: state.customer.token,
      body: {
        bookingId: state.bookingId,
        plumberId: state.plumber._id,
        rating: 5,
        comment: 'Very helpful and quick service.',
      },
    });
    assertStatus(reviewCreate, 201, 'review create');
    state.reviewId = reviewCreate.payload?.data?._id;
    assertReviewShape(reviewCreate.payload?.data, 'review create');

    const duplicateReview = await request('/api/reviews', {
      method: 'POST',
      token: state.customer.token,
      body: {
        bookingId: state.bookingId,
        plumberId: state.plumber._id,
        rating: 5,
        comment: 'Trying to post duplicate review.',
      },
    });
    assertStatus(duplicateReview, 409, 'duplicate review blocked');
    assertNoRawErrorDetails(duplicateReview.payload, 'duplicate review error');

    const plumberReviewForbidden = await request('/api/reviews', {
      method: 'POST',
      token: state.plumber.token,
      body: {
        bookingId: state.bookingId,
        plumberId: state.plumber._id,
        rating: 5,
        comment: 'Plumber should not be able to review.',
      },
    });
    assertStatus(plumberReviewForbidden, 403, 'plumber review forbidden');
    assertNoRawErrorDetails(plumberReviewForbidden.payload, 'plumber review forbidden error');

    const plumberReviews = await request(`/api/reviews/plumber/${state.plumber._id}`);
    assertStatus(plumberReviews, 200, 'review list');
    assert(Array.isArray(plumberReviews.payload?.data), 'review list data');
    plumberReviews.payload.data.forEach((review, index) => {
      assertReviewShape(review, `review list item ${index}`);
    });
    logStep('review create/list protections verified');

    const categoryList = await request('/api/categories');
    assertStatus(categoryList, 200, 'category list');
    assert(Array.isArray(categoryList.payload?.data), 'category list data');

    if (categoryList.payload.data.length > 0) {
      const categorySnapshots = await Category.find({}, '_id isActive').lean();

      try {
        await Category.updateMany({}, { $set: { isActive: false } });

        const emptyCategoryList = await request('/api/categories');
        assertStatus(emptyCategoryList, 200, 'empty category list');
        assert(Array.isArray(emptyCategoryList.payload?.data), 'empty category list data');
        assert(emptyCategoryList.payload.data.length === 0, 'empty category list returns []');
      } finally {
        await Promise.all(categorySnapshots.map((category) => (
          Category.updateOne({ _id: category._id }, { $set: { isActive: category.isActive } })
        )));
      }
    } else {
      assert(categoryList.payload.data.length === 0, 'category list empty array already safe');
    }

    const categoryCreateForbidden = await request('/api/categories', {
      method: 'POST',
      token: state.customer.token,
      body: {
        name: `Smoke Category ${runId}`,
        description: 'Should be blocked for customers',
      },
    });
    assertStatus(categoryCreateForbidden, 403, 'category create forbidden');
    assertNoRawErrorDetails(categoryCreateForbidden.payload, 'category create forbidden error');

    const categoryCreateAdmin = await request('/api/categories', {
      method: 'POST',
      token: state.admin.token,
      body: {
        name: `Smoke Category ${runId}`,
        description: 'Created by smoke test admin',
      },
    });
    assertStatus(categoryCreateAdmin, 201, 'category create admin');
    const categoryListAfterCreate = await request('/api/categories');
    assertStatus(categoryListAfterCreate, 200, 'category list after create');
    assert(Array.isArray(categoryListAfterCreate.payload?.data), 'category list after create data');
    assert(categoryListAfterCreate.payload.data.some((category) => category.name === `Smoke Category ${runId}`), 'category list contains admin-created category');
    logStep('category list/create permissions verified');

    console.log('Backend smoke test passed');
  } finally {
    await cleanupArtifacts();
    await mongoose.disconnect();
  }
};

main().catch(async (error) => {
  console.error(`Backend smoke test failed: ${error.message}`);
  try {
    await cleanupArtifacts();
    await mongoose.disconnect();
  } catch (cleanupError) {
    console.error(`Smoke test cleanup failed: ${cleanupError.message}`);
  }
  process.exit(1);
});
