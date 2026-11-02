import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-only-jwt-secret-with-at-least-32-characters';
process.env.GOOGLE_CLIENT_ID = 'test-google-client.apps.googleusercontent.com';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/campusbook-test-only';
process.env.EMAIL_HOST = 'smtp.test.invalid';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test-user';
process.env.EMAIL_PASS = 'test-password';
process.env.EMAIL_FROM = 'CampusBook <test@example.invalid>';

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn(async () => ({ messageId: 'offline-test-message' })),
    })),
  },
}));

jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
  uploadToCloudinary: jest.fn(async () => ({
    url: 'https://example.invalid/test-book.jpg',
    public_id: 'test-image',
  })),
  deleteFromCloudinary: jest.fn(async () => ({ result: 'ok' })),
  default: {},
}));

jest.unstable_mockModule('socket.io', () => ({
  Server: jest.fn(),
}));

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: jest.fn(async () => {
      throw new Error('Invalid mocked Google token');
    }),
  })),
}));

const mongoose = (await import('mongoose')).default;
const { MongoMemoryServer } = await import('mongodb-memory-server');
const { sensitiveAuthLimiter } = await import('../src/middlewares/rateLimiter.js');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri('campusbook-test-only');
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  await sensitiveAuthLimiter.resetKey('127.0.0.1');
  if (mongoose.connection.readyState === 1) {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) =>
        collection.deleteMany({}),
      ),
    );
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});
