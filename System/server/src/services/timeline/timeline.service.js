const Timeline = require("../../models/Timeline");

class TimelineService {

    /* ============================================================
       CREATE TIMELINE EVENT
    ============================================================ */

    static async log({

        complaint,

        eventType,

        performerRole,

        performedBy = null,

        status = null,

        description = "",

        remarks = "",

        metadata = {},

        location = null,

        attachments = [],

        isVisibleToCitizen = true

    }) {

        return Timeline.create({

            complaint,

            eventType,

            performerRole,

            performedBy,

            status,

            description,

            remarks,

            metadata,

            location,

            attachments,

            isVisibleToCitizen

        });

    }

    /* ============================================================
       GET TIMELINE
    ============================================================ */

    static async getTimeline(complaintId) {

        return Timeline.find({

            complaint: complaintId

        })

        .populate("performedBy")

        .sort({

            createdAt: 1

        });

    }

    /* ============================================================
       GET LATEST EVENT
    ============================================================ */

    static async getLatestEvent(complaintId) {

        return Timeline.findOne({

            complaint: complaintId

        })

        .sort({

            createdAt: -1

        });

    }

    /* ============================================================
       DELETE TIMELINE
    ============================================================ */

    static async deleteTimeline(complaintId) {

        return Timeline.deleteMany({

            complaint: complaintId

        });

    }

}

module.exports = TimelineService;