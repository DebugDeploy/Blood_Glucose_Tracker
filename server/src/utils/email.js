import nodemailer from 'nodemailer';

// Create email transporter
// For development, we'll use Gmail. For production, use a proper email service.
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// For development/testing without real email, use Ethereal (fake SMTP)
async function createTestTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export async function sendPasswordResetEmail(email, resetToken, userName) {
  // Use test transporter if EMAIL_USER is not configured
  const emailTransporter = process.env.EMAIL_USER ? transporter : await createTestTransporter();
  
  const resetLink = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@sweety.app',
    to: email,
    subject: 'Reset Your Sweety Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🩸 Sweety</h1>
            <p>Your Glucose Journal</p>
          </div>
          <div class="content">
            <h2>Hi ${userName || 'there'},</h2>
            <p>We received a request to reset your password for your Sweety account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 5px 0;">
                <li>This link expires in 1 hour</li>
                <li>If you didn't request this, ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${resetLink}</p>
            <p style="margin-top: 30px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sweety - Blood Glucose Tracker</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${userName || 'there'},

We received a request to reset your password for your Sweety account.

Click this link to create a new password: ${resetLink}

⚠️ Security Notice:
- This link expires in 1 hour
- If you didn't request this, ignore this email
- Never share this link with anyone

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Sweety - Blood Glucose Tracker
    `,
  };

  const info = await emailTransporter.sendMail(mailOptions);
  
  // If using test account, log the preview URL
  if (!process.env.EMAIL_USER) {
    console.log('📧 Preview email: ' + nodemailer.getTestMessageUrl(info));
  }
  
  return info;
}
