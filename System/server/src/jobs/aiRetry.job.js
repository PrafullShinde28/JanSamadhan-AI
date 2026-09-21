const cron = require("node-cron");

const Complaint =
require("../models/Complaint");

const aiQueue =
require("../queues/ai.queue");

module.exports = () => {

    cron.schedule(

        "*/15 * * * *",

        async () => {

            console.log(

                "Retrying Failed AI Jobs..."

            );

            const complaints =
                await Complaint.find({

                    "ai.processed": false

                });

            for (const complaint of complaints) {

                await aiQueue.add(

                    "PROCESS_COMPLAINT",

                    {

                        complaintId:
                            complaint._id

                    }

                );

            }

        }

    );

};