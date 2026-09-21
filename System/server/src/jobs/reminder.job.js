const cron = require("node-cron");

const Complaint =
require("../models/Complaint");

const NotificationService =
require("../services/notification/notification.service");

module.exports = () => {

    cron.schedule(

        "0 */6 * * *",

        async () => {

            console.log(

                "Checking Pending Complaints..."

            );

            const complaints =
                await Complaint.find({

                    status: {

                        $in: [

                            "Pending",

                            "Assigned",

                            "In Progress"

                        ]

                    }

                });

            for (const complaint of complaints) {

                await NotificationService.send({

                    recipient:
                        complaint.citizen,

                    recipientClerkId:
                        complaint.citizenClerkId,

                    complaint:
                        complaint._id,

                    title:
                        "Complaint Reminder",

                    message:
                        `Complaint ${complaint.complaintNumber} is still under process.`,

                    type:
                        "System"

                });

            }

        }

    );

};