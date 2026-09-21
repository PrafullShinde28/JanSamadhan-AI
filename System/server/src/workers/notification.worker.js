const { Worker } = require("bullmq");

const redis = require("../config/redis");

const NotificationService =
require("../services/notification/notification.service");

const worker = new Worker(

    "NOTIFICATION_QUEUE",

    async job => {

        await NotificationService.send(

            job.data

        );

    },

    {

        connection: redis

    }

);

module.exports = worker;