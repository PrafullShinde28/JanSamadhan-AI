const { Worker } = require("bullmq");

const redis = require("../config/redis");
const AIService = require("../services/ai/ai.service");

const worker = new Worker(
    "AI_QUEUE",

    async job => {

        const {
            complaintId
        } = job.data;

        console.log(
            "🤖 Processing Complaint:",
            complaintId
        );

        await AIService.processComplaint(
            complaintId
        );

    },

    {
        connection: redis
    }
);


worker.on(
    "completed",
    job => {

        console.log(
            "✅ AI Completed:",
            job.id
        );

    }
);


worker.on(
    "failed",
    (job, err) => {

        console.error(
            "❌ AI Failed:",
            job?.id,
            err.message
        );

    }
);


module.exports = worker;