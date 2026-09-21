const AIAnalysis = require("../../models/AIAnalysis");
const Complaint = require("../../models/Complaint");
const DepartmentService =
    require("../department/department.service");
const TimelineService =
    require("../timeline/timeline.service");
const WorkerService =
    require("../worker/worker.service");
const AIGateway =
    require("./ai.gateway");
const DuplicateService =
    require("./duplicate.service");
const ETAService =
    require("../eta/eta.service");
const NotificationService =
    require("../notification/notification.service");
const User = require("../../models/User");
/* ============================================================
   YOLO → COMPLAINT CATEGORY
============================================================ */

const AI_CATEGORY_MAP = {

    Pothole: "Pothole",

    Garbage: "Garbage Overflow",

    WaterLeak: "Water Leakage",

    Streetlight: "Broken Streetlight",

    RoadDamage: "Road Damage",

    OpenManhole: "Open Manhole",

    FallenTree: "Fallen Tree",

};


/* ============================================================
   BASE PRIORITY BY CATEGORY
============================================================ */

const AI_PRIORITY_MAP = {

    Pothole: "Medium",

    Garbage: "Medium",

    WaterLeak: "High",

    Streetlight: "Medium",

    RoadDamage: "High",

    OpenManhole: "High",

    FallenTree: "High",

};


/* ============================================================
   RISK WEIGHTS
============================================================ */

const RISK_WEIGHTS = {

    Pothole: 0.50,

    Garbage: 0.40,

    WaterLeak: 0.80,

    Streetlight: 0.50,

    RoadDamage: 0.80,

    OpenManhole: 1.00,

    FallenTree: 0.90,

};


/* ============================================================
   AI SERVICE
============================================================ */

class AIService {


    /* ========================================================
       PROCESS COMPLAINT
    ======================================================== */

   static async processComplaint(complaintId) {

    console.log(
        `🤖 AI processing complaint: ${complaintId}`
    );


    /* ============================================================
       GET COMPLAINT
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
       GET COMPLAINT IMAGE
    ============================================================ */

    const complaintImage =
        complaint.complaintImages?.find(
            image =>
                image.imageType === "Complaint"
        ) ||
        complaint.complaintImages?.[0];


    if (!complaintImage?.url) {

        throw new Error(
            "Complaint image not found"
        );

    }


    /* ============================================================
       TIMELINE — AI STARTED
    ============================================================ */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "AI Analysis Started",

        performerRole:
            "AI",

        status:
            complaint.status,

        description:
            "AI started analyzing the complaint image."

    });


    /* ============================================================
       DOWNLOAD CLOUDINARY IMAGE
    ============================================================ */

    const imageResponse =
        await fetch(
            complaintImage.url
        );


    if (!imageResponse.ok) {

        throw new Error(
            `Failed to download complaint image. HTTP ${imageResponse.status}`
        );

    }


    const imageArrayBuffer =
        await imageResponse.arrayBuffer();


    const imageBuffer =
        Buffer.from(
            imageArrayBuffer
        );


    const contentType =
        imageResponse.headers.get(
            "content-type"
        ) ||
        "image/jpeg";


    /* ============================================================
       RUN YOLO
    ============================================================ */

    const aiResult =
        await AIGateway.detectIssue(

            imageBuffer,

            "complaint-image.jpg",

            contentType

        );


    console.log(
        "🤖 YOLO result:",
        JSON.stringify(
            aiResult,
            null,
            2
        )
    );


    /* ============================================================
       PRIMARY DETECTION
    ============================================================ */

    const primaryDetection =
        aiResult?.primary_detection ||
        null;


    const detectedClass =
        primaryDetection?.class_name ||
        null;


    const rawConfidence =
        Number(
            primaryDetection?.confidence || 0
        );


    const overallConfidence =
        Number(
            (
                rawConfidence * 100
            ).toFixed(2)
        );


    /* ============================================================
       CATEGORY
    ============================================================ */

    const primaryCategory =
        detectedClass
            ? (
                AI_CATEGORY_MAP[
                    detectedClass
                ] || "Other"
            )
            : "Other";


    /* ============================================================
       IMAGE DIMENSIONS
    ============================================================ */

    const imageWidth =
        Number(
            aiResult?.image_width || 640
        );


    const imageHeight =
        Number(
            aiResult?.image_height || 640
        );


    /* ============================================================
       DETECTED OBJECTS
    ============================================================ */

    const detectedObjects =
        (aiResult?.detections || []).map(
            detection => {

                const x1 =
                    Number(
                        detection.x1 || 0
                    );

                const y1 =
                    Number(
                        detection.y1 || 0
                    );

                const x2 =
                    Number(
                        detection.x2 || 0
                    );

                const y2 =
                    Number(
                        detection.y2 || 0
                    );


                const width =
                    Math.max(
                        0,
                        x2 - x1
                    );


                const height =
                    Math.max(
                        0,
                        y2 - y1
                    );


                const area =
                    width * height;


                const imageArea =
                    imageWidth *
                    imageHeight;


                const areaPercentage =
                    imageArea > 0
                        ? (
                            area /
                            imageArea
                        ) * 100
                        : 0;


                const confidence =
                    Number(
                        (
                            Number(
                                detection.confidence || 0
                            ) * 100
                        ).toFixed(2)
                    );


                /* ================================================
                   SEVERITY
                ================================================= */

                const severity =
                    AIService.calculateSeverity(
                        confidence,
                        areaPercentage,
                        detection.class_name
                    );


                return {

                    label:
                        detection.class_name,

                    confidence,

                    boundingBox: {

                        x:
                            Number(
                                x1.toFixed(2)
                            ),

                        y:
                            Number(
                                y1.toFixed(2)
                            ),

                        width:
                            Number(
                                width.toFixed(2)
                            ),

                        height:
                            Number(
                                height.toFixed(2)
                            ),

                    },

                    area:
                        Number(
                            area.toFixed(2)
                        ),

                    areaPercentage:
                        Number(
                            areaPercentage.toFixed(2)
                        ),

                    severity,

                };

            }
        );


    /* ============================================================
       PRIMARY SEVERITY
    ============================================================ */

    const primaryObject =
        detectedObjects.length > 0
            ? detectedObjects.reduce(
                (highest, current) => {

                    const severityRank = {

                        Low: 1,

                        Medium: 2,

                        High: 3

                    };


                    return severityRank[
                        current.severity
                    ] >
                    severityRank[
                        highest.severity
                    ]
                        ? current
                        : highest;

                }
            )
            : null;


    const severity =
        primaryObject?.severity ||
        "Low";


    /* ============================================================
       PRIORITY
    ============================================================ */

    const priority =
        AIService.calculatePriority(

            detectedClass,

            severity

        );


    /* ============================================================
       RISK SCORE
    ============================================================ */

    const riskScore =
        AIService.calculateRiskScore(

            detectedClass,

            rawConfidence,

            severity,

            primaryObject?.areaPercentage || 0

        );



       await TimelineService.log({

    complaint:
        complaint._id,

    eventType:
        "AI Analysis Completed",

    performerRole:
        "AI",

    status:
        "Under Review",

    description:
    `AI detected ${primaryCategory} with ${overallConfidence.toFixed(2)}% confidence.`,
    metadata: {

        model:
            "YOLO11",

        modelVersion:
            "best.pt",

        category:
            primaryCategory,

        confidence:
            overallConfidence,

        severity,

        priority,

        riskScore

    }

});


    /* ============================================================
       AI TITLE
    ============================================================ */

    const generatedTitle =
        AIService.generateTitle(

            primaryCategory,

            severity

        );


    /* ============================================================
       AI DESCRIPTION
    ============================================================ */

    const generatedDescription =
        AIService.generateDescription(

            primaryCategory,

            severity,

            overallConfidence,

            primaryObject?.areaPercentage || 0

        );


    /* ============================================================
       MODEL INFORMATION
    ============================================================ */

    const modelName =
        "YOLO11";


    const modelVersion =
        aiResult?.model ||
        "best.pt";


    const processingTimeMs =
        Number(
            aiResult?.processing_time_ms || 0
        );


    /* ============================================================
       AI ANALYSIS DOCUMENT
    ============================================================ */

    const analysisData = {

        complaint:
            complaint._id,

        modelName,

        modelVersion,

        processingTimeMs,

        detectedObjects,

        primaryCategory,

        overallConfidence,

        priorityPrediction:
            priority,

        riskScore,

        duplicateDetection: {

            isDuplicate: false,

            duplicateComplaint: null,

            distanceMeters: 0,

            confidence: 0,

        },

        departmentRecommendation: {

            recommendedDepartment: null,

            confidence: 0,

            reason: "",

        },

        workerRecommendation: {

            recommendedWorker: null,

            confidence: 0,

            distanceMeters: 0,

            estimatedTravelMinutes: 0,

            reason: "",

        },

        etaPrediction: {

            estimatedHours: 0,

            estimatedCompletionDate: null,

            confidence: 0,

        },

        resolutionVerification: {

            verified: false,

            confidence: 0,

            remarks: "",

            verifiedAt: null,

        },

        rawResponse:
            aiResult,

    };


    const analysis =
        await AIAnalysis.create(
            analysisData
        );


    /* ============================================================
       UPDATE COMPLAINT AI SUMMARY
    ============================================================ */

    complaint.ai.processed =
        true;


    complaint.ai.modelName =
        modelName;


    complaint.ai.modelVersion =
        modelVersion;


    complaint.ai.detectedCategory =
        primaryCategory;


    complaint.ai.confidence =
        overallConfidence;


    complaint.ai.severity =
        severity;


    complaint.ai.riskScore =
        riskScore;


    complaint.ai.processedAt =
        new Date();


    /* ============================================================
       AI OWNS CATEGORY + PRIORITY
    ============================================================ */

    if (primaryDetection) {

        complaint.category =
            primaryCategory;


        complaint.priority =
            priority;


        complaint.title =
            generatedTitle;


        complaint.description =
            generatedDescription;

    }

    /* ============================================================
       NON-CIVIC / UNRECOGNIZED ISSUE HANDLING
    ============================================================ */

    if (primaryCategory === "Other" || !primaryDetection || detectedObjects.length === 0) {

        complaint.category = "Other";
        complaint.status = "Closed";
        complaint.title = "No Civic Issue Detected";
        complaint.description = "The submitted image was analyzed by the AI vision system, but no recognized municipal civic issue (such as a Pothole, Road Damage, Garbage Overflow, Water Leakage, Open Manhole, Fallen Tree, or Broken Streetlight) was detected in the photo.";
        complaint.ai.isCivicIssue = false;
        complaint.ai.nonCivicReason = "No recognized municipal civic problem detected in the uploaded evidence photo.";

        await complaint.save();

        await TimelineService.log({
            complaint: complaint._id,
            eventType: "AI Validation Check",
            performerRole: "AI",
            status: "Closed",
            description: "AI vision analysis concluded that the submitted photo does not contain a recognized municipal civic issue. Complaint marked as Non-Civic and Closed."
        });

        await NotificationService.send({
            recipient: complaint.citizen,
            recipientClerkId: complaint.clerkUserId,
            complaint: complaint._id,
            title: "No Civic Issue Detected",
            message: "Your reported image was analyzed by AI, but does not match any recognized civic problem. If this was a mistake, please capture a clear photo of the civic issue.",
            type: "Complaint Closed",
            priority: "Low",
            actionUrl: `/citizen/complaints/${complaint._id}`,
            icon: "🚫"
        });

        console.log(`🚫 Non-civic image detected for complaint ${complaint._id}: No recognized municipal problem.`);
        return complaint;

    }

    /* ============================================================
       DUPLICATE DETECTION
    ============================================================ */
const duplicateResult =
    await DuplicateService.checkDuplicate(

        complaint.category,

        complaint.location.coordinates[0],

        complaint.location.coordinates[1],

        20,

        complaint._id

    );

    


    console.log(
        "🔍 Duplicate result:",
        duplicateResult
    );


    /* ============================================================
       DUPLICATE FOUND
    ============================================================ */

    if (duplicateResult.isDuplicate) {

        complaint.ai.duplicateDetected =
            true;


        complaint.ai.duplicateComplaint =
            duplicateResult.complaint._id;


        await complaint.save();


        /* ========================================================
           TIMELINE — DUPLICATE
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Duplicate Complaint Detected",

            performerRole:
                "AI",

            status:
                complaint.status,

            description:
                `AI detected this complaint as a duplicate of ${duplicateResult.complaint.complaintNumber}.`

        });


        /* ========================================================
           CITIZEN NOTIFICATION — DUPLICATE
        ======================================================== */

        await NotificationService.send({

            recipient:
                complaint.citizen,

            recipientClerkId:
                complaint.clerkUserId,

            complaint:
                complaint._id,

            title:
                "Duplicate Complaint Detected",

            message:
                `This issue appears to have already been reported as ${duplicateResult.complaint.complaintNumber}.`,

            type: "Duplicate Complaint Found",

            priority:
                complaint.priority,

            actionUrl:
                `/complaints/${duplicateResult.complaint._id}`,

            icon:
                "⚠️",

            metadata: {

                duplicateComplaintId:
                    duplicateResult.complaint._id,

                duplicateComplaintNumber:
                    duplicateResult.complaint.complaintNumber

            }

        });


        console.log(
            `⚠️ Duplicate detected: ${duplicateResult.complaint.complaintNumber}`
        );


        return complaint;

    }


    /* ============================================================
       AI DEPARTMENT RECOMMENDATION
    ============================================================ */

    const departmentResult =
        await DepartmentService.recommendDepartment(

            complaint.category

        );


    console.log(
        "🏢 AI Department Recommendation:",
        departmentResult
    );


    /* ============================================================
       DEPARTMENT ASSIGNMENT
    ============================================================ */

    if (
        departmentResult.success &&
        departmentResult.department
    ) {

        complaint.assignment.department =
            departmentResult.department._id;


        complaint.assignment.isAutoAssigned =
            true;


        complaint.assignment.assignmentReason =
            departmentResult.reason;


        /* ========================================================
           TIMELINE — DEPARTMENT ASSIGNED
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Department Assigned",

            performerRole:
                "AI",

            status:
                complaint.status,

            description:
                `AI assigned the complaint to ${departmentResult.department.name}.`

        });


        /* ========================================================
           AI WORKER ASSIGNMENT
        ======================================================== */

        const workerResult =
            await WorkerService.assignBestWorker(

                complaint.assignment.department,

                complaint.location,

                complaint.category,

                complaint.priority

            );


        console.log(
            "👷 AI Worker Assignment:",
            workerResult
        );


        /* ========================================================
           WORKER FOUND
        ======================================================== */
if (
    workerResult.success &&
    workerResult.worker
) {

    complaint.assignment.worker =
        workerResult.worker._id;

    complaint.assignment.assignedAt =
        new Date();

    complaint.assignment.isAutoAssigned =
        true;

    complaint.assignment.assignmentReason =
        workerResult.reason;

    // IMPORTANT
    complaint.status = "Assigned";


    await TimelineService.log({

        complaint: complaint._id,

        eventType: "Worker Assigned",

        performerRole: "AI",

        status: "Assigned",

        description:
            `AI assigned the complaint to ${workerResult.worker.fullName}.`,

        metadata: {

            workerId:
                workerResult.worker._id,

            workerName:
                workerResult.worker.fullName,

            score:
                workerResult.score,

            distanceKm:
                workerResult.distanceKm,

            reason:
                workerResult.reason

        }

    });
            /* ====================================================
               AI ETA PREDICTION
            ==================================================== */

            const etaResult =
                await ETAService.predictETA(

                    complaint,

                    workerResult.worker._id,

                    complaint.assignment.department

                );


            console.log(
                "⏱️ AI ETA Prediction:",
                etaResult
            );


            if (etaResult.success) {

                complaint.ai.estimatedCompletionHours =
                    etaResult.estimatedHours;


                complaint.analytics.estimatedCompletionHours =
                    etaResult.estimatedHours;

            }



        } else {

            console.log(
                "⚠️ No worker assigned:",
                workerResult.reason
            );


            /* ====================================================
               TIMELINE — NO WORKER
            ==================================================== */

            await TimelineService.log({

                complaint:
                    complaint._id,

                eventType:
                    "Worker Assignment Pending",

                performerRole:
                    "AI",

                status:
                    complaint.status,

                description:
                    `AI could not assign a worker: ${workerResult.reason}`

            });

        }

  } else {

    /* ========================================================
       DEPARTMENT NOT FOUND
    ======================================================== */

    console.log(
        "⚠️ No department assigned:",
        departmentResult.reason
    );


    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Worker Assignment Pending",

        performerRole:
            "AI",

        status:
            "Under Review",

        description:
            `AI could not assign a department: ${departmentResult.reason}`,

        metadata: {

            category:
                complaint.category,

            priority:
                complaint.priority,

            reason:
                departmentResult.reason

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
                "Department Assignment Pending",

            message:
                `Complaint ${complaint.complaintNumber} could not be automatically assigned to a department.`,

            type:
                "Department Assignment Pending",

            priority:
                "High",

            actionUrl:
                `/admin/complaints/${complaint._id}`,

            icon:
                "alert-circle",

            metadata: {

                reason:
                    departmentResult.reason

            }

        });

    }

}


    /* ============================================================
       SAVE ALL AI DECISIONS
    ============================================================ */

    await complaint.save();


    /* ============================================================
       NOTIFICATION — AI ANALYSIS COMPLETED
    ============================================================ */

    await NotificationService.send({

        recipient:
            complaint.citizen,

        recipientClerkId:
            complaint.clerkUserId,

        complaint:
            complaint._id,

        title:
            "AI Analysis Completed",

        message:
            `${complaint.ai.detectedCategory} detected with ${complaint.ai.confidence}% confidence. ` +
            `Severity: ${complaint.ai.severity}. ` +
            `Priority: ${complaint.priority}. ` +
            `Risk Score: ${complaint.ai.riskScore}.`,

        type: "AI Analysis Completed",

        priority:
            complaint.priority,

        actionUrl:
            `/complaints/${complaint._id}`,

        icon:
            "🤖",

        metadata: {

            category:
                complaint.ai.detectedCategory,

            confidence:
                complaint.ai.confidence,

            severity:
                complaint.ai.severity,

            priority:
                complaint.priority,

            riskScore:
                complaint.ai.riskScore

        }

    });


    /* ============================================================
       NOTIFICATION — DEPARTMENT ASSIGNED
    ============================================================ */

    if (
        departmentResult.success &&
        departmentResult.department
    ) {

        await NotificationService.send({

            recipient:
                complaint.citizen,

            recipientClerkId:
                complaint.clerkUserId,

            complaint:
                complaint._id,

            title:
                "Department Assigned",

            message:
                `Your complaint has been automatically routed to ${departmentResult.department.name}.`,

            type: "Complaint Assigned",

            priority:
                complaint.priority,

            actionUrl:
                `/complaints/${complaint._id}`,

            icon:
                "🏢",

            metadata: {

                departmentId:
                    departmentResult.department._id,

                department:
                    departmentResult.department.name,

                code:
                    departmentResult.department.code

            }

        });

    }


    /* ============================================================
       NOTIFICATION — WORKER ASSIGNED
    ============================================================ */

    /* ============================================================
   NOTIFICATION — WORKER ASSIGNED
============================================================ */

if (
    complaint.assignment?.worker
) {

    const worker =
        await User.findById(
            complaint.assignment.worker
        );


    if (worker) {

        /* ====================================================
           WORKER NOTIFICATION
        ==================================================== */

        await NotificationService.send({

            recipient:
                worker._id,

            recipientClerkId:
                worker.clerkId,

            complaint:
                complaint._id,

            title:
                "New Complaint Assigned",

            message:
                `AI assigned complaint ${complaint.complaintNumber} to you.`,

            type:
                "Complaint Assigned",

            priority:
                complaint.priority,

            actionUrl:
                `/worker/complaints/${complaint._id}`,

            icon:
                "assignment",

            metadata: {

                category:
                    complaint.category,

                priority:
                    complaint.priority,

                estimatedCompletionHours:
                    complaint.ai.estimatedCompletionHours

            }

        });

    }

}


    /* ============================================================
       NOTIFICATION — ETA
    ============================================================ */

    if (
        complaint.analytics
            .estimatedCompletionHours > 0
    ) {

        await NotificationService.send({

            recipient:
                complaint.citizen,

            recipientClerkId:
                complaint.clerkUserId,

            complaint:
                complaint._id,

            title:
                "Estimated Completion Time",

            message:
                `AI estimates that your complaint will be completed in approximately ` +
                `${complaint.analytics.estimatedCompletionHours} hours.`,

            type: "ETA Updated",

            priority:
                complaint.priority,

            actionUrl:
                `/complaints/${complaint._id}`,

            icon:
                "⏱️",

            metadata: {

                estimatedHours:
                    complaint.analytics
                        .estimatedCompletionHours

            }

        });

    }


    /* ============================================================
       TIMELINE — AI COMPLETED
    ============================================================ */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "AI Analysis Completed",

        performerRole:
            "AI",

        status:
            complaint.status,

        description:

            primaryDetection

                ? `AI detected ${primaryCategory} with ${overallConfidence}% confidence. Severity: ${severity}. Priority: ${priority}. Risk Score: ${riskScore}.`

                : "AI did not detect a civic issue.",

    });


    console.log(
        `🔔 Notifications sent for complaint ${complaint.complaintNumber}`
    );


    console.log(
        `✅ AI completed: ${primaryCategory} | Confidence: ${overallConfidence}% | Severity: ${severity} | Priority: ${priority} | Risk: ${riskScore}`
    );


    return complaint;

}


    /* ========================================================
       SEVERITY CALCULATION
    ======================================================== */

    static calculateSeverity(
        confidence,
        areaPercentage,
        detectedClass
    ) {

        /*
         * Detection size is an important signal.
         *
         * Large object + high confidence
         * = higher severity.
         */

        let score = 0;


        /* Confidence contribution */

        if (confidence >= 80) {

            score += 40;

        }
        else if (confidence >= 60) {

            score += 30;

        }
        else if (confidence >= 40) {

            score += 20;

        }
        else {

            score += 10;

        }


        /* Object size contribution */

        if (areaPercentage >= 35) {

            score += 60;

        }
        else if (areaPercentage >= 20) {

            score += 45;

        }
        else if (areaPercentage >= 10) {

            score += 30;

        }
        else if (areaPercentage >= 5) {

            score += 20;

        }
        else {

            score += 10;

        }


        /*
         * Critical categories get a small
         * severity boost.
         */

        if (
            detectedClass === "OpenManhole" ||
            detectedClass === "WaterLeak"
        ) {

            score += 15;

        }


        if (score >= 80) {

            return "High";

        }


        if (score >= 50) {

            return "Medium";

        }


        return "Low";

    }


    /* ========================================================
       PRIORITY
    ======================================================== */

    static calculatePriority(
        detectedClass,
        severity
    ) {

        /*
         * Severity is the primary signal.
         */

        if (severity === "High") {

            return "High";

        }


        /*
         * Certain categories have a minimum
         * priority because of their public-safety impact.
         */

        const basePriority =
            AI_PRIORITY_MAP[
                detectedClass
            ] || "Medium";


        if (
            basePriority === "High"
        ) {

            return "High";

        }


        if (
            severity === "Medium"
        ) {

            return "Medium";

        }


        return "Low";

    }


    /* ========================================================
       AI TITLE
    ======================================================== */

    static generateTitle(
        category,
        severity
    ) {

        if (!category) {

            return "Civic issue detected";

        }


        return `${severity} severity ${category} detected`;

    }


    /* ========================================================
       AI DESCRIPTION
    ======================================================== */

    static generateDescription(
        category,
        severity,
        confidence,
        areaPercentage
    ) {

        if (!category) {

            return "AI could not determine the civic issue.";

        }


        let description =
            `${severity} severity ${category.toLowerCase()} detected by the AI vision system. `;


        description +=
            `YOLO detected the issue with ${confidence}% confidence. `;


        if (areaPercentage >= 20) {

            description +=
                "The detected issue occupies a significant portion of the image and may require prompt attention.";

        }
        else if (areaPercentage >= 10) {

            description +=
                "The detected issue is clearly visible and should be inspected by the responsible department.";

        }
        else {

            description +=
                "The detected issue should be inspected by the responsible department.";

        }


        return description;

    }


    /* ========================================================
       RISK SCORE
    ======================================================== */

    static calculateRiskScore(

        detectedClass,

        confidence,

        severity = "Medium",

        areaPercentage = 0

    ) {

        if (!detectedClass) {

            return 0;

        }


        const weight =
            RISK_WEIGHTS[
                detectedClass
            ] || 0.5;


        const severityMultiplier = {

            Low: 0.70,

            Medium: 1.00,

            High: 1.30

        };


        const multiplier =
            severityMultiplier[
                severity
            ] || 1;


        /*
         * Confidence:
         * 0–1
         *
         * Area:
         * 0–100
         */

        const confidenceScore =
            confidence * 100;


        const areaScore =
            Math.min(
                areaPercentage,
                100
            );


        let score =
            (
                confidenceScore *
                weight *
                0.70
            ) +
            (
                areaScore *
                0.30
            );


        score *= multiplier;


        return Number(
            Math.min(
                100,
                score
            ).toFixed(2)
        );

    }


    /* ========================================================
       GET COMPLAINT IMAGE
    ======================================================== */

    static getComplaintImageUrl(
        complaint
    ) {

        const image =
            complaint.complaintImages?.find(
                item =>
                    item.imageType ===
                    "Complaint"
            ) ||
            complaint.complaintImages?.[0];


        return image?.url || null;

    }


    /* ========================================================
       VERIFY RESOLUTION
    ======================================================== */

    static async verifyResolution(

        complaintId,

        afterImage

    ) {

        return {

            verified: false,

            confidence: 0,

            remarks:
                "Resolution verification will be implemented using the AI verification pipeline.",

        };

    }


    /* ========================================================
       DUPLICATE DETECTION
    ======================================================== */
static calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const EARTH_RADIUS =
        6371000;


    const toRadians =
        degrees =>
            degrees *
            Math.PI /
            180;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return EARTH_RADIUS * c;

}


   static async detectDuplicate(complaintId) {

    /* ========================================================
       GET CURRENT COMPLAINT
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
       GET LOCATION
    ======================================================== */

    const coordinates =
        complaint.location?.coordinates;

    if (
        !coordinates ||
        coordinates.length !== 2
    ) {

        return {

            isDuplicate: false,

            duplicateComplaint: null,

            distanceMeters: 0,

            confidence: 0,

            reason:
                "Complaint location is unavailable."

        };

    }


    const [
        longitude,
        latitude
    ] = coordinates;


    /* ========================================================
       GET CATEGORY
    ======================================================== */

    const category =
        complaint.category ||
        complaint.ai?.detectedCategory ||
        "Other";


    /* ========================================================
       FIND NEARBY COMPLAINTS
       
       20 METERS
    ======================================================== */

    const nearbyComplaints =
        await Complaint.find({

            _id: {
                $ne: complaint._id
            },

            category,

            isActive: true,

            status: {
                $nin: [
                    "Resolved",
                    "Closed"
                ]
            },

            location: {

                $near: {

                    $geometry: {

                        type: "Point",

                        coordinates: [
                            longitude,
                            latitude
                        ]

                    },

                    $maxDistance: 20

                }

            }

        })
        .sort({
            createdAt: 1
        })
        .limit(1);


    /* ========================================================
       NO DUPLICATE
    ======================================================== */

    if (
        nearbyComplaints.length === 0
    ) {

        return {

            isDuplicate: false,

            duplicateComplaint: null,

            distanceMeters: 0,

            confidence: 0,

            reason:
                "No unresolved complaint of the same category was found within 20 meters."

        };

    }


    /* ========================================================
       DUPLICATE FOUND
    ======================================================== */

    const duplicate =
        nearbyComplaints[0];


    /* ========================================================
       CALCULATE DISTANCE
       
       MongoDB $near sorts by distance,
       but the query does not directly return
       distance unless using aggregation.
       
       We calculate it using Haversine.
    ======================================================== */

    const [
        duplicateLongitude,
        duplicateLatitude
    ] =
        duplicate.location.coordinates;


    const distanceMeters =
        AIService.calculateDistance(

            latitude,

            longitude,

            duplicateLatitude,

            duplicateLongitude

        );


    /* ========================================================
       DUPLICATE CONFIDENCE
    ======================================================== */

    /*
       Same category + extremely close location
       = high confidence.
    */

    let confidence = 100;


    if (
        distanceMeters > 15
    ) {

        confidence = 85;

    }
    else if (
        distanceMeters > 10
    ) {

        confidence = 90;

    }
    else if (
        distanceMeters > 5
    ) {

        confidence = 95;

    }


    confidence =
        Number(
            confidence.toFixed(2)
        );


    /* ========================================================
       UPDATE CURRENT COMPLAINT
    ======================================================== */



    /* ========================================================
       RETURN
    ======================================================== */

    return {

        isDuplicate: true,

        duplicateComplaint:
            duplicate._id,

        duplicateComplaintNumber:
            duplicate.complaintNumber,

        duplicateStatus:
            duplicate.status,

        distanceMeters:
            Number(
                distanceMeters.toFixed(2)
            ),

        confidence,

        reason:
            `An unresolved ${category} complaint already exists within 20 meters.`

    };

}


    /* ========================================================
       ETA PREDICTION
    ======================================================== */

    static async predictETA(

        complaintId

    ) {

        return {

            estimatedHours: 0,

            estimatedCompletionDate: null,

            confidence: 0,

        };

    }

}


module.exports = AIService;