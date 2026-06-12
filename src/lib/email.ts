import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "JEI Links <no-reply@jeilinks.com>";
const APP_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your JEI Links password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reset Your Password</title>
        </head>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1px solid #222;overflow:hidden;max-width:560px;width:100%;">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 40px 24px;border-bottom:1px solid #1e1e1e;">
                      <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#6366f1;">JEI<span style="color:#ffffff;">LINKS</span></span>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:32px 40px;">
                      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">Reset your password</h1>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#888888;">
                        We received a request to reset the password for your JEI Links account. Click the button below to choose a new password. This link expires in <strong style="color:#ffffff;">1 hour</strong>.
                      </p>
                      <a href="${resetLink}"
                         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.3px;">
                        Reset Password
                      </a>
                      <p style="margin:24px 0 0;font-size:13px;color:#555555;">
                        If you didn't request this, you can safely ignore this email — your password will not change.
                      </p>
                      <p style="margin:12px 0 0;font-size:12px;color:#444444;word-break:break-all;">
                        Or copy this link: <a href="${resetLink}" style="color:#6366f1;">${resetLink}</a>
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #1e1e1e;">
                      <p style="margin:0;font-size:12px;color:#444444;">
                        &copy; ${new Date().getFullYear()} JEI Links. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendAgentWelcomeEmail({
  to,
  name,
  storeSlug,
  whatsappGroupUrl,
}: {
  to: string;
  name: string;
  storeSlug: string;
  whatsappGroupUrl: string;
}) {
  const storeUrl = `${APP_URL}/store/${storeSlug}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🎉 Welcome to the JEI Links Agent Team!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Welcome, Agent!</title>
        </head>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1px solid #222;overflow:hidden;max-width:560px;width:100%;">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 40px 24px;border-bottom:1px solid #1e1e1e;">
                      <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#6366f1;">JEI<span style="color:#ffffff;">LINKS</span></span>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:32px 40px;">
                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#ffffff;">Welcome, ${name}! 🎉</h1>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#888888;">
                        You are now an official <strong style="color:#6366f1;">JEILINKS Agent</strong>. Your wholesale pricing and branded store are live and ready to use.
                      </p>

                      <!-- Store Link -->
                      <div style="background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:24px;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6366f1;">Your Personal Store Link</p>
                        <a href="${storeUrl}" style="font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;word-break:break-all;">${storeUrl}</a>
                        <p style="margin:8px 0 0;font-size:12px;color:#555;">Share this link with your customers so they can order directly from you.</p>
                      </div>

                      ${whatsappGroupUrl ? `
                      <!-- WhatsApp Group -->
                      <div style="background:#0d1f17;border:1px solid #1a3a25;border-radius:12px;padding:20px;margin-bottom:24px;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#25D366;">⚡ Important — Join the Agent Group</p>
                        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#888888;">Get updates, tips, and priority support in our exclusive agents WhatsApp community.</p>
                        <a href="${whatsappGroupUrl}"
                           style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
                          Join WhatsApp Agent Group
                        </a>
                      </div>
                      ` : ""}

                      <a href="${APP_URL}/dashboard"
                         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
                        Go to Your Dashboard
                      </a>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #1e1e1e;">
                      <p style="margin:0;font-size:12px;color:#444444;">
                        &copy; ${new Date().getFullYear()} JEI Links. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
