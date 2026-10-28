const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendWelcomeEmail(toEmail) {
  const mailOptions = {
    from: `"GitHired" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to GitHired — Your Dream Career Awaits!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f2ff;padding:40px 0;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <div style="background:linear-gradient(135deg,#667eea,#2563eb);padding:48px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:32px;font-weight:800;">Git<span style="color:#bfdbfe;">Hired</span></h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Your Career Platform</p>
          </div>

          <div style="padding:48px 40px;">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:24px;">Welcome aboard! 🚀</h2>
            <p style="color:#475569;font-size:16px;line-height:1.7;">
              You've just joined a community of <strong>ambitious professionals</strong> who are serious about landing their dream careers. We're thrilled to have you!
            </p>

            <div style="margin:24px 0;padding:16px;background:#f8faff;border-radius:12px;border-left:4px solid #2563eb;">
              <p style="margin:0;color:#1e293b;font-size:15px;"><strong>🎯 Smart Job Matching</strong></p>
              <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Opportunities tailored to your skills and aspirations.</p>
            </div>
            <div style="margin:12px 0;padding:16px;background:#f8faff;border-radius:12px;border-left:4px solid #2563eb;">
              <p style="margin:0;color:#1e293b;font-size:15px;"><strong>🧠 AI Interview Prep</strong></p>
              <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Practice with real interview questions powered by AI.</p>
            </div>
            <div style="margin:12px 0;padding:16px;background:#f8faff;border-radius:12px;border-left:4px solid #2563eb;">
              <p style="margin:0;color:#1e293b;font-size:15px;"><strong>📈 Career Growth Insights</strong></p>
              <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Data-driven advice to accelerate your career journey.</p>
            </div>

            <div style="text-align:center;margin-top:40px;">
              <a href="https://yourgithired.com" style="display:inline-block;background:linear-gradient(135deg,#667eea,#2563eb);color:#fff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:700;">
                Explore GitHired →
              </a>
            </div>

            <p style="margin:32px 0 0;color:#94a3b8;font-size:13px;text-align:center;">
              If you didn't sign up for GitHired, you can safely ignore this email.
            </p>
          </div>

          <div style="background:#f8faff;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:13px;">© ${new Date().getFullYear()} GitHired. All rights reserved.</p>
          </div>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendWelcomeEmail;