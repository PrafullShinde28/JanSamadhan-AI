const AuditLog = require("../../models/AuditLog");

class AuditService {

    static async log({

        user = null,

        clerkId = "",

        role = "System",

        action,

        entity,

        entityId = null,

        description = "",

        ipAddress = "",

        userAgent = "",

        metadata = {},

        status = "Success"

    }) {

        return AuditLog.create({

            user,

            clerkId,

            role,

            action,

            entity,

            entityId,

            description,

            ipAddress,

            userAgent,

            metadata,

            status

        });

    }

}

module.exports = AuditService;