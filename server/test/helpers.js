import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Book, Category, University, User } from '../src/models/index.js';

const testPasswords = new Map();

export const createUniversity = async (overrides = {}) => {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
  return University.create({
    name: `Test University ${suffix}`,
    code: `T${suffix}`.slice(0, 20),
    domain: `${suffix}.test`,
    city: 'Test City',
    state: 'Test State',
    country: 'India',
    ...overrides,
  });
};

export const createUser = async ({
  role = 'student',
  university,
  ...overrides
} = {}) => {
  const assignedUniversity = university || (await createUniversity());
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const password = overrides.password || 'Test-password-123';
  const user = await User.create({
    name: 'Test Student',
    email: `${suffix}@${assignedUniversity.domain}`,
    password,
    role,
    university: assignedUniversity._id,
    isVerified: true,
    verificationStatus: 'verified',
    ...overrides,
  });
  testPasswords.set(user.email, password);
  return user;
};

export const loginAndGetCookie = async (app, userOrCredentials) => {
  const credentials = {
    email: userOrCredentials.email,
    password:
      testPasswords.get(userOrCredentials.email) || userOrCredentials.password,
  };
  const response = await request(app).post('/api/auth/login').send(credentials);
  if (response.status !== 200) {
    throw new Error(
      `Test login failed with HTTP ${response.status}: ${response.body.message}`,
    );
  }
  const cookie = response.headers['set-cookie']?.find((value) =>
    value.startsWith('token='),
  );
  if (!cookie) throw new Error('Test login did not return the auth cookie.');
  return cookie.split(';')[0];
};

export const createBook = async ({
  seller,
  category,
  university,
  status = 'approved',
  listingType = 'sell',
  title = 'Test Algorithms Book',
  author = 'Test Author',
  sellingPrice = 50,
  originalPrice = 100,
  ...overrides
} = {}) => {
  const assignedUniversity = university || (await createUniversity());
  const assignedSeller =
    seller || (await createUser({ university: assignedUniversity }));
  const assignedCategory =
    category ||
    (await Category.create({
      name: `Test Category ${randomUUID().slice(0, 8)}`,
      slug: `test-${randomUUID().slice(0, 8)}`,
    }));
  return Book.create({
    title,
    author,
    category: assignedCategory._id,
    university: assignedUniversity._id,
    seller: assignedSeller._id,
    condition: 'Good',
    listingType,
    sellingPrice: listingType === 'sell' ? sellingPrice : 0,
    originalPrice,
    description: 'A sufficiently long test book description.',
    status,
    ...overrides,
  });
};

export const createTestIdentity = async (options = {}) => {
  const university = await createUniversity();
  const user = await createUser({ ...options, university });
  return { university, user };
};
