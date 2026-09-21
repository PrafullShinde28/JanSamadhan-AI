const { Queue } = require("bullmq");

const redis = require("../config/redis");

const notificationQueue = new Queue(

    "NOTIFICATION_QUEUE",

    {

        connection: redis

    }

);

module.exports = notificationQueue;