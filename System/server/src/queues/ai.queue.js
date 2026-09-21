const { Queue } = require("bullmq");

const redis = require("../config/redis");

const aiQueue = new Queue("AI_QUEUE", {

    connection: redis

});

module.exports = aiQueue;