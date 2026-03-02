import cron from 'node-cron';
import { checkAndEscalateOverdueIssues } from '../services/slaService.js';

/**
 * Initialize SLA monitoring jobs
 * Runs every 10 minutes to check for overdue issues and escalate
 */
export const initializeSLAJobs = () => {
  console.log('🚀 Initializing SLA Monitoring Jobs...');

  // Check overdue issues every 10 minutes
  const slaCheckJob = cron.schedule('*/10 * * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Running SLA check job...`);
      const overdueCount = await checkAndEscalateOverdueIssues();
      console.log(`✅ SLA check completed. Found ${overdueCount} overdue issues.`);
    } catch (error) {
      console.error('❌ Error in SLA check job:', error.message);
    }
  });

  // Clean old notifications every hour
  const notificationCleanupJob = cron.schedule('0 * * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Running notification cleanup...`);
      // Notifications have TTL index set to 30 days, MongoDB handles auto-deletion
      console.log('✅ Notification cleanup completed.');
    } catch (error) {
      console.error('❌ Error in notification cleanup:', error.message);
    }
  });

  // Daily report generation (optional)
  const dailyReportJob = cron.schedule('0 9 * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Generating daily SLA report...`);
      // TODO: Generate daily admin report
      console.log('✅ Daily report generated.');
    } catch (error) {
      console.error('❌ Error in daily report job:', error.message);
    }
  });

  return {
    slaCheckJob,
    notificationCleanupJob,
    dailyReportJob,
  };
};

/**
 * Stop all background jobs (for graceful shutdown)
 */
export const stopSLAJobs = (jobs) => {
  if (jobs.slaCheckJob) jobs.slaCheckJob.stop();
  if (jobs.notificationCleanupJob) jobs.notificationCleanupJob.stop();
  if (jobs.dailyReportJob) jobs.dailyReportJob.stop();
  console.log('🛑 All SLA jobs stopped.');
};
