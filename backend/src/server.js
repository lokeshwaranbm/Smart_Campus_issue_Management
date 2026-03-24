import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth.routes.js';
import { categoryRouter } from './routes/categories.routes.js';
import { staffRouter } from './routes/staff.routes.js';
import { issueRouter } from './routes/issues.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { initializeSLAJobs, stopSLAJobs } from './jobs/slaMonitor.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-campus';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

let mongoConnection = null;
let slaJobs = null;
let activeMongoUri = MONGODB_URI;
let server = null;

app.use(
  cors({
    origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

const connectDatabase = async () => {
  try {
    mongoConnection = await mongoose.connect(MONGODB_URI);
    activeMongoUri = MONGODB_URI;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect MongoDB:', error.message);
    throw new Error('Database connection failed. Set a valid MONGODB_URI for your real MongoDB instance.');
  }

  // Initialize SLA monitoring jobs after DB connection
  slaJobs = initializeSLAJobs();
};

app.get('/api/health', (_, res) => {
  res.status(200).json({
    ok: true,
    service: 'smart-campus-backend',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRouter);
app.use('/api', categoryRouter);
app.use('/api', staffRouter);
app.use('/api', issueRouter);
app.use('/api', settingsRouter);

app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    ok: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const shutdown = async (signal) => {
  console.log(`🛑 ${signal} received. Shutting down gracefully...`);

  if (slaJobs) {
    stopSLAJobs(slaJobs);
  }

  if (mongoConnection) {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
  }

  if (server) {
    server.close(() => {
      console.log('✅ Server shut down');
      process.exit(0);
    });
    return;
  }

  process.exit(0);
};

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});

process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});

const startServer = async () => {
  await connectDatabase();

  server = app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${activeMongoUri}`);
  });
};

startServer().catch((error) => {
  console.error('💥 Failed to start backend:', error.message);
  process.exit(1);
});
