import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth.routes.js';
import { categoryRouter } from './routes/categories.routes.js';
import { staffRouter } from './routes/staff.routes.js';
import { initializeSLAJobs, stopSLAJobs } from './jobs/slaMonitor.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus';

// Middleware
app.use(cors());
app.use(express.json());

// ============ DATABASE CONNECTION ============
let mongoConnection = null;
let slaJobs = null;

const connectDatabase = async () => {
  try {
    mongoConnection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');

    // Initialize SLA monitoring jobs after DB connection
    slaJobs = initializeSLAJobs();
  } catch (error) {
    console.error('❌ Failed to connect MongoDB:', error.message);
    process.exit(1);
  }
};

// Connect to database on startup
connectDatabase();

// ============ HEALTH CHECK ============
app.get('/api/health', (_, res) => {
  res.status(200).json({
    ok: true,
    service: 'smart-campus-backend',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ============ ROUTES ============
app.use('/api/auth', authRouter);
app.use('/api', categoryRouter);
app.use('/api', staffRouter);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    ok: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');

  // Stop background jobs
  if (slaJobs) {
    stopSLAJobs(slaJobs);
  }

  // Close database connection
  if (mongoConnection) {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
  }

  // Close server
  server.close(() => {
    console.log('✅ Server shut down');
    process.exit(0);
  });
});

// ============ START SERVER ============
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${MONGODB_URI}`);
});
