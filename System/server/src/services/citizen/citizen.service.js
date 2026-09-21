const Complaint = require("../../models/Complaint");
const TimelineService = require("../timeline/timeline.service");
const NotificationService = require("../notification/notification.service");
const User = require("../../models/User");

class CitizenService {

    /* ============================================================
   GET MY COMPLAINTS
============================================================ */

static async getMyComplaints(citizen) {

    if (!citizen) {
        throw new Error("Authenticated citizen is required");
    }

    return Complaint.find({
        citizen: citizen._id,
        isActive: true
    })
        .populate("assignment.department", "name code icon color")
        .populate(
            "assignment.worker",
            "fullName firstName lastName availability"
        )
        .sort({
            createdAt: -1
        })
        .lean();
}


/* ============================================================
   GET COMPLAINT DETAILS
============================================================ */

static async getComplaintDetails(
    complaintId,
    citizen
) {

    if (!citizen) {
        throw new Error("Authenticated citizen is required");
    }

    const complaint =
        await Complaint.findOne({

            _id: complaintId,

            citizen: citizen._id,

            isActive: true

        })
        .populate(
            "assignment.department",
            "name code description icon color"
        )
        .populate(
            "assignment.worker",
            "fullName firstName lastName availability skills"
        )
        .lean();

    if (!complaint) {
        throw new Error(
            "Complaint not found or access denied"
        );
    }

    return complaint;
}


/* ============================================================
   GET COMPLAINT TIMELINE
============================================================ */

static async getComplaintTimeline(
    complaintId,
    citizen
) {

    if (!citizen) {
        throw new Error("Authenticated citizen is required");
    }

    const complaint =
        await Complaint.findOne({

            _id: complaintId,

            citizen: citizen._id,

            isActive: true

        }).select("_id");

    if (!complaint) {
        throw new Error(
            "Complaint not found or access denied"
        );
    }

    return TimelineService.getTimeline(
        complaint._id
    );
}
    /* ============================================================
   REOPEN COMPLAINT
============================================================ */

static async reopenComplaint(
    complaintId,
    citizen,
    reason = ""
) {

    /* ========================================================
       VERIFY CITIZEN
    ======================================================== */

    if (!citizen) {

        throw new Error(
            "Authenticated citizen is required"
        );

    }

    if (citizen.role !== "Citizen") {

        throw new Error(
            "Only citizens can reopen complaints"
        );

    }


    /* ========================================================
       FIND COMPLAINT
    ======================================================== */

    const complaint =
        await Complaint.findById(
            complaintId
        );

    if (!complaint) {

        throw new Error(
            "Complaint not found"
        );

    }


    /* ========================================================
       OWNERSHIP CHECK
    ======================================================== */

    if (
        complaint.citizen.toString() !==
        citizen._id.toString()
    ) {

        throw new Error(
            "You are not authorized to reopen this complaint"
        );

    }


    /* ========================================================
       STATUS CHECK
    ======================================================== */
        if (complaint.status !== "Resolved") {

            throw new Error(
                `Complaint cannot be reopened from ${complaint.status} status`
            );

        }

    /* ========================================================
       UPDATE COMPLAINT
    ======================================================== */

    complaint.status =
        "In Progress";


    complaint.feedback.reopenRequested =
        true;


    complaint.feedback.confirmed =
        false;


    complaint.feedback.comment =
        reason;


    /* Reset final resolution approval */

    complaint.resolution.adminVerified =
        false;


    complaint.resolution.aiVerified =
        false;


    complaint.resolution.isResolved =
        false;


    await complaint.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Complaint Reopened",

        performerRole:
            "Citizen",

        performedBy:
            citizen._id,

        status:
            "In Progress",

        description:
            "Citizen reported that the issue was not satisfactorily resolved and reopened the complaint.",

        remarks:
            reason,

        metadata: {

            previousStatus:
                "Resolved/Closed",

            reopenReason:
                reason

        }

    });


    /* ========================================================
       NOTIFY WORKER
    ======================================================== */

    const workerId =
        complaint.assignment?.worker;

    if (workerId) {

        const worker =
            await User.findById(
                workerId
            );

        if (worker) {

            await NotificationService.send({

                recipient:
                    worker._id,

                recipientClerkId:
                    worker.clerkId,

                complaint:
                    complaint._id,

                title:
                    "Complaint Reopened",

                message:
                    `Complaint ${complaint.complaintNumber} has been reopened by the citizen. Please inspect the issue again.`,

                type:
                    "Complaint Reopened",

                priority:
                    "High",

                actionUrl:
                    `/worker/complaints/${complaint._id}`,

                icon:
                    "alert-circle"

            });

        }

    }


    /* ========================================================
       NOTIFY ADMIN
    ======================================================== */

    const admins =
        await User.find({

            role: "Admin",

            isActive: true

        });


    for (const admin of admins) {

        await NotificationService.send({

            recipient:
                admin._id,

            recipientClerkId:
                admin.clerkId,

            complaint:
                complaint._id,

            title:
                "Complaint Reopened",

            message:
                `Citizen reopened complaint ${complaint.complaintNumber}. Further action is required.`,

            type:
                "Complaint Reopened",

            priority:
                "High",

            actionUrl:
                `/admin/complaints/${complaint._id}`,

            icon:
                "alert-circle",

            metadata: {

                reason

            }

        });

    }


    return complaint;

}
    /* ============================================================
       SUBMIT FEEDBACK
    ============================================================ */

    static async submitFeedback(
        complaintId,
        citizen,
        data
    ) {

        /* ========================================================
           FIND COMPLAINT
        ======================================================== */

        const complaint =
            await Complaint.findById(complaintId);

        if (!complaint) {

            throw new Error(
                "Complaint not found"
            );

        }


        /* ========================================================
           VERIFY CITIZEN
        ======================================================== */

        if (
            complaint.citizen.toString() !==
            citizen._id.toString()
        ) {

            throw new Error(
                "You are not authorized to provide feedback for this complaint"
            );

        }


        /* ========================================================
           VALIDATE FEEDBACK
        ======================================================== */

        const confirmed =
            data.confirmed;

        const rating =
            Number(data.rating);

        const comment =
            data.comment || "";


        if (
            typeof confirmed !== "boolean"
        ) {

            throw new Error(
                "confirmed must be true or false"
            );

        }


        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {

            throw new Error(
                "Rating must be between 1 and 5"
            );

        }


        /* ========================================================
           PREVENT DUPLICATE FEEDBACK
        ======================================================== */

        if (
            complaint.feedback &&
            complaint.feedback.submittedAt
        ) {

            throw new Error(
                "Feedback has already been submitted for this complaint"
            );

        }


        /* ========================================================
           SAVE FEEDBACK
        ======================================================== */

        complaint.feedback.confirmed =
            confirmed;

        complaint.feedback.rating =
            rating;

        complaint.feedback.comment =
            comment;

        complaint.feedback.submittedAt =
            new Date();

        complaint.feedback.reopenRequested =
            !confirmed;


        /* ========================================================
           CITIZEN CONFIRMED RESOLUTION
        ======================================================== */

        if (confirmed) {

            /*
             * IMPORTANT:
             *
             * Citizen does NOT directly close
             * the complaint.
             *
             * Admin still has final authority.
             */

            complaint.status =
                "Resolved";

        }


        /* ========================================================
           CITIZEN REJECTED RESOLUTION
        ======================================================== */

        else {

            complaint.status =
                "In Progress";

            complaint.resolution.isResolved =
                false;
            complaint.resolution.aiVerified = false;
            complaint.resolution.adminVerified = false;
            complaint.resolution.verificationScore = 0;
            complaint.resolution.resolvedAt = null;
            complaint.resolution.resolvedBy = null;

        }


        await complaint.save();


        /* ========================================================
           TIMELINE
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                confirmed
                    ? "Citizen Feedback Submitted"
                    : "Complaint Reopened",

            performerRole:
                "Citizen",

            performedBy:
                citizen._id,

            status:
                complaint.status,

            description:
                confirmed

                    ? "Citizen confirmed that the reported issue has been resolved."

                    : "Citizen reported that the issue has not been completely resolved and requested reopening.",

            remarks:
                comment,

            metadata: {

                confirmed,

                rating,

                reopenRequested:
                    !confirmed

            }

        });


        /* ========================================================
           NOTIFY WORKER
        ======================================================== */

        if (
            complaint.assignment?.worker
        ) {

            const worker =
                await User.findById(
                    complaint.assignment.worker
                );

            if (worker) {

                await NotificationService.send({

                    recipient:
                        worker._id,

                    recipientClerkId:
                        worker.clerkId,

                    complaint:
                        complaint._id,

                    title:
                        confirmed
                            ? "Citizen Confirmed Resolution"
                            : "Complaint Reopened",

                    message:
                        confirmed

                            ? "The citizen confirmed that the complaint has been resolved."

                            : "The citizen reported that the issue is still present. Please review the complaint and continue the work.",

                    type:
                        confirmed
                            ? "Feedback Submitted"
                            : "Complaint Reopened",

                    priority:
                        confirmed
                            ? "Medium"
                            : "High",

                    actionUrl:
                        `/worker/complaints/${complaint._id}`,

                    icon:
                        confirmed
                            ? "check-circle"
                            : "alert-circle",

                    metadata: {

                        rating,

                        confirmed,

                        reopenRequested:
                            !confirmed

                    }

                });

            }

        }


        /* ========================================================
           NOTIFY ADMINS
        ======================================================== */

        const admins =
            await User.find({

                role: "Admin",

                isActive: true

            });


        for (
            const admin of admins
        ) {

            await NotificationService.send({

                recipient:
                    admin._id,

                recipientClerkId:
                    admin.clerkId,

                complaint:
                    complaint._id,

                title:
                    confirmed
                        ? "Citizen Confirmed Resolution"
                        : "Complaint Reopened",

                message:
                    confirmed

                        ? `Citizen confirmed complaint ${complaint.complaintNumber} as resolved. Admin verification is required before closure.`

                        : `Citizen rejected the resolution for complaint ${complaint.complaintNumber}. The complaint has been reopened.`,

                type:
                    confirmed
                        ? "Feedback Submitted"
                        : "Complaint Reopened",

                priority:
                    confirmed
                        ? "Medium"
                        : "High",

                actionUrl:
                    `/admin/complaints/${complaint._id}`,

                icon:
                    confirmed
                        ? "check-circle"
                        : "alert-circle",

                metadata: {

                    rating,

                    confirmed,

                    reopenRequested:
                        !confirmed

                }

            });

        }


        /* ========================================================
           RETURN
        ======================================================== */

        return complaint;

    }

}


module.exports =
    CitizenService;