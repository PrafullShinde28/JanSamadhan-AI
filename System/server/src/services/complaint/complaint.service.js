const Complaint =
    require("../../models/Complaint");

const Timeline =
    require("../../models/Timeline");

const AIAnalysis =
    require("../../models/AIAnalysis");

const WorkerAssignment =
    require("../../models/WorkerAssignment");

const Notification =
    require("../../models/Notification");

const CaptureSession =
    require("../../models/CaptureSession");

const aiQueue =
    require("../../queues/ai.queue");

const TimelineService =
    require("../timeline/timeline.service");

const cloudinary =
    require("../../config/cloudinary");

const GeocodingService =
    require("../location/geocoding.service");


class ComplaintService {


    /* ============================================================
       CREATE COMPLAINT

       CITIZEN INPUT:
       - latitude
       - longitude
       - image
       - captureSessionId

       AI INPUT:
       - category
       - priority
       - severity
       - description
       - risk score
       - department
       - worker
       - ETA
    ============================================================ */

    static async createComplaint(
        data,
        user,
        file
    ) {

        /* ========================================================
           AUTHENTICATION
        ======================================================== */

        if (!user) {

            throw new Error(
                "Authenticated user is required"
            );

        }


        /* ========================================================
           IMAGE REQUIRED
        ======================================================== */

        if (!file) {

            throw new Error(
                "Complaint image is required"
            );

        }


        /* ========================================================
           CAPTURE SESSION SECURE VALIDATION
        ======================================================== */

        const captureSessionId = data?.captureSessionId;
        if (!captureSessionId) {
            throw new Error("Live camera capture session ID is required");
        }

        const session = await CaptureSession.findOne({ captureSessionId });
        if (!session) {
            throw new Error("Invalid camera capture session. Evidence upload rejected.");
        }

        if (session.used) {
            throw new Error("Capture session has already been used. Upload rejected.");
        }

        if (session.expiresAt < new Date()) {
            throw new Error("Capture session has expired. Photos must be uploaded within 5 minutes.");
        }

        if (session.citizen.toString() !== user._id.toString()) {
            throw new Error("Capture session owner mismatch.");
        }

        // Mark the single-use session as used immediately
        session.used = true;
        await session.save();


        /* ========================================================
           GPS REQUIRED
        ======================================================== */

        const latitude =
            Number(data?.latitude);

        const longitude =
            Number(data?.longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            throw new Error(
                "Valid latitude and longitude are required"
            );

        }


        /* ========================================================
           GPS RANGE VALIDATION
        ======================================================== */

        if (
            latitude < -90 ||
            latitude > 90
        ) {

            throw new Error(
                "Latitude must be between -90 and 90"
            );

        }


        if (
            longitude < -180 ||
            longitude > 180
        ) {

            throw new Error(
                "Longitude must be between -180 and 180"
            );

        }


        /* ========================================================
           REVERSE GEOCODING

           GPS → Address
        ======================================================== */

        console.log(
            "📍 Reverse geocoding:",
            latitude,
            longitude
        );


        const locationData =
            await GeocodingService.reverseGeocode(
                latitude,
                longitude
            );


        console.log(
            "📍 Location resolved:",
            locationData.formattedAddress
        );


        /* ========================================================
           LOCATION OBJECT

           GeoJSON:
           [longitude, latitude]
        ======================================================== */

        const location = {

            type:
                "Point",

            coordinates: [

                longitude,

                latitude

            ],

            address:
                locationData.formattedAddress || "",

            landmark:
                locationData.landmark || "",

            city:
                locationData.city || "",

            district:
                locationData.district || "",

            state:
                locationData.state || "",

            pincode:
                locationData.pincode || ""

        };


        /* ========================================================
           UPLOAD COMPLAINT IMAGE
        ======================================================== */

        const uploadToCloudinary =
            () => {

                return new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(

                                {

                                    folder:
                                        "civic-complaints",

                                    resource_type:
                                        "image"

                                },

                                (
                                    error,
                                    result
                                ) => {

                                    if (error) {

                                        return reject(
                                            error
                                        );

                                    }

                                    resolve(
                                        result
                                    );

                                }

                            );


                        stream.end(
                            file.buffer
                        );

                    }
                );

            };


        const cloudinaryResult =
            await uploadToCloudinary();


        /* ========================================================
           COMPLAINT IMAGE OBJECT
        ======================================================== */

        const complaintImage = {

            url:
                cloudinaryResult.secure_url,

            publicId:
                cloudinaryResult.public_id,

            imageType:
                "Complaint",

            uploadedBy:
                user._id,

            uploadedAt:
                new Date()

        };


        /* ========================================================
           COMPLAINT NUMBER
        ======================================================== */

        const complaintNumber =
            `CMP-${Date.now()}`;


        /* ========================================================
           CREATE BASIC COMPLAINT

           IMPORTANT:
           Do NOT accept category/priority/title/
           description from citizen.

           AI will populate those fields.
        ======================================================== */

        const complaint =
            await Complaint.create({

                complaintNumber,

                clerkUserId:
                    user.clerkId,

                citizen:
                    user._id,

                title:
                    "AI analysis pending",

                description:
                    "Complaint submitted. AI analysis is in progress.",

                category:
                    "Other",

                priority:
                    "Medium",

                status:
                    "Pending",

                location,

                complaintImages: [

                    complaintImage

                ]

            });


        /* ========================================================
           TIMELINE
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Complaint Created",

            performerRole:
                "Citizen",

            performedBy:
                user._id,

            status:
                "Pending",

            description:
                "Citizen submitted a civic issue using an image and automatic GPS location.",

            metadata: {

                latitude,

                longitude,

                formattedAddress:
                    locationData.formattedAddress,

                city:
                    locationData.city,

                district:
                    locationData.district,

                state:
                    locationData.state,

                pincode:
                    locationData.pincode

            },

            location: {

                latitude,

                longitude

            },

            attachments: [

                {

                    url:
                        cloudinaryResult.secure_url,

                    publicId:
                        cloudinaryResult.public_id

                }

            ]

        });


        /* ========================================================
           ADD TO AI QUEUE
        ======================================================== */

        await aiQueue.add(

            "PROCESS_COMPLAINT",

            {

                complaintId:
                    complaint._id.toString()

            },

            {

                attempts:
                    3,

                backoff: {

                    type:
                        "exponential",

                    delay:
                        5000

                },

                removeOnComplete:
                    true,

                removeOnFail:
                    false

            }

        );


        console.log(
            "🤖 Complaint added to AI queue:",
            complaint._id.toString()
        );


        /* ========================================================
           RETURN
        ======================================================== */

        return complaint;

    }


    /* ============================================================
       GET COMPLAINT BY ID
    ============================================================ */

    static async getComplaintById(
        id
    ) {

        return Complaint.findById(id)

            .populate("citizen")

            .populate(
                "assignment.department"
            )

            .populate(
                "assignment.worker"
            );

    }


    /* ============================================================
       GET ALL COMPLAINTS
    ============================================================ */

    static async getComplaints(
        filters = {}
    ) {

        return Complaint.find(filters)

            .sort({

                createdAt:
                    -1

            });

    }


    /* ============================================================
       UPDATE STATUS
    ============================================================ */

    static async updateStatus(

        complaintId,

        status,

        updatedBy,

        remarks = ""

    ) {

        const complaint =
            await Complaint.findById(
                complaintId
            );


        if (!complaint) {

            throw new Error(
                "Complaint not found"
            );

        }


        complaint.status =
            status;


        await complaint.save();


        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Status Updated",

            performerRole:
                "Admin",

            performedBy:
                updatedBy,

            status,

            description:
                `Complaint status changed to ${status}.`,

            remarks

        });


        return complaint;

    }


    /* ============================================================
       ASSIGN WORKER

       NOTE:
       This remains available for ADMIN OVERRIDE.

       Normal assignment is AI-driven.
    ============================================================ */

    static async assignWorker({

        complaintId,

        workerId,

        departmentId,

        assignedBy,

        assignmentType =
            "Manual"

    }) {

        const assignment =
            await WorkerAssignment.create({

                complaint:
                    complaintId,

                worker:
                    workerId,

                department:
                    departmentId,

                assignedBy,

                assignmentType

            });


        await Complaint.findByIdAndUpdate(

            complaintId,

            {

                status:
                    "Assigned",

                assignment: {

                    worker:
                        workerId,

                    department:
                        departmentId,

                    assignedBy,

                    assignedAt:
                        new Date(),

                    isAutoAssigned:
                        assignmentType === "AI"

                }

            }

        );


        await TimelineService.log({

            complaint:
                complaintId,

            eventType:
                "Worker Assigned",

            performerRole:
                assignmentType === "AI"
                    ? "AI"
                    : "Admin",

            performedBy:
                assignedBy,

            status:
                "Assigned",

            description:
                assignmentType === "AI"
                    ? "AI automatically assigned the complaint to a suitable worker."
                    : "Administrator manually assigned the complaint to a worker."

        });


        return assignment;

    }


    /* ============================================================
       SAVE AI RESULT

       Kept for compatibility with existing code.
    ============================================================ */

    static async saveAIAnalysis(

        complaintId,

        aiResult

    ) {

        const analysis =
            await AIAnalysis.create({

                complaint:
                    complaintId,

                ...aiResult

            });


        await Complaint.findByIdAndUpdate(

            complaintId,

            {

                "ai.processed":
                    true,

                "ai.modelName":
                    aiResult.modelName,

                "ai.modelVersion":
                    aiResult.modelVersion,

                "ai.confidence":
                    aiResult.overallConfidence,

                "ai.processedAt":
                    new Date()

            }

        );


        await TimelineService.log({

            complaint:
                complaintId,

            performerRole:
                "AI",

            eventType:
                "AI Analysis Completed",

            description:
                "YOLO finished analyzing the complaint."

        });


        return analysis;

    }


    /* ============================================================
       DELETE COMPLAINT
    ============================================================ */

    static async deleteComplaint(
        id
    ) {

        return Complaint.findByIdAndUpdate(

            id,

            {

                isActive:
                    false,

                "audit.deleted":
                    true,

                "audit.deletedAt":
                    new Date()

            }

        );

    }

}


module.exports =
    ComplaintService;