const cron = require('node-cron');
const { runScraper } = require('./jobScraper');

/**
 * Job Scheduler Configuration
 * Runs the scraper on a scheduled basis
 */

let scraperSchedule = null;

/**
 * Start the job scheduler
 * Runs every day at 2:00 AM
 */
function startJobScheduler() {
  // Cron pattern: minute hour day month dayOfWeek
  // '0 2 * * *' = 2:00 AM every day
  // '0 */6 * * *' = Every 6 hours
  
  scraperSchedule = cron.schedule('0 2 * * *', () => {
    console.log('[Job Scheduler] ⏰ Running scheduled job scraper...');
    runScraper().catch(error => {
      console.error('[Job Scheduler] ❌ Error running scraper:', error);
    });
  });

  console.log('[Job Scheduler] ✅ Job scraper scheduled to run daily at 2:00 AM');
}

/**
 * Start hourly scraper (more frequent)
 */
function startHourlyScheduler() {
  scraperSchedule = cron.schedule('0 * * * *', () => {
    console.log('[Job Scheduler] ⏰ Running hourly job scraper...');
    runScraper().catch(error => {
      console.error('[Job Scheduler] ❌ Error running scraper:', error);
    });
  });

  console.log('[Job Scheduler] ✅ Job scraper scheduled to run every hour');
}

/**
 * Stop the scheduler
 */
function stopJobScheduler() {
  if (scraperSchedule) {
    scraperSchedule.stop();
    console.log('[Job Scheduler] ⛔ Job scheduler stopped');
  }
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    isRunning: scraperSchedule && !scraperSchedule.stopped,
    nextRun: scraperSchedule ? 'Check logs for details' : 'Not scheduled',
  };
}

module.exports = {
  startJobScheduler,
  startHourlyScheduler,
  stopJobScheduler,
  getSchedulerStatus,
};
