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
const DB_NAME = process.env.DB_NAME || 'smart-campus';
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

let mongoConnection = null;
let slaJobs = null;
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
  if (!MONGODB_URI) {
    throw new Error('Missing MONGO_URI (or MONGODB_URI). Set your MongoDB Atlas connection string in environment variables.');
  }

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB connected (${mongoose.connection.name})`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });

  try {
    mongoConnection = await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    console.error('❌ Failed to connect MongoDB:', error.message);
    throw new Error('Database connection failed. Verify MONGO_URI/MONGODB_URI, DB_NAME, Atlas user/network access, and retry.');
  }

  // Initialize SLA monitoring jobs after DB connection
  slaJobs = initializeSLAJobs();
};

app.get('/', (req, res) => {
  res.send('✅ Backend is running successfully');
});

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
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 Database: ${DB_NAME}`);
  });
};

startServer().catch((error) => {
  console.error('💥 Failed to start backend:', error.message);
  process.exit(1);
});
