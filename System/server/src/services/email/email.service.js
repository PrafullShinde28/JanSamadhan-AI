const nodemailer = require("nodemailer");

class EmailService {
    /**
     * Creates and returns a configured Nodemailer transporter instance.
     */
    static getTransporter() {
        const user = process.env.SMTP_USER || process.env.EMAIL_USER;
        const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        const port = parseInt(process.env.SMTP_PORT || "465", 10);
        const secure = port === 465;

        if (!user || !pass) {
            return null;
        }

        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Dispatches an official field worker onboarding email with invitation token.
     */
    static async sendWorkerInvitation({ to, fullName, departmentName, employeeId, token, clientUrl }) {
        const baseUrl = (clientUrl || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
        const inviteLink = `${baseUrl}/invitation/accept?token=${token}`;

        const transporter = this.getTransporter();

        if (!transporter) {
            console.warn(
                "⚠️ SMTP email not configured. Set SMTP_USER and SMTP_PASS in .env to dispatch live emails.\n" +
                `🔗 Direct Worker Invitation Link for ${to}:\n${inviteLink}`
            );
            return {
                sent: false,
                reason: "SMTP_NOT_CONFIGURED",
                inviteLink
            };
        }

        const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@jansamadhan.gov.in";

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>JanSamadhan Staff Invitation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { background: #1e3a8a; padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 0; font-size: 13px; color: #93c5fd; font-weight: 500; }
            .badge { display: inline-block; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-top: 12px; }
            .body { padding: 32px 28px; }
            .body h2 { margin: 0 0 16px 0; font-size: 18px; color: #0f172a; }
            .body p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
            .card { background: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .card-row:last-child { margin-bottom: 0; }
            .card-label { color: #64748b; font-weight: 600; }
            .card-val { color: #0f172a; font-weight: 700; }
            .cta-container { text-align: center; margin: 32px 0 24px 0; }
            .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
            .raw-link { font-size: 12px; word-break: break-all; color: #2563eb; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1; margin-top: 20px; }
            .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>JanSamadhan AI</h1>
              <p>Municipal Civic Issue Resolution System</p>
              <span class="badge">Official Field Staff Onboarding</span>
            </div>
            
            <div class="body">
              <h2>Welcome to the Team, ${fullName}!</h2>
              <p>
                You have been registered as an authorized <strong>Field Worker</strong> for municipal operations on the JanSamadhan AI platform. 
                Please use the link below to accept your invitation and activate your field account.
              </p>

              <div class="card">
                <div class="card-row">
                  <span class="card-label">Assigned Department:</span>
                  <span class="card-val">${departmentName}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">Employee ID:</span>
                  <span class="card-val">${employeeId}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">Role Title:</span>
                  <span class="card-val">Field Operations Worker</span>
                </div>
                <div class="card-row">
                  <span class="card-label">Link Expiration:</span>
                  <span class="card-val">7 Days</span>
                </div>
              </div>

              <div class="cta-container">
                <a href="${inviteLink}" class="cta-btn" target="_blank">Accept Invitation & Activate Account</a>
              </div>

              <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
                If the button above does not work, copy and paste this link into your mobile or desktop browser:
              </p>
              <div class="raw-link">
                ${inviteLink}
              </div>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} JanSamadhan Civic Administration. All rights reserved.</p>
              <p>This is an automated system notification. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        try {
            const info = await transporter.sendMail({
                from: `"JanSamadhan Municipal Administration" <${senderEmail}>`,
                to,
                subject: `Official Invitation: Join ${departmentName} as Field Worker | JanSamadhan AI`,
                html,
            });

            console.log(`📧 Worker invitation email sent to ${to}: ${info.messageId}`);
            return {
                sent: true,
                messageId: info.messageId,
                inviteLink
            };
        } catch (error) {
            console.error(`❌ Failed to send invitation email to ${to}:`, error.message);
            return {
                sent: false,
                reason: error.message,
                inviteLink
            };
        }
    }

    /**
     * Dispatches an admin invitation email.
     */
    static async sendAdminInvitation({ to, fullName, token, clientUrl }) {
        const baseUrl = (clientUrl || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
        const inviteLink = `${baseUrl}/invitation/accept?token=${token}`;

        const transporter = this.getTransporter();

        if (!transporter) {
            console.warn(
                "⚠️ SMTP email not configured. Set SMTP_USER and SMTP_PASS in .env to dispatch live emails.\n" +
                `🔗 Direct Admin Invitation Link for ${to}:\n${inviteLink}`
            );
            return {
                sent: false,
                reason: "SMTP_NOT_CONFIGURED",
                inviteLink
            };
        }

        const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@jansamadhan.gov.in";

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
            .body { padding: 32px 28px; }
            .cta-btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size:22px;">JanSamadhan AI</h1>
              <p style="margin:4px 0 0 0; color:#94a3b8; font-size:12px;">Municipal Administrative Console</p>
            </div>
            <div class="body">
              <h2>Administrator Access Invitation</h2>
              <p>Hello ${fullName}, you have been invited to join the JanSamadhan Administration team as a Municipal Admin.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${inviteLink}" class="cta-btn" target="_blank">Accept Admin Invitation</a>
              </div>
              <p style="font-size: 12px; color: #64748b;">Direct link: ${inviteLink}</p>
            </div>
          </div>
        </body>
        </html>
        `;

        try {
            const info = await transporter.sendMail({
                from: `"JanSamadhan Municipal Administration" <${senderEmail}>`,
                to,
                subject: `Municipal Admin Invitation | JanSamadhan AI`,
                html,
            });

            return {
                sent: true,
                messageId: info.messageId,
                inviteLink
            };
        } catch (error) {
            console.error(`❌ Failed to send admin invitation email to ${to}:`, error.message);
            return {
                sent: false,
                reason: error.message,
                inviteLink
            };
        }
    }
}

module.exports = EmailService;
