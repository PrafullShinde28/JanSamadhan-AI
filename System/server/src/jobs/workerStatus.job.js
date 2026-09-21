const cron = require("node-cron");

const User =
require("../models/User");

module.exports = () => {

    cron.schedule(

        "*/10 * * * *",

        async () => {

            console.log("Checking Worker Availability for disconnected field agents...");

            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

            // Only mark offline if the worker is NOT actively online (isOnline is false)
            // and their location heartbeat or last seen is older than 10 minutes,
            // and they are not currently marked "On Leave"
            await User.updateMany(
                {
                    role: "Worker",
                    isOnline: false,
                    availability: { $in: ["Available", "Busy"] },
                    $or: [
                        { "liveLocation.lastUpdated": { $lt: tenMinutesAgo } },
                        { lastSeenAt: { $lt: tenMinutesAgo } }
                    ]
                },
                {
                    availability: "Offline"
                }
            );

        }

    );

};