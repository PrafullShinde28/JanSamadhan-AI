const crypto = require("crypto");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const AuditService = require("../services/audit/audit.service");

const splitName = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    return {
        firstName: parts[0] || "Citizen",
        lastName: parts.slice(1).join(" "),
        fullName: parts.join(" ") || "Citizen",
    };
};

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

class AuthController {
    static async syncUser(req, res, next) {
        try {
            const { name, email, profileImage, token } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "An email address is required to set up your account.",
                });
            }

            const cleanEmail = email.toLowerCase().trim();
            const identity = splitName(name);

            // 1. Check if user already exists in MongoDB
            let user = await User.findOne({ clerkId: req.clerkUserId });

            if (user) {
                // If user is suspended or inactive, reject the login/sync!
                if (user.status !== "Active") {
                    return res.status(403).json({
                        success: false,
                        message: "Account is suspended or inactive.",
                    });
                }

                // Check if they have a pending invitation to claim
                let validInvitation = null;
                if (user.role === "Citizen") {
                    if (token) {
                        const tokenHash = hashToken(token);
                        validInvitation = await Invitation.findOne({
                            tokenHash,
                            status: "Pending",
                            expiresAt: { $gt: new Date() }
                        });

                        if (validInvitation) {
                            if (validInvitation.email.toLowerCase().trim() !== cleanEmail) {
                                return res.status(403).json({
                                    success: false,
                                    message: "This invitation does not belong to the authenticated account.",
                                });
                            }
                        } else {
                            return res.status(403).json({
                                success: false,
                                message: "Invalid, expired, or revoked invitation.",
                            });
                        }
                    } else {
                        // Check email match
                        validInvitation = await Invitation.findOne({
                            email: cleanEmail,
                            status: "Pending",
                            expiresAt: { $gt: new Date() }
                        });
                    }

                    if (validInvitation) {
                        // Claim invitation
                        user.role = validInvitation.role;
                        user.department = validInvitation.department;
                        user.employeeId = validInvitation.employeeId;
                        user.designation = validInvitation.designation;
                        user.skills = validInvitation.skills;
                        user.status = "Active";
                        await user.save();

                        // Mark invitation used
                        validInvitation.status = "Accepted";
                        validInvitation.usedAt = new Date();
                        await validInvitation.save();

                        // Log audit timeline
                        await AuditService.log({
                            user: user._id,
                            clerkId: req.clerkUserId,
                            role: user.role,
                            action: "Staff Enrollment",
                            entity: "User",
                            entityId: user._id,
                            description: `Citizen account upgraded to ${user.role} via invitation acceptance.`,
                        });
                    }
                }

                // Update standard login fields
                user.firstName = identity.firstName;
                user.lastName = identity.lastName;
                user.fullName = identity.fullName;
                user.profileImage = profileImage || user.profileImage || "";
                user.lastLogin = new Date();
                user.isOnline = true;
                if (user.role === "Worker" && user.availability === "Offline") {
                    user.availability = "Available";
                }
                await user.save();

                let redirect = "/citizen/dashboard";
                if (user.role === "Admin") redirect = "/admin/dashboard";
                if (user.role === "Worker") redirect = "/worker/dashboard";

                return res.status(200).json({
                    success: true,
                    data: user,
                    redirect
                });
            }

            // 2. New user creation flow
            let invitation = null;

            if (token) {
                const tokenHash = hashToken(token);
                invitation = await Invitation.findOne({
                    tokenHash,
                    status: "Pending",
                    expiresAt: { $gt: new Date() }
                });

                if (invitation) {
                    if (invitation.email.toLowerCase().trim() !== cleanEmail) {
                        return res.status(403).json({
                            success: false,
                            message: "This invitation does not belong to the authenticated account.",
                        });
                    }
                } else {
                    return res.status(403).json({
                        success: false,
                        message: "Invalid, expired, or revoked invitation.",
                    });
                }
            } else {
                invitation = await Invitation.findOne({
                    email: cleanEmail,
                    status: "Pending",
                    expiresAt: { $gt: new Date() }
                });
            }

            let role = "Citizen";
            let department = null;
            let employeeId = null;
            let designation = "";
            let skills = [];

            if (invitation) {
                role = invitation.role;
                department = invitation.department;
                employeeId = invitation.employeeId;
                designation = invitation.designation;
                skills = invitation.skills;
            }

            const userPayload = {
                clerkId: req.clerkUserId,
                ...identity,
                email: cleanEmail,
                profileImage: profileImage || "",
                role,
                status: "Active",
                isActive: true,
                department,
                designation,
                skills,
                lastLogin: new Date()
            };

            if (employeeId) {
                userPayload.employeeId = employeeId;
            }

            user = await User.create(userPayload);

            if (invitation) {
                invitation.status = "Accepted";
                invitation.usedAt = new Date();
                await invitation.save();

                await AuditService.log({
                    user: user._id,
                    clerkId: req.clerkUserId,
                    role: user.role,
                    action: "Staff Enrollment",
                    entity: "User",
                    entityId: user._id,
                    description: `Enrolled new staff member ${user.fullName} as ${user.role}.`,
                });
            } else {
                await AuditService.log({
                    user: user._id,
                    clerkId: req.clerkUserId,
                    role: "Citizen",
                    action: "Citizen Registration",
                    entity: "User",
                    entityId: user._id,
                    description: `Registered new citizen ${user.fullName}.`,
                });
            }

            let redirect = "/citizen/dashboard";
            if (user.role === "Admin") redirect = "/admin/dashboard";
            if (user.role === "Worker") redirect = "/worker/dashboard";

            return res.status(200).json({
                success: true,
                data: user,
                redirect
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMe(req, res) {
        return res.status(200).json({ success: true, data: req.user });
    }
}

module.exports = AuthController;
