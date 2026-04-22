const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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
};

const request = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
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

const logStep = (message) => {
  console.log(`- ${message}`);
};

const createApiUser = async ({ name, role, password, extra = {} }) => {
  const email = `${role}.${runId}.${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
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
  return response.payload?.data || null;
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
    state.customer = resetOtpResult.payload.data;
    await loginApiUser({ email: customerSeed.email, password: 'Customer456!' });

    const resetTokenPost = await issueResetOtp(customerSeed.email);
    const resetTokenPostResult = await request(`/api/auth/reset-password/${resetTokenPost}`, {
      method: 'POST',
      body: { password: 'Customer789!' },
    });
    assertStatus(resetTokenPostResult, 200, 'token reset password POST');
    state.customer = resetTokenPostResult.payload.data;
    await loginApiUser({ email: customerSeed.email, password: 'Customer789!' });

    const resetTokenPut = await issueResetOtp(customerSeed.email);
    const resetTokenPutResult = await request(`/api/auth/reset-password/${resetTokenPut}`, {
      method: 'PUT',
      body: { password: 'Customer999!' },
    });
    assertStatus(resetTokenPutResult, 200, 'token reset password PUT');
    state.customer = resetTokenPutResult.payload.data;
    await loginApiUser({ email: customerSeed.email, password: 'Customer999!' });
    logStep('password reset OTP and token route compatibility verified');

    const missingTokenResult = await request('/api/bookings');
    assertStatus(missingTokenResult, 401, 'missing token rejected');

    const invalidTokenResult = await request('/api/bookings', {
      token: 'not-a-valid-token',
    });
    assertStatus(invalidTokenResult, 401, 'invalid token rejected');

    const expiredToken = jwt.sign(
      { id: state.customer._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const expiredTokenResult = await request('/api/bookings', {
      token: expiredToken,
    });
    assertStatus(expiredTokenResult, 401, 'expired token rejected');
    logStep('auth guard token failures verified');

    const plumbersList = await request('/api/plumbers');
    assertStatus(plumbersList, 200, 'plumber list');
    assert(Array.isArray(plumbersList.payload?.data), 'plumber list array');

    const plumberDetail = await request(`/api/plumbers/${state.plumber._id}`);
    assertStatus(plumberDetail, 200, 'plumber detail');
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
    state.bookingId = bookingCreate.payload.data._id;

    const customerBookings = await request('/api/bookings', { token: state.customer.token });
    assertStatus(customerBookings, 200, 'booking list alias');
    assert(Array.isArray(customerBookings.payload?.data), 'booking list data');

    const customerMyBookings = await request('/api/bookings/my-bookings', { token: state.customer.token });
    assertStatus(customerMyBookings, 200, 'booking my-bookings');

    const bookingDetailCustomer = await request(`/api/bookings/${state.bookingId}`, { token: state.customer.token });
    assertStatus(bookingDetailCustomer, 200, 'booking detail customer');
    assert(bookingDetailCustomer.payload?.data?.plumberId?.name, 'booking detail plumber populated');

    const bookingDetailPlumber = await request(`/api/bookings/${state.bookingId}`, { token: state.plumber.token });
    assertStatus(bookingDetailPlumber, 200, 'booking detail plumber');

    const bookingDetailOtherCustomer = await request(`/api/bookings/${state.bookingId}`, { token: state.secondCustomer.token });
    assertStatus(bookingDetailOtherCustomer, 403, 'booking detail unauthorized');

    const bookingDetailOtherPlumber = await request(`/api/bookings/${state.bookingId}`, { token: state.secondPlumber.token });
    assertStatus(bookingDetailOtherPlumber, 403, 'booking detail other plumber forbidden');

    const invalidCustomerStatusUpdate = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PUT',
      token: state.customer.token,
      body: { status: 'accepted' },
    });
    assertStatus(invalidCustomerStatusUpdate, 403, 'customer status update forbidden');

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

    const acceptBooking = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PATCH',
      token: state.plumber.token,
      body: { status: 'accepted' },
    });
    assertStatus(acceptBooking, 200, 'booking accept');

    const invalidTransition = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PATCH',
      token: state.plumber.token,
      body: { status: 'pending' },
    });
    assertStatus(invalidTransition, 400, 'invalid booking transition');

    const completeBooking = await request(`/api/bookings/${state.bookingId}/status`, {
      method: 'PUT',
      token: state.plumber.token,
      body: { status: 'completed' },
    });
    assertStatus(completeBooking, 200, 'booking complete');
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
    assert(reviewCreate.payload?.data?.customerId?.name, 'review customer populated');

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

    const plumberReviews = await request(`/api/reviews/plumber/${state.plumber._id}`);
    assertStatus(plumberReviews, 200, 'review list');
    assert(Array.isArray(plumberReviews.payload?.data), 'review list data');
    assert(plumberReviews.payload?.data?.[0]?.customerId?.name, 'review list customer name only');
    logStep('review create/list protections verified');

    const categoryList = await request('/api/categories');
    assertStatus(categoryList, 200, 'category list');

    const categoryCreateForbidden = await request('/api/categories', {
      method: 'POST',
      token: state.customer.token,
      body: {
        name: `Smoke Category ${runId}`,
        description: 'Should be blocked for customers',
      },
    });
    assertStatus(categoryCreateForbidden, 403, 'category create forbidden');

    const categoryCreateAdmin = await request('/api/categories', {
      method: 'POST',
      token: state.admin.token,
      body: {
        name: `Smoke Category ${runId}`,
        description: 'Created by smoke test admin',
      },
    });
    assertStatus(categoryCreateAdmin, 201, 'category create admin');
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
