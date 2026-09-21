const Complaint = require("../../models/Complaint");

class DuplicateService {

    /* ============================================================
       CHECK DUPLICATE COMPLAINT
       
       Rules:
       - Same AI category
       - Within 20 meters
       - Complaint is not Resolved/Closed
       - Exclude the current complaint itself
    ============================================================ */

    static async checkDuplicate(
        category,
        longitude,
        latitude,
        radius = 20,
        excludeComplaintId = null
    ) {

        console.log(
            "🔍 DUPLICATE CHECK"
        );

        console.log(
            "Category:",
            category
        );

        console.log(
            "Longitude:",
            longitude
        );

        console.log(
            "Latitude:",
            latitude
        );

        console.log(
            "Radius:",
            radius,
            "meters"
        );

        console.log(
            "Exclude Complaint:",
            excludeComplaintId
        );


        /* ========================================================
           BUILD QUERY
        ======================================================== */

        const query = {

            category,

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

                            Number(longitude),

                            Number(latitude)

                        ]

                    },

                    $maxDistance:
                        Number(radius)

                }

            }

        };


        /* ========================================================
           EXCLUDE CURRENT COMPLAINT
        ======================================================== */

        if (excludeComplaintId) {

            query._id = {

                $ne:
                    excludeComplaintId

            };

        }


        /* ========================================================
           SEARCH
        ======================================================== */

        const complaints =
            await Complaint.find(
                query
            ).limit(1);


        /* ========================================================
           NO DUPLICATE
        ======================================================== */

        if (!complaints.length) {

            return {

                isDuplicate:
                    false,

                complaint:
                    null

            };

        }


        /* ========================================================
           DUPLICATE FOUND
        ======================================================== */

        return {

            isDuplicate:
                true,

            complaint:
                complaints[0]

        };

    }

}


module.exports =
    DuplicateService;