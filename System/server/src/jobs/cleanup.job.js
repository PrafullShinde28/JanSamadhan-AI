const cron = require("node-cron");

const Notification =
require("../models/Notification");

module.exports = () => {

    cron.schedule(

        "0 2 * * *",

        async () => {

            console.log(

                "Running Cleanup Job..."

            );

            const thirtyDaysAgo =
                new Date();

            thirtyDaysAgo.setDate(

                thirtyDaysAgo.getDate() - 30

            );

            await Notification.deleteMany({

                createdAt: {

                    $lt: thirtyDaysAgo

                }

            });

            console.log(

                "Cleanup Completed"

            );

        }

    );

};