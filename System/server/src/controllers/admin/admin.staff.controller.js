const crypto = require("crypto");
const User = require("../../models/User");
const Invitation = require("../../models/Invitation");
const Department = require("../../models/Department");
const AuditService = require("../../services/audit/audit.service");

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

class AdminStaffController {
    /* ============================================================
       WORKER / ADMIN STATS OVERVIEW
       ============================================================ */
    static async getStats(req, res, next) {
        try {
            const [
                totalWorkers,
                activeWorkers,
                onlineWorkers,
                offlineWorkers,
                pendingInvitations,
                totalAdmins
            ] = await Promise.all([
                User.countDocuments({ role: "Worker" }),
                User.countDocuments({ role: "Worker", status: "Active" }),
                User.countDocuments({ role: "Worker", isOnline: true }),
                User.countDocuments({ role: "Worker", isOnline: false }),
                Invitation.countDocuments({ status: "Pending", expiresAt: { $gt: new Date() } }),
                User.countDocuments({ role: "Admin" })
            ]);

            return res.status(200).json({
                success: true,
                data: {
                    totalWorkers,
                    activeWorkers,
                    onlineWorkers,
                    offlineWorkers,
                    pendingInvitations,
                    totalAdmins
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       WORKER INVITATION
       ============================================================ */
    static async inviteWorker(req, res, next) {
        try {
            const { fullName, email, phone, employeeId, department, designation, skills } = req.body;

            if (!fullName || !email || !employeeId || !department) {
                return res.status(400).json({
                    success: false,
                    message: "Required fields: fullName, email, employeeId, department"
                });
            }

            const cleanEmail = email.toLowerCase().trim();

            // Check if there is an active worker with this email or employee ID
            const existingUser = await User.findOne({
                $or: [
                    { email: cleanEmail },
                    { employeeId: employeeId.trim() }
                ]
            });

            if (existingUser && existingUser.role === "Worker") {
                return res.status(400).json({
                    success: false,
                    message: "A Worker with this email or employee ID already exists."
                });
            }

            // Check if department exists
            const dept = await Department.findById(department);
            if (!dept) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned Department not found."
                });
            }

            // Revoke any previous pending invitations for this email to avoid duplicates
            await Invitation.updateMany(
                { email: cleanEmail, status: "Pending" },
                { $set: { status: "Revoked" } }
            );

            // Generate cryptographically secure token
            const token = crypto.randomBytes(32).toString("hex");
            const tokenHash = hashToken(token);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            const invitation = await Invitation.create({
                fullName,
                email: cleanEmail,
                role: "Worker",
                department,
                employeeId: employeeId.trim(),
                designation: designation || "Field Worker",
                skills: skills || [],
                invitedBy: req.user._id,
                tokenHash,
                expiresAt,
                status: "Pending"
            });

            // Log Audit Timeline
            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Worker Invitation Created",
                entity: "Invitation",
                entityId: invitation._id,
                description: `Admin invited Worker ${fullName} (Email: ${cleanEmail}, EmployeeID: ${employeeId})`,
            });

            return res.status(201).json({
                success: true,
                message: "Worker invitation created successfully.",
                data: invitation,
                token // Return raw token to let Admin copy the claim URL
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       ADMIN INVITATION
       ============================================================ */
    static async inviteAdmin(req, res, next) {
        try {
            const { fullName, email } = req.body;

            if (!fullName || !email) {
                return res.status(400).json({
                    success: false,
                    message: "Required fields: fullName, email"
                });
            }

            const cleanEmail = email.toLowerCase().trim();

            const existingUser = await User.findOne({ email: cleanEmail });
            if (existingUser && existingUser.role === "Admin") {
                return res.status(400).json({
                    success: false,
                    message: "An Admin with this email address already exists."
                });
            }

            // Revoke any previous pending invitations for this email
            await Invitation.updateMany(
                { email: cleanEmail, status: "Pending" },
                { $set: { status: "Revoked" } }
            );

            const token = crypto.randomBytes(32).toString("hex");
            const tokenHash = hashToken(token);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            const invitation = await Invitation.create({
                fullName,
                email: cleanEmail,
                role: "Admin",
                invitedBy: req.user._id,
                tokenHash,
                expiresAt,
                status: "Pending"
            });

            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Admin Invitation Created",
                entity: "Invitation",
                entityId: invitation._id,
                description: `Admin invited Admin ${fullName} (Email: ${cleanEmail})`,
            });

            return res.status(201).json({
                success: true,
                message: "Admin invitation created successfully.",
                data: invitation,
                token
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       LIST INVITATIONS
       ============================================================ */
    static async getInvitations(req, res, next) {
        try {
            const { role, status } = req.query;
            const query = {};

            if (role) query.role = role;
            if (status) {
                query.status = status;
            }

            const list = await Invitation.find(query)
                .populate("department", "name code")
                .populate("invitedBy", "fullName email")
                .sort({ createdAt: -1 });

            // Automatically check and mark Expired if time passed
            const now = new Date();
            const checkedList = await Promise.all(list.map(async (inv) => {
                if (inv.status === "Pending" && inv.expiresAt < now) {
                    inv.status = "Expired";
                    await inv.save();
                }
                return inv;
            }));

            return res.status(200).json({
                success: true,
                data: checkedList
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       RESEND INVITATION
       ============================================================ */
    static async resendInvitation(req, res, next) {
        try {
            const { id } = req.params;
            const invitation = await Invitation.findById(id);

            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    message: "Invitation not found"
                });
            }

            // Generate new token parameters
            const token = crypto.randomBytes(32).toString("hex");
            const tokenHash = hashToken(token);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            invitation.tokenHash = tokenHash;
            invitation.expiresAt = expiresAt;
            invitation.status = "Pending";
            await invitation.save();

            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Invitation Resent",
                entity: "Invitation",
                entityId: invitation._id,
                description: `Resent staff invitation to ${invitation.email}`,
            });

            return res.status(200).json({
                success: true,
                message: "Invitation resent successfully.",
                data: invitation,
                token
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       REVOKE INVITATION
       ============================================================ */
    static async revokeInvitation(req, res, next) {
        try {
            const { id } = req.params;
            const invitation = await Invitation.findById(id);

            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    message: "Invitation not found"
                });
            }

            invitation.status = "Revoked";
            await invitation.save();

            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Invitation Revoked",
                entity: "Invitation",
                entityId: invitation._id,
                description: `Revoked staff invitation for ${invitation.email}`,
            });

            return res.status(200).json({
                success: true,
                message: "Invitation revoked successfully.",
                data: invitation
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       ENROLL EXISTING CITIZEN AS WORKER
       ============================================================ */
    static async enrollCitizen(req, res, next) {
        try {
            const { userId, employeeId, department, designation, skills } = req.body;

            if (!userId || !employeeId || !department) {
                return res.status(400).json({
                    success: false,
                    message: "Required fields: userId, employeeId, department"
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Citizen user not found."
                });
            }

            if (user.role !== "Citizen") {
                return res.status(400).json({
                    success: false,
                    message: "User is already registered as staff."
                });
            }

            // Check employeeId unique
            const existingEmp = await User.findOne({ employeeId: employeeId.trim() });
            if (existingEmp) {
                return res.status(400).json({
                    success: false,
                    message: "Employee ID code is already claimed."
                });
            }

            // Check department
            const dept = await Department.findById(department);
            if (!dept) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found."
                });
            }

            const oldRole = user.role;

            user.role = "Worker";
            user.department = department;
            user.employeeId = employeeId.trim();
            user.designation = designation || "Field Worker";
            user.skills = skills || [];
            user.status = "Active";
            await user.save();

            // Link to department activeWorkers
            await dept.addWorker(user._id);

            // Log audit change
            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Staff Enrollment",
                entity: "User",
                entityId: user._id,
                description: `Admin enrolled existing Citizen ${user.fullName} as ${user.role} (EmployeeID: ${employeeId})`,
                metadata: {
                    oldRole,
                    newRole: user.role,
                    department: dept.code
                }
            });

            return res.status(200).json({
                success: true,
                message: "Citizen successfully enrolled as Field Worker.",
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       WORKERS LIST
       ============================================================ */
    static async getWorkers(req, res, next) {
        try {
            const workers = await User.find({ role: "Worker" })
                .populate("department", "name code")
                .sort({ fullName: 1 });

            return res.status(200).json({
                success: true,
                data: workers
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       WORKER DETAILS
       ============================================================ */
    static async getWorkerDetails(req, res, next) {
        try {
            const { id } = req.params;
            const worker = await User.findById(id).populate("department", "name code");

            if (!worker || worker.role !== "Worker") {
                return res.status(404).json({
                    success: false,
                    message: "Worker profile not found."
                });
            }

            return res.status(200).json({
                success: true,
                data: worker
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       UPDATE WORKER
       ============================================================ */
    static async updateWorker(req, res, next) {
        try {
            const { id } = req.params;
            const { department, employeeId, designation, skills, status } = req.body;

            const worker = await User.findById(id);
            if (!worker || worker.role !== "Worker") {
                return res.status(404).json({
                    success: false,
                    message: "Worker profile not found."
                });
            }

            if (employeeId && employeeId.trim() !== worker.employeeId) {
                const existingEmp = await User.findOne({ employeeId: employeeId.trim() });
                if (existingEmp) {
                    return res.status(400).json({
                        success: false,
                        message: "Employee ID code is already claimed."
                    });
                }
                worker.employeeId = employeeId.trim();
            }

            if (department && department !== worker.department?.toString()) {
                const oldDept = await Department.findById(worker.department);
                if (oldDept) {
                    await oldDept.removeWorker(worker._id);
                }
                const newDept = await Department.findById(department);
                if (newDept) {
                    await newDept.addWorker(worker._id);
                    worker.department = department;
                }
            }

            if (designation !== undefined) worker.designation = designation;
            if (skills !== undefined) worker.skills = skills;
            if (status !== undefined) {
                worker.status = status;
                worker.isActive = status === "Active";
            }

            await worker.save();

            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Worker Details Updated",
                entity: "User",
                entityId: worker._id,
                description: `Admin updated details for worker ${worker.fullName}`,
            });

            return res.status(200).json({
                success: true,
                message: "Worker profile updated successfully.",
                data: worker
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       ADMINS LIST
       ============================================================ */
    static async getAdmins(req, res, next) {
        try {
            const admins = await User.find({ role: "Admin" })
                .sort({ fullName: 1 });

            return res.status(200).json({
                success: true,
                data: admins
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       DEPARTMENTS LIST (WITH SEARCH & STATUS FILTER)
       ============================================================ */
    static async getDepartments(req, res, next) {
        try {
            const { search, status } = req.query;
            const query = {};

            if (status) {
                query.status = status;
            }

            if (search && search.trim()) {
                const searchRegex = new RegExp(search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
                query.$or = [
                    { name: searchRegex },
                    { code: searchRegex },
                    { description: searchRegex }
                ];
            }

            const list = await Department.find(query).sort({ name: 1 });
            return res.status(200).json({
                success: true,
                count: list.length,
                data: list
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       ADD DEPARTMENT
       ============================================================ */
    static async addDepartment(req, res, next) {
        try {
            const { name, code, description, email, phone } = req.body;

            if (!name || !code) {
                return res.status(400).json({
                    success: false,
                    message: "Required fields: name, code"
                });
            }

            const existingCode = await Department.findOne({ code: code.toUpperCase().trim() });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: "Department code is already claimed."
                });
            }

            const dept = await Department.create({
                name: name.trim(),
                code: code.toUpperCase().trim(),
                description: description || "",
                email: email || "",
                phone: phone || "",
                isActive: true
            });

            await AuditService.log({
                user: req.user._id,
                clerkId: req.user.clerkId,
                role: "Admin",
                action: "Department Created",
                entity: "Department",
                entityId: dept._id,
                description: `Admin created Department ${dept.name} (${dept.code})`,
            });

            return res.status(201).json({
                success: true,
                message: "Department created successfully.",
                data: dept
            });
        } catch (error) {
            next(error);
        }
    }

    /* ============================================================
       SEARCH CITIZENS FOR ENROLLMENT
       ============================================================ */
    static async searchCitizens(req, res, next) {
        try {
            const { query } = req.query;
            if (!query || query.trim().length < 2) {
                return res.status(200).json({ success: true, data: [] });
            }
            const citizens = await User.find({
                role: "Citizen",
                $or: [
                    { fullName: { $regex: query.trim(), $options: "i" } },
                    { email: { $regex: query.trim(), $options: "i" } },
                    { phone: { $regex: query.trim(), $options: "i" } }
                ]
            }).limit(10);

            return res.status(200).json({
                success: true,
                data: citizens
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminStaffController;
