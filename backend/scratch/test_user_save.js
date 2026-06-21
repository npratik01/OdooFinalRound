'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const authService = require('../src/services/auth.service');
const userService = require('../src/services/user.service');
const { connectDB } = require('../src/config/db');

async function test() {
  await connectDB();

  const email = 'test_admin_created@erp.com';
  const password = 'TestPassword123!';

  // Clean up
  await User.deleteOne({ email });

  console.log('1. Creating user via userService.createUser...');
  const user = await userService.createUser({
    name: 'Test User',
    email,
    password,
    role: 'SALES_USER',
  });
  console.log('Created user details returned (no password):', user);

  console.log('2. Querying user directly from DB with +password...');
  const userFromDb = await User.findOne({ email }).select('+password');
  console.log('User in DB:', userFromDb);
  console.log('Hashed password in DB:', userFromDb?.password);

  console.log('3. Attempting login via authService.login...');
  try {
    const result = await authService.login({ email, password });
    console.log('✅ Login successful! Token generated.');
  } catch (err) {
    console.error('❌ Login failed:', err);
  }

  await mongoose.connection.close();
}

test().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
