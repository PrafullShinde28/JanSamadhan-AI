const User = require("../../models/User");
const Complaint =
    require("../../models/Complaint");
const AIGateway =
    require("../ai/ai.gateway");

const TimelineService =
    require("../timeline/timeline.service");

const NotificationService =
    require("../notification/notification.service");

const CloudinaryService =
    require("../cloudinary/cloudinary.service");
const {
    calculateDistanceMeters
} = require("../../utils/distance");
const {
    isWithinRadius
} = require("../../utils/location.util");

class WorkerService {

    /* ============================================================
   VALIDATE WORKER LOCATION
============================================================ */

static validateWorkerLocation(
    complaint,
    latitude,
    longitude,
    radiusMeters = 100
) {

    if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null
    ) {

        throw new Error(
            "Worker GPS location is required"
        );

    }


    const complaintCoordinates =
        complaint.location?.coordinates;


    if (
        !complaintCoordinates ||
        complaintCoordinates.length !== 2
    ) {

        throw new Error(
            "Complaint GPS location is unavailable"
        );

    }


    const [
        complaintLongitude,
        complaintLatitude
    ] = complaintCoordinates;


    const result =
        isWithinRadius(

            complaintLatitude,

            complaintLongitude,

            latitude,

            longitude,

            radiusMeters

        );


    if (!result.withinRadius) {

        throw new Error(

            `Worker is ${result.distanceMeters.toFixed(1)} meters away from the complaint location. Worker must be within ${radiusMeters} meters.`

        );

    }


    return result;

}
    /* ============================================================
   GET WORKER PROFILE / DASHBOARD
============================================================ */

static async getDashboard(worker) {

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can access worker dashboard"
        );
    }

    const workerId = worker._id;


    /* ========================================================
       COMPLAINT COUNTS
    ======================================================== */

    const [

        totalAssigned,

        pending,

        assigned,

        inProgress,

        resolved,

        closed

    ] = await Promise.all([

        Complaint.countDocuments({
            "assignment.worker": workerId,
            isActive: true
        }),

        Complaint.countDocuments({
            "assignment.worker": workerId,
            status: "Pending",
            isActive: true
        }),

        Complaint.countDocuments({
            "assignment.worker": workerId,
            status: "Assigned",
            isActive: true
        }),

        Complaint.countDocuments({
            "assignment.worker": workerId,
            status: "In Progress",
            isActive: true
        }),

        Complaint.countDocuments({
            "assignment.worker": workerId,
            status: "Resolved",
            isActive: true
        }),

        Complaint.countDocuments({
            "assignment.worker": workerId,
            status: "Closed",
            isActive: true
        })

    ]);


    /* ========================================================
       WORKER PROFILE
    ======================================================== */

    const profile =
        await User.findById(workerId)
            .select(
                "firstName lastName fullName email role department skills availability workload performance liveLocation notificationSettings"
            )
            .populate(
                "department",
                "name code icon color"
            )
            .lean();


    if (!profile) {

        throw new Error(
            "Worker profile not found"
        );

    }


    return {

        profile,

        statistics: {

            totalAssigned,

            pending,

            assigned,

            inProgress,

            resolved,

            closed,

            active:
                assigned + inProgress

        }

    };

}

/* ============================================================
   GET MY ASSIGNED COMPLAINTS
============================================================ */

static async getAssignedComplaints(
    worker,
    status = null
) {

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can access assigned complaints"
        );
    }


    const query = {

        "assignment.worker":
            worker._id,

        isActive: true

    };


    if (status) {

        query.status = status;

    }


    return Complaint.find(query)

        .populate(
            "citizen",
            "name email phone"
        )

        .populate(
            "assignment.department",
            "name code icon color"
        )

        .populate("timeline")

        .sort({

            createdAt: -1

        })

        .lean();

}

/* ============================================================
   GET ASSIGNED COMPLAINT DETAILS
============================================================ */

static async getComplaintDetails(
    complaintId,
    worker
) {

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can access complaint details"
        );
    }


    const complaint =
        await Complaint.findOne({

            _id: complaintId,

            "assignment.worker":
                worker._id,

            isActive: true

        })

        .populate(
            "citizen",
            "name email phone"
        )

        .populate(
            "assignment.department",
            "name code description icon color"
        )

        .populate(
            "assignment.worker",
            "fullName availability skills liveLocation"
        )

        .populate("timeline")

        .lean();


    if (!complaint) {

        throw new Error(
            "Complaint not found or not assigned to this worker"
        );

    }


    return complaint;

}

/* ============================================================
   GET COMPLAINT TIMELINE
============================================================ */

static async getComplaintTimeline(complaintId, worker) {
    if (!worker) {
        throw new Error("Authenticated worker is required");
    }

    if (worker.role !== "Worker") {
        throw new Error("Only workers can access complaint timelines");
    }

    const complaint = await Complaint.findOne({
        _id: complaintId,
        "assignment.worker": worker._id,
        isActive: true
    });

    if (!complaint) {
        throw new Error("Complaint not found or not assigned to this worker");
    }

    return await TimelineService.getTimeline(complaintId);
}



/* ============================================================
   UPLOAD RESOLUTION + AI VERIFICATION
============================================================ */

static async submitResolution(
    complaintId,
    worker,
    data,
    file
) {

    const {
    remarks = "",
    latitude,
    longitude,
    address = ""
} = data;

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can submit resolutions"
        );
    }

    if (!file) {
        throw new Error(
            "Resolution image is required"
        );
    }


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
       VERIFY WORKER ASSIGNMENT
    ======================================================== */

    if (
        !complaint.assignment.worker ||
        complaint.assignment.worker.toString() !==
            worker._id.toString()
    ) {

        throw new Error(
            "Complaint is not assigned to this worker"
        );

    }


    /* ========================================================
       STATUS CHECK
    ======================================================== */

    if (
        complaint.status !== "In Progress"
    ) {

        throw new Error(
            `Resolution cannot be submitted while complaint status is ${complaint.status}`
        );

    }

/* ============================================================
   RESOLUTION LOCATION VALIDATION
============================================================ */

const workerLatitude =
    Number(latitude);

const workerLongitude =
    Number(longitude);


if (
    !Number.isFinite(workerLatitude) ||
    !Number.isFinite(workerLongitude)
) {

    throw new Error(
        "Valid latitude and longitude are required for resolution."
    );

}


/* ============================================================
   COMPLAINT LOCATION
============================================================ */

if (
    !complaint.location ||
    !complaint.location.coordinates ||
    complaint.location.coordinates.length !== 2
) {

    throw new Error(
        "Complaint location is not available."
    );

}


const [
    complaintLongitude,
    complaintLatitude
] = complaint.location.coordinates;



/* ============================================================
   VALIDATE RESOLUTION LOCATION
============================================================ */

const resolutionLocationCheck =
    this.validateWorkerLocation(

        complaint,

        workerLatitude,

        workerLongitude,

        50

    );
     /* ========================================================
       UPLOAD AFTER IMAGE
    ======================================================== */

    const uploadResult =
        await CloudinaryService.uploadBuffer(
            file.buffer,
            "civic-complaints/resolution"
        );


    const afterImage = {

        url:
            uploadResult.secure_url,

        publicId:
            uploadResult.public_id,

        imageType:
            "After",

        uploadedBy:
            worker._id,

        uploadedAt:
            new Date()

    };


    complaint.resolution.afterImages.push(
        afterImage
    );


    /* ========================================================
       FIND ORIGINAL BEFORE IMAGE
    ======================================================== */

    const beforeImage =
        complaint.complaintImages?.find(
            image =>
                image.imageType === "Complaint"
        );


    if (!beforeImage?.url) {

        throw new Error(
            "Original complaint image not found"
        );

    }


    /* ========================================================
       AI VERIFICATION
    ======================================================== */

    console.log(
        "🤖 Starting AI resolution verification..."
    );


    const verification =
        await AIGateway.verifyResolution(

            beforeImage.url,

            uploadResult.secure_url

        );



  
console.log(
    "🤖 AI Verification Result:",
    verification
);


/* ============================================================
   AI RESOLUTION DECISION
============================================================ */

if (
    !verification.success
) {

    throw new Error(
        "AI resolution verification failed."
    );

}


if (
    !verification.isResolved
) {

    complaint.resolution.aiVerified =
        false;

    complaint.resolution.adminVerified =
        false;

    complaint.resolution.verificationScore =
        verification.verificationScore || 0;

    complaint.resolution.remarks =
        verification.reason || "AI could not verify resolution.";

    complaint.status =
        "In Progress";

    await complaint.save();


    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "AI Verification Completed",

        performerRole:
            "AI",

        status:
            "In Progress",

        description:
            "AI verification determined that the reported issue has not been resolved.",

        metadata: {

            verified:
                verification.verified,

            isResolved:
                verification.isResolved,

            verificationScore:
                verification.verificationScore,

            recommendation:
                verification.recommendation,

            reason:
                verification.reason,

            issues:
                verification.issues

        }

    });

    return {
        complaint,
        verification
    };

}

    /* ========================================================
       SAVE AI VERIFICATION
    ======================================================== */

    complaint.resolution.aiVerified =
        Boolean(
            verification.isResolved
        );

    complaint.resolution.verificationScore =
        Number(
            verification.verificationScore || 0
        );


    /* ========================================================
       RESOLUTION REMARKS
    ======================================================== */

    complaint.resolution.remarks =
        data?.remarks || "";


    /* ========================================================
       AI RESOLVED
       DO NOT CLOSE YET
    ======================================================== */

    if (
        verification.isResolved
    ) {

        complaint.status =
            "Resolved";

        complaint.resolution.isResolved =
            true;

        complaint.resolution.resolvedAt =
            new Date();

        complaint.resolution.resolvedBy =
            worker._id;

    }


    await complaint.save();
/* ============================================================
   TIMELINE — AI VERIFICATION
============================================================ */

await TimelineService.log({

    complaint:
        complaint._id,

    eventType:
        "AI Verification Completed",

    performerRole:
        "AI",

    status:
        "Resolved",

    description:
        "AI verified the worker's resolution image and determined that the reported issue has been resolved.",

    metadata: {

        verified:
            verification.verified,

        isResolved:
            verification.isResolved,

        verificationScore:
            verification.verificationScore,

        recommendation:
            verification.recommendation,

        reason:
            verification.reason,

        issues:
            verification.issues

    }

});
    /* ============================================================
   NOTIFY CITIZEN
============================================================ */

await NotificationService.send({

    recipient: complaint.citizen,

    recipientClerkId:
        complaint.clerkUserId,

    complaint: complaint._id,

    title:
        verification.isResolved
            ? "Complaint Resolved"
            : "Resolution Verification Failed",

    message:
        verification.isResolved
            ? "Your civic complaint has been resolved. Please confirm whether the issue has actually been fixed."
            : "The AI verification found that the reported issue is still present. The worker needs to continue the work.",

    type:
        verification.isResolved
            ? "Complaint Resolved"
            : "Status Updated",

    priority:
        verification.isResolved
            ? "High"
            : "Medium",

    actionUrl:
        `/complaints/${complaint._id}`,

    icon:
        verification.isResolved
            ? "check-circle"
            : "alert-circle",

    metadata: {

        verificationScore:
            verification.verificationScore,

        recommendation:
            verification.recommendation,

        isResolved:
            verification.isResolved

    }

});

    /* ========================================================
       TIMELINE
    ======================================================== */

   if (verification.isResolved) {

    await TimelineService.log({

        complaint: complaint._id,

        eventType:
            "Resolution Uploaded",

        performerRole:
            "Worker",

        performedBy:
            worker._id,

        status:
            "Resolved",

        description:
            "Worker uploaded the resolution image and AI verification indicates that the issue has been resolved.",

        metadata: {

            verificationScore:
                verification.verificationScore,

            recommendation:
                verification.recommendation

        }

    });

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
            "AI Verified Resolution",

        message:
            `Complaint ${complaint.complaintNumber} has been resolved and successfully verified by AI. Admin review is required.`,

        type:
            "Complaint Resolved",

        priority:
            "High",

        actionUrl:
            `/admin/complaints/${complaint._id}`,

        icon:
            "🤖",

        metadata: {

            verificationScore:
                verification.verificationScore,

            recommendation:
                verification.recommendation

        }

    });

}
    // Admin notification will be connected here
    // once we add the Admin notification recipient lookup.


    /* ========================================================
       RETURN
    ======================================================== */

    return {

        complaint,

        verification

    };

}

/* ============================================================
   WORKER PROGRESS UPDATE
============================================================ */

static async updateProgress(
    complaintId,
    worker,
    data,
    file
) {

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can update complaint progress"
        );
    }

    if (!file) {
        throw new Error(
            "Progress image is required"
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
       VERIFY WORKER
    ======================================================== */

    if (
        !complaint.assignment?.worker ||
        complaint.assignment.worker.toString() !==
            worker._id.toString()
    ) {

        throw new Error(
            "Complaint is not assigned to this worker"
        );

    }


    /* ========================================================
       STATUS
    ======================================================== */

    if (
        complaint.status !== "In Progress"
    ) {

        throw new Error(
            `Progress cannot be updated while complaint status is ${complaint.status}`
        );

    }


    /* ========================================================
       WORKER GPS
    ======================================================== */

    const latitude =
        data?.latitude !== undefined
            ? Number(data.latitude)
            : null;

    const longitude =
        data?.longitude !== undefined
            ? Number(data.longitude)
            : null;


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        throw new Error(
            "Valid worker latitude and longitude are required"
        );

    }


    /* ========================================================
       VALIDATE LOCATION
    ======================================================== */

    const locationCheck =
        this.validateWorkerLocation(

            complaint,

            latitude,

            longitude,

            100

        );


    /* ========================================================
       UPLOAD IMAGE
    ======================================================== */

    const uploadResult =
        await CloudinaryService.uploadBuffer(

            file.buffer,

            "civic-complaints/progress"

        );


    /* ========================================================
       PROGRESS IMAGE
    ======================================================== */

    const progressImage = {

        url:
            uploadResult.secure_url,

        publicId:
            uploadResult.public_id,

        imageType:
            "Progress",

        uploadedBy:
            worker._id,

        uploadedAt:
            new Date()

    };


    complaint.resolution.progressImages.push(
        progressImage
    );


    await complaint.save();


    /* ========================================================
       UPDATE WORKER LOCATION
    ======================================================== */

    worker.liveLocation = {

        type: "Point",

        coordinates: [
            longitude,
            latitude
        ],

        address:
            data.address ||
            worker.liveLocation?.address ||
            "",

        lastUpdated:
            new Date()

    };


    await worker.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Progress Updated",

        performerRole:
            "Worker",

        performedBy:
            worker._id,

        status:
            "In Progress",

        description:
            data.remarks ||
            `${worker.fullName} updated complaint progress.`,

        remarks:
            data.remarks || "",

        metadata: {

            imageUrl:
                uploadResult.secure_url,

            publicId:
                uploadResult.public_id,

            workerLatitude:
                latitude,

            workerLongitude:
                longitude,

            distanceFromComplaintMeters:
                Number(
                    locationCheck.distanceMeters.toFixed(2)
                ),

            locationVerified:
                true

        },

        location: {

            latitude,

            longitude

        },

        attachments: [

            {

                url:
                    uploadResult.secure_url,

                publicId:
                    uploadResult.public_id

            }

        ]

    });


    return complaint;

}

    /* ============================================================
   START COMPLAINT
============================================================ */

static async startComplaint(complaintId, worker) {

    if (!worker) {
        throw new Error("Authenticated worker is required");
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can start complaints"
        );
    }


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
       VERIFY WORKER ASSIGNMENT
    ======================================================== */

    if (
        !complaint.assignment.worker ||
        complaint.assignment.worker.toString() !==
            worker._id.toString()
    ) {

        throw new Error(
            "Complaint is not assigned to this worker"
        );

    }


    /* ========================================================
       VALIDATE STATUS
    ======================================================== */

    if (
        complaint.status !== "Assigned"
    ) {

        throw new Error(
            `Complaint cannot be started from ${complaint.status} status`
        );

    }


    /* ========================================================
       UPDATE COMPLAINT
    ======================================================== */

    complaint.status =
        "In Progress";


    await complaint.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Worker Started",

        performerRole:
            "Worker",

        performedBy:
            worker._id,

        status:
            "In Progress",

        description:
            `${worker.fullName} started working on the complaint.`

    });


    /* ========================================================
       NOTIFICATION → CITIZEN
    ======================================================== */

    await NotificationService.send({

        recipient:
            complaint.citizen,

        recipientClerkId:
            complaint.clerkUserId,

        complaint:
            complaint._id,

        title:
            "Complaint Work Started",

        message:
            `${worker.fullName} has started working on your complaint.`,

        type:
            "Status Updated",

        priority:
            complaint.priority,

        actionUrl:
            `/complaints/${complaint._id}`,

        icon:
            "👷"

    });


    return complaint;

}

/* ============================================================
   WORKER REACHED LOCATION
============================================================ */

static async reachComplaintLocation(
    complaintId,
    worker,
    location = {}
) {

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can update complaint location"
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
       VERIFY ASSIGNED WORKER
    ======================================================== */

    if (
        !complaint.assignment?.worker ||
        complaint.assignment.worker.toString() !==
            worker._id.toString()
    ) {

        throw new Error(
            "Complaint is not assigned to this worker"
        );

    }


    /* ========================================================
       VALIDATE STATUS
    ======================================================== */

    if (
        complaint.status !== "In Progress"
    ) {

        throw new Error(
            `Worker cannot reach location while complaint status is ${complaint.status}`
        );

    }


    /* ========================================================
       WORKER GPS
    ======================================================== */

    const latitude =
        Number(location.latitude);

    const longitude =
        Number(location.longitude);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        throw new Error(
            "Valid worker latitude and longitude are required"
        );

    }


    /* ========================================================
       VALIDATE DISTANCE FROM COMPLAINT
    ======================================================== */

    const locationCheck =
        this.validateWorkerLocation(

            complaint,

            latitude,

            longitude,

            100

        );


    /* ========================================================
       UPDATE WORKER LIVE LOCATION
    ======================================================== */

    worker.liveLocation = {

        type: "Point",

        coordinates: [
            longitude,
            latitude
        ],

        address:
            location.address ||
            worker.liveLocation?.address ||
            "",

        lastUpdated:
            new Date()

    };


    await worker.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Worker Reached Location",

        performerRole:
            "Worker",

        performedBy:
            worker._id,

        status:
            "In Progress",

        description:
            `${worker.fullName} reached the complaint location.`,

        metadata: {

            workerLatitude:
                latitude,

            workerLongitude:
                longitude,

            distanceFromComplaintMeters:
                Number(
                    locationCheck.distanceMeters.toFixed(2)
                ),

            locationVerified:
                true

        },

        location: {

            latitude,

            longitude

        }

    });


    /* ========================================================
       NOTIFICATION → CITIZEN
    ======================================================== */

    await NotificationService.send({

        recipient:
            complaint.citizen,

        recipientClerkId:
            complaint.clerkUserId,

        complaint:
            complaint._id,

        title:
            "Worker Reached Location",

        message:
            "The assigned worker has reached the reported issue location.",

        type:
            "Status Updated",

        priority:
            complaint.priority,

        actionUrl:
            `/complaints/${complaint._id}`,

        icon:
            "📍"

    });


    return {

        complaint,

        worker,

        distanceKm:
            Number(
                locationCheck.distanceKm.toFixed(3)
            ),

        distanceMeters:
            Number(
                locationCheck.distanceMeters.toFixed(2)
            ),

        locationVerified:
            true

    };

}
/* ============================================================
   DISTANCE BETWEEN TWO GPS COORDINATES
============================================================ */

static calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


    static async acceptComplaint(complaintId, worker) {

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new Error("Complaint not found");
    }

    if (
        !complaint.assignment.worker ||
        complaint.assignment.worker.toString() !== worker._id.toString()
    ) {
        throw new Error("Complaint is not assigned to this worker");
    }

    if (complaint.status !== "Assigned") {

    throw new Error(
        `Complaint cannot be accepted from ${complaint.status} status`
    );

}

complaint.status = "Assigned";

await complaint.save();

    await TimelineService.log({
        complaint: complaint._id,
        eventType: "Worker Accepted",
        performerRole: "Worker",
        performedBy: worker._id,
        status: "Assigned",
        description:
            `${worker.fullName} accepted the assigned complaint.`
    });

    await NotificationService.send({
        recipient: complaint.citizen,
        recipientClerkId: complaint.clerkUserId,
        complaint: complaint._id,
        title: "Complaint Accepted",
        message:
            `${worker.fullName} accepted your complaint and will begin work soon.`,
        type: "Complaint Assigned",
        priority: complaint.priority,
        actionUrl: `/complaints/${complaint._id}`,
        icon: "👷"
    });

    return complaint;
}

static async rejectComplaint(
    complaintId,
    worker,
    reason = ""
) {

    if (!worker) {
        throw new Error(
            "Authenticated worker is required"
        );
    }

    if (worker.role !== "Worker") {
        throw new Error(
            "Only workers can reject complaints"
        );
    }


    /* ============================================================
       FIND COMPLAINT
    ============================================================ */

    const complaint =
        await Complaint.findById(
            complaintId
        );

    if (!complaint) {
        throw new Error(
            "Complaint not found"
        );
    }


    /* ============================================================
       VERIFY ASSIGNED WORKER
    ============================================================ */

    if (
        !complaint.assignment?.worker ||
        complaint.assignment.worker.toString() !==
            worker._id.toString()
    ) {

        throw new Error(
            "Complaint is not assigned to this worker"
        );

    }


    /* ============================================================
       ONLY ASSIGNED COMPLAINT CAN BE REJECTED
    ============================================================ */

    if (
        complaint.status !== "Assigned"
    ) {

        throw new Error(
            `Complaint cannot be rejected from ${complaint.status} status`
        );

    }


    /* ============================================================
       SAVE DEPARTMENT BEFORE CLEARING ASSIGNMENT
    ============================================================ */

    const departmentId =
        complaint.assignment.department;


    /* ============================================================
       TIMELINE — OLD WORKER REJECTED
    ============================================================ */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Worker Rejected",

        performerRole:
            "Worker",

        performedBy:
            worker._id,

        status:
            "Pending",

        description:
            `${worker.fullName} rejected the assigned complaint.`,

        remarks:
            reason

    });


    /* ============================================================
       RELEASE OLD WORKER CAPACITY
    ============================================================ */

    worker.workload =
        Math.max(
            0,
            (worker.workload || 0) - 1
        );


    if (!worker.performance) {
        worker.performance = {};
    }


    worker.performance.activeComplaints =
        Math.max(
            0,
            (worker.performance.activeComplaints || 0) - 1
        );


    worker.availability =
        "Available";


    await worker.save();


    /* ============================================================
       CLEAR OLD ASSIGNMENT
    ============================================================ */

    complaint.assignment.worker =
        null;

    complaint.assignment.assignedAt =
        null;

    complaint.assignment.assignedBy =
        null;

    complaint.assignment.isAutoAssigned =
        false;

    complaint.assignment.assignmentReason =
        "";


    complaint.status =
        "Pending";


    await complaint.save();


    /* ============================================================
       AUTOMATIC REASSIGNMENT
    ============================================================ */

    let reassignmentResult = null;


    if (departmentId) {

        console.log(
            "🔄 Attempting automatic reassignment..."
        );


        reassignmentResult =
            await WorkerService.assignBestWorker(

                departmentId,

                complaint.location,

                complaint.category,

                complaint.priority,

                worker._id

            );

    }


    /* ============================================================
       NEW WORKER FOUND
    ============================================================ */

    if (
        reassignmentResult?.success &&
        reassignmentResult.worker
    ) {

        const newWorker =
            reassignmentResult.worker;


        /* ========================================================
           UPDATE COMPLAINT
        ======================================================== */

        complaint.assignment.worker =
            newWorker._id;

        complaint.assignment.department =
            departmentId;

        complaint.assignment.assignedAt =
            new Date();

        complaint.assignment.isAutoAssigned =
            true;

        complaint.assignment.assignmentReason =
            `Automatically reassigned after ${worker.fullName} rejected the complaint. ${reassignmentResult.reason}`;


        complaint.status =
            "Assigned";


        await complaint.save();


        /* ========================================================
           TIMELINE — REASSIGNMENT
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Worker Assigned",

            performerRole:
                "AI",

            performedBy:
                null,

            status:
                "Assigned",

            description:
                `AI automatically reassigned the complaint to ${newWorker.fullName} after ${worker.fullName} rejected it.`,

            metadata: {

                previousWorkerId:
                    worker._id,

                previousWorkerName:
                    worker.fullName,

                newWorkerId:
                    newWorker._id,

                newWorkerName:
                    newWorker.fullName,

                score:
                    reassignmentResult.score,

                distanceKm:
                    reassignmentResult.distanceKm,

                reason:
                    reassignmentResult.reason

            }

        });


        /* ========================================================
           NOTIFY NEW WORKER
        ======================================================== */

        await NotificationService.send({

            recipient:
                newWorker._id,

            recipientClerkId:
                newWorker.clerkId,

            complaint:
                complaint._id,

            title:
                "Complaint Reassigned",

            message:
                `Complaint ${complaint.complaintNumber} has been automatically assigned to you.`,

            type:
                "Complaint Assigned",

            priority:
                complaint.priority,

            actionUrl:
                `/worker/complaints/${complaint._id}`,

            icon:
                "assignment",

            metadata: {

                previousWorker:
                    worker.fullName,

                score:
                    reassignmentResult.score,

                distanceKm:
                    reassignmentResult.distanceKm,

                assignmentReason:
                    reassignmentResult.reason

            }

        });


        /* ========================================================
           NOTIFY ADMINS
        ======================================================== */

        const admins =
            await User.find({

                role:
                    "Admin",

                isActive:
                    true

            });


        for (
            const admin
            of admins
        ) {

            await NotificationService.send({

                recipient:
                    admin._id,

                recipientClerkId:
                    admin.clerkId,

                complaint:
                    complaint._id,

                title:
                    "Worker Reassigned",

                message:
                    `Complaint ${complaint.complaintNumber} was automatically reassigned from ${worker.fullName} to ${newWorker.fullName}.`,

                type:
                    "Worker Reassigned",

                priority:
                    "Medium",

                actionUrl:
                    `/admin/complaints/${complaint._id}`,

                icon:
                    "refresh-cw",

                metadata: {

                    previousWorkerId:
                        worker._id,

                    previousWorkerName:
                        worker.fullName,

                    newWorkerId:
                        newWorker._id,

                    newWorkerName:
                        newWorker.fullName

                }

            });

        }


    } else {

        /* ========================================================
           NO REPLACEMENT WORKER
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Worker Assignment Pending",

            performerRole:
                "AI",

            status:
                "Pending",

            description:
                "Previous worker rejected the complaint and no replacement worker is currently available.",

            remarks:
                reassignmentResult?.reason ||
                "No available worker found."

        });


        /* ========================================================
           NOTIFY ADMINS
        ======================================================== */

        const admins =
            await User.find({

                role:
                    "Admin",

                isActive:
                    true

            });


        for (
            const admin
            of admins
        ) {

            await NotificationService.send({

                recipient:
                    admin._id,

                recipientClerkId:
                    admin.clerkId,

                complaint:
                    complaint._id,

                title:
                    "Worker Reassignment Pending",

                message:
                    `Complaint ${complaint.complaintNumber} needs a new worker because ${worker.fullName} rejected it.`,

                type:
                    "Worker Assignment Pending",

                priority:
                    "High",

                actionUrl:
                    `/admin/complaints/${complaint._id}`,

                icon:
                    "alert-circle"

            });

        }

    }


    return {

        complaint,

        rejectedWorker:
            worker,

        reassignment:
            reassignmentResult

    };

}
    static async assignBestWorker(
        departmentId,
        complaintLocation,
        category,
        priority,
        excludeWorkerId = null
    ) {
        const location = complaintLocation; // Map parameter to local reference used in distance calc

        // Find all candidate workers in this department to evaluate and log their eligibility status
        const workerQuery = {
            role: "Worker",
            department: departmentId
        };

        if (excludeWorkerId) {
            workerQuery._id = { $ne: excludeWorkerId };
        }

        const workers = await User.find(workerQuery);

        console.log("\n====================================");
        console.log("👷 WORKER ASSIGNMENT DEBUG");
        console.log("Complaint Category:", category);
        console.log("Department ID:", departmentId);
        console.log("Candidate pool size:", workers.length);
        console.log("====================================");

        const eligibleWorkers = [];

        for (const worker of workers) {
            let eligible = true;
            let reason = "";

            if (!worker.isActive) {
                eligible = false;
                reason = "Worker is inactive (isActive = false)";
            } else if (worker.availability !== "Available") {
                eligible = false;
                reason = `Worker availability is "${worker.availability}"`;
            }

            console.log(`Worker: ${worker.fullName}`);
            console.log(`Role: ${worker.role}`);
            console.log(`Department: ${worker.department?.toString()}`);
            console.log(`Availability: ${worker.availability}`);
            console.log(`isOnline: ${worker.isOnline}`);
            console.log(`Workload: ${worker.workload}`);
            console.log(`Last Seen: ${worker.lastSeenAt}`);
            console.log(`Location Updated: ${worker.liveLocation?.lastUpdated}`);
            console.log(`Eligible: ${eligible}`);
            if (!eligible) {
                console.log(`Reason: ${reason}`);
            }
            console.log("------------------------------------");

            if (eligible) {
                eligibleWorkers.push(worker);
            }
        }

        if (!eligibleWorkers.length) {
            console.log("NO ELIGIBLE WORKER FOUND");
            console.log("====================================\n");
            return {
                success: false,
                worker: null,
                reason: "No available worker found in this department."
            };
        }

        /* =====================================================
           CALCULATE WORKER SCORES
        ===================================================== */

        const candidates = eligibleWorkers.map(worker => {
            let score = 0;

            /* ---------------------------------------------
               SKILL MATCH
            --------------------------------------------- */
            const skillMatch = worker.skills?.some(
                skill => skill.toLowerCase() === category.toLowerCase()
            );

            if (skillMatch) {
                score += 40;
            }

            /* ---------------------------------------------
               WORKLOAD
            --------------------------------------------- */
            score += Math.max(0, 30 - (worker.workload || 0) * 5);

            /* ---------------------------------------------
               PERFORMANCE RATING
            --------------------------------------------- */
            const rating = worker.performance?.rating || 0;
            score += rating * 5;

            /* ---------------------------------------------
               DISTANCE
            --------------------------------------------- */
            let distanceKm = null;

            if (location?.coordinates && worker.liveLocation?.coordinates) {
                distanceKm = calculateDistance(
                    location.coordinates[1],
                    location.coordinates[0],
                    worker.liveLocation.coordinates[1],
                    worker.liveLocation.coordinates[0]
                );

                // Closer workers get higher score.
                score += Math.max(0, 20 - distanceKm * 2);
            }

            return {
                worker,
                score: Number(score.toFixed(2)),
                distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(2)) : null
            };
        });

        /* =====================================================
           SORT BEST WORKER
        ===================================================== */
        candidates.sort((a, b) => b.score - a.score);

        const selected = candidates[0];
        const worker = selected.worker;

        console.log("SELECTED WORKER:", worker.fullName);
        console.log("====================================\n");


        /* =====================================================
           UPDATE WORKLOAD
        ===================================================== */

        worker.workload =
            (worker.workload || 0) + 1;


        if (!worker.performance) {

            worker.performance = {};

        }


        worker.performance.totalAssigned =
            (worker.performance.totalAssigned || 0) + 1;


        worker.performance.activeComplaints =
            (worker.performance.activeComplaints || 0) + 1;


        await worker.save();


        /* =====================================================
           RETURN RESULT
        ===================================================== */

        return {

            success: true,

            worker,

            score:
                selected.score,

            distanceKm:
                selected.distanceKm,

            reason:
                `AI selected ${worker.fullName} based on distance, workload, performance and skill match.`,

            candidates:
                candidates.map(candidate => ({

                    workerId:
                        candidate.worker._id,

                    name:
                        candidate.worker.fullName,

                    score:
                        candidate.score,

                    distanceKm:
                        candidate.distanceKm,

                    workload:
                        candidate.worker.workload,

                    rating:
                        candidate.worker.performance?.rating || 0

                }))

        };

    }

    /* ============================================================
       UPDATE DUTY STATUS (WORKER AVAILABILITY)
    ============================================================ */
    static async updateDutyStatus(worker, availability) {
        if (!worker) {
            throw new Error("Authenticated worker is required");
        }

        const validStatuses = ["Available", "Busy", "Offline", "On Leave"];
        if (!validStatuses.includes(availability)) {
            throw new Error(`Invalid availability status. Must be one of: ${validStatuses.join(", ")}`);
        }

        const user = await User.findById(worker._id);
        if (!user) {
            throw new Error("Worker profile not found");
        }

        user.availability = availability;
        if (availability === "Available") {
            user.isOnline = true;
            user.lastSeenAt = new Date();
        }
        await user.save();

        try {
            const { getIO } = require("../../socket/socket");
            const io = getIO();
            if (io) {
                io.emit("worker-availability-updated", {
                    workerId: user._id,
                    clerkId: user.clerkId,
                    availability: user.availability
                });
            }
        } catch (e) {
            console.warn("Socket broadcast for duty status update:", e.message);
        }

        return user;
    }

}


/* ============================================================
   HAVERSINE DISTANCE
============================================================ */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        toRadians(lat2 - lat1);

    const dLon =
        toRadians(lon2 - lon1);


    const a =
        Math.sin(dLat / 2) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(dLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


function toRadians(degrees) {

    return degrees *
        (Math.PI / 180);

}


module.exports = WorkerService;