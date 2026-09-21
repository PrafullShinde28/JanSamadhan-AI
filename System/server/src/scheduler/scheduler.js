const startCleanupJob = require("../jobs/cleanup.job");
const startReminderJob = require("../jobs/reminder.job");
const startReportJob = require("../jobs/report.job");
const startAIRetryJob = require("../jobs/aiRetry.job");
const startWorkerStatusJob = require("../jobs/workerStatus.job");

const initializeScheduler = () => {

    console.log("Starting Scheduled Jobs...");

    startCleanupJob();

    startReminderJob();

    startReportJob();

    startAIRetryJob();

    startWorkerStatusJob();

};

module.exports = initializeScheduler;