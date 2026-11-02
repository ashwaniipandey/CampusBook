import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exchangeRoutes from './routes/exchangeRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import smartRoutes from './routes/smartRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import {
  sanitizeRequestInputs,
  validateRequestShape,
} from './middlewares/requestSecurity.js';
import { validateAllowedQuery } from './validations/requestValidation.js';
import { getAllowedClientOrigins } from './utils/clientOrigins.js';
import { AppError } from './middlewares/errorHandler.js';
import openApiSpecification from './docs/openapi.js';

// Load environment variables
dotenv.config();

const app = express();
const allowedOrigins = getAllowedClientOrigins();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError('Origin not allowed by CORS policy.', 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use(cookieParser());
app.use('/api', mongoSanitize({ replaceWith: '_' }));
app.use('/api', hpp());
app.use('/api', sanitizeRequestInputs);
app.use('/api', validateRequestShape);
app.use('/api', apiLimiter);

// Development logging
if (process.env.NODE_ENV !== 'test') {
  morgan.token('safe-path', (req) => req.path);
  app.use(morgan(':remote-addr :method :safe-path :status :res[content-length] - :response-time ms'));
}

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', validateAllowedQuery(), async (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  let isDatabaseConnected = mongoose.connection.readyState === 1;
  if (isDatabaseConnected) {
    try {
      await mongoose.connection.db.admin().ping();
    } catch {
      isDatabaseConnected = false;
    }
  }
  res.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? 'ok' : 'error',
    service: 'CampusBook API',
    environment: process.env.NODE_ENV || 'development',
    database: isDatabaseConnected ? dbStatus : 'unavailable',
    databaseConnected: isDatabaseConnected,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/smart', smartRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/public', publicRoutes);

if (
  process.env.NODE_ENV !== 'production' ||
  process.env.ENABLE_DOCS === 'true'
) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));
}

app.use('/api', notFoundHandler);

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CampusBook REST API',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

app.use(notFoundHandler);

// Central global error handler
app.use(errorHandler);

export default app;
