import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import { configureChatSockets } from './sockets/chatSocket.js';
import { getAllowedClientOrigins } from './utils/clientOrigins.js';
import { getJwtSecret } from './config/jwt.js';
import { ensureInitialData } from './utils/initDatabase.js';
import { checkEmailProviderStatus } from './utils/emailService.js';

// Load environment variables
dotenv.config();

const PORT = Number(process.env.PORT || 5001);

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: getAllowedClientOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;
    callback(null, !origin || getAllowedClientOrigins().includes(origin));
  },
});

configureChatSockets(io);

// Attach io instance to app for use in route controllers
app.set('io', io);

// Start server
const startServer = async () => {
  try {
    getJwtSecret();
    if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
      throw new Error('PORT must be a valid TCP port.');
    }
    if (process.env.NODE_ENV === 'production' && !getAllowedClientOrigins().length) {
      throw new Error('CLIENT_URL must contain at least one allowed origin in production.');
    }
    // Connect to MongoDB
    await connectDB();
    await ensureInitialData();

    checkEmailProviderStatus();

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn('⚠️  GOOGLE_CLIENT_ID is not configured in environment variables.');
    }

    server.listen(PORT, () => {
      console.log(`🚀 CampusBook Server running on http://localhost:${PORT}`);
      console.log(`🏥 Health Check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    const message = error.message.replace(
      /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
      '[redacted MongoDB URI]'
    );
    console.error('❌ Failed to start server:', message);
    process.exit(1);
  }
};

let isShuttingDown = false;
const shutdown = async (reason, error) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (error) console.error(`${reason}: ${error.message}`);
  else console.log(`${reason}: closing server gracefully.`);

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    await new Promise((resolve) => io.close(resolve));
    await mongoose.disconnect();
    clearTimeout(forceExit);
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    console.error(`Shutdown failed: ${shutdownError.message}`);
    process.exit(1);
  }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (error) => void shutdown('Unhandled rejection', error));
process.on('uncaughtException', (error) => void shutdown('Uncaught exception', error));

startServer().then(() => {
  // Keep Render free-tier alive by pinging health endpoint every 14 minutes.
  // Render automatically sets RENDER_EXTERNAL_URL for the service's public URL.
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const healthUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
    setInterval(() => {
      fetch(healthUrl, { method: 'GET' })
        .then(() => console.log('[keep-alive] health ping OK'))
        .catch((err) => console.warn('[keep-alive] health ping failed:', err.message));
    }, 14 * 60 * 1000); // 14 minutes
    console.log(`⏰  Keep-alive ping scheduled → ${healthUrl}`);
  }
});

export { server, io };
