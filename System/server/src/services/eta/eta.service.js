const Department = require("../../models/Department");
const User = require("../../models/User");

class ETAService {

    /**
     * ============================================================
     * AI ETA PREDICTION
     * ============================================================
     *
     * Factors:
     * - Complaint category
     * - Priority
     * - Worker workload
     * - Worker performance
     * - Department historical resolution time
     *
     * Returns estimated completion time in hours.
     */

    static async predictETA(
        complaint,
        workerId = null,
        departmentId = null
    ) {

        try {

            /* ====================================================
               GET DEPARTMENT
            ==================================================== */

            let department = null;

            if (departmentId) {

                department =
                    await Department.findById(
                        departmentId
                    );

            }


            /* ====================================================
               GET WORKER
            ==================================================== */

            let worker = null;

            if (workerId) {

                worker =
                    await User.findById(
                        workerId
                    );

            }


            /* ====================================================
               BASE ETA
            ==================================================== */

            let etaHours = 24;


            /* ====================================================
               DEPARTMENT HISTORICAL DATA
            ==================================================== */

            if (
                department &&
                department.performance &&
                department.performance.averageResolutionHours > 0
            ) {

                etaHours =
                    department.performance
                        .averageResolutionHours;

            }


            /* ====================================================
               CATEGORY FACTOR
            ==================================================== */

            const category =
                String(
                    complaint.category || ""
                ).toLowerCase();


            const categoryFactors = {

                pothole: 1.0,

                "road damage": 1.2,

                garbage: 0.8,

                "garbage overflow": 0.8,

                streetlight: 0.9,

                "broken streetlight": 0.9,

                "water leakage": 1.1,

                drainage: 1.2,

                "drainage issue": 1.2,

                "open manhole": 1.3,

                "fallen tree": 1.5

            };


            const categoryFactor =
                categoryFactors[category] || 1.0;


            etaHours *= categoryFactor;


            /* ====================================================
               PRIORITY FACTOR
            ==================================================== */

            const priority =
                String(
                    complaint.priority || "Medium"
                ).toLowerCase();


            const priorityFactors = {

                high: 0.70,

                medium: 1.00,

                low: 1.30

            };


            const priorityFactor =
                priorityFactors[priority] || 1.0;


            etaHours *= priorityFactor;


            /* ====================================================
               WORKER WORKLOAD FACTOR
            ==================================================== */

            if (worker) {

                const workload =
                    Number(
                        worker.workload || 0
                    );


                if (workload === 0) {

                    etaHours *= 0.85;

                } else if (workload <= 2) {

                    etaHours *= 1.0;

                } else if (workload <= 5) {

                    etaHours *= 1.20;

                } else if (workload <= 10) {

                    etaHours *= 1.50;

                } else {

                    etaHours *= 1.80;

                }

            }


            /* ====================================================
               WORKER PERFORMANCE
            ==================================================== */

            if (
                worker &&
                worker.performance
            ) {

                const averageResolutionHours =
                    Number(
                        worker.performance
                            .averageResolutionHours || 0
                    );


                if (
                    averageResolutionHours > 0
                ) {

                    /*
                     * Blend department ETA with
                     * worker historical performance.
                     */

                    etaHours =
                        (etaHours * 0.7) +
                        (averageResolutionHours * 0.3);

                }


                /* =================================================
                   WORKER RATING
                ================================================= */

                const rating =
                    Number(
                        worker.performance.rating || 5
                    );


                if (rating >= 4.5) {

                    etaHours *= 0.95;

                } else if (rating < 3) {

                    etaHours *= 1.15;

                }

            }


            /* ====================================================
               SAFETY LIMITS
            ==================================================== */

            etaHours =
                Math.max(
                    1,
                    Math.min(
                        Math.round(
                            etaHours * 10
                        ) / 10,
                        168
                    )
                );


            /* ====================================================
               REASON
            ==================================================== */

            const reason =
                `ETA calculated using ${complaint.category} category, ` +
                `${complaint.priority} priority, ` +
                `worker workload, worker performance and ` +
                `department resolution history.`;


            return {

                success: true,

                estimatedHours:
                    etaHours,

                reason

            };

        } catch (error) {

            console.error(
                "❌ ETA prediction failed:",
                error.message
            );


            return {

                success: false,

                estimatedHours: 24,

                reason:
                    "Default ETA used because prediction failed."

            };

        }

    }

}


module.exports = ETAService;