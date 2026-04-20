const cron = require("node-cron");
const rentalService = require("./rentalService");

let schedulerStarted = false;

async function runSchedulerSweep() {
  try {
    await rentalService.processDueNotifications();
  } catch (error) {
    console.error("Notification scheduler error:", error.message);
  }
}

function startNotificationScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;
  const cronExpression = process.env.NOTIFICATION_CRON || "0 * * * *";

  cron.schedule(cronExpression, runSchedulerSweep, {
    timezone: process.env.APP_TIMEZONE || "Asia/Seoul",
  });

  runSchedulerSweep();
}

module.exports = {
  startNotificationScheduler,
};
