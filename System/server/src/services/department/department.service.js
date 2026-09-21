const Department = require("../../models/Department");

class DepartmentService {

    /* ============================================================
       AI DEPARTMENT RECOMMENDATION
    ============================================================ */

    static async recommendDepartment(category) {

        if (!category) {

            throw new Error(
                "Complaint category is required for department recommendation"
            );

        }

        const CATEGORY_DEPARTMENT_MAP = {

            "Pothole": "ROAD",

            "Road Damage": "ROAD",

            "Garbage Overflow": "SANITATION",

            "Water Leakage": "WATER",

            "Drainage Issue": "DRAINAGE",

            "Broken Streetlight": "ELECTRICITY",

            "Fallen Tree": "GARDEN",

            "Open Manhole": "DRAINAGE"

        };


        const departmentCode =
            CATEGORY_DEPARTMENT_MAP[category];


        /* ========================================================
           UNKNOWN CATEGORY
        ======================================================== */

        if (!departmentCode) {

            return {

                success: false,

                department: null,

                reason:
                    `No department mapping available for category: ${category}`

            };

        }


        /* ========================================================
           FIND ACTIVE DEPARTMENT
        ======================================================== */

        const department =
            await Department.findOne({

                code: departmentCode,

                isActive: true

            });


        if (!department) {

            return {

                success: false,

                department: null,

                reason:
                    `Active department not found for code: ${departmentCode}`

            };

        }


        /* ========================================================
           RETURN AI RECOMMENDATION
        ======================================================== */

        return {

            success: true,

            department,

            reason:
                `${category} is automatically routed to ${department.name}.`

        };

    }

}


module.exports =
    DepartmentService;