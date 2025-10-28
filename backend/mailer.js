const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ SMTP connection failed:', error.message);
  } else {
    console.log('✓ SMTP server ready to send emails');
  }
});

// Send email function
async function sendEmail(to, subject, htmlContent) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Generate OTP email template
function generateOTPEmail(otp) {
  return `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Grievance Portal</h1>
                <p>Sri Vasavi Engineering College</p>
            </div>
            <div class='content'>
                <h2>Email Verification</h2>
                <p>Your One-Time Password (OTP) for submitting a grievance is:</p>
                <div class='otp-box'>${otp}</div>
                <p><strong>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</strong></p>
                <p>If you didn't request this OTP, please ignore this email.</p>
                <p>For any assistance, please contact the administration.</p>
            </div>
            <div class='footer'>
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Sri Vasavi Engineering College. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Generate Tracking ID confirmation email template
function generateTrackingEmail(trackingId, name, grievanceType) {
  return `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .tracking-box { background: white; border: 3px solid #84bd00; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .tracking-id { font-size: 28px; font-weight: bold; color: #84bd00; letter-spacing: 2px; margin: 10px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #84bd00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Grievance Submitted Successfully</h1>
                <p>Sri Vasavi Engineering College</p>
            </div>
            <div class='content'>
                <h2>Dear ${name},</h2>
                <p>Your grievance has been successfully submitted and is being reviewed by our team.</p>
                
                <div class='tracking-box'>
                    <p style='margin: 0; color: #666; font-size: 14px;'>Your Tracking ID:</p>
                    <div class='tracking-id'>${trackingId}</div>
                    <p style='margin: 0; color: #666; font-size: 12px;'>Please save this ID for future reference</p>
                </div>

                <div class='info-box'>
                    <p style='margin: 5px 0;'><strong>Grievance Type:</strong> ${grievanceType}</p>
                    <p style='margin: 5px 0;'><strong>Status:</strong> Pending Review</p>
                    <p style='margin: 5px 0;'><strong>Submitted On:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <p><strong>What happens next?</strong></p>
                <ul>
                    <li>Your grievance will be reviewed by the concerned authorities</li>
                    <li>You will receive email updates when the status changes</li>
                    <li>You can track your grievance status anytime using the tracking ID above</li>
                </ul>

                <p style='text-align: center;'>
                    <a href='${process.env.FRONTEND_URL || 'http://localhost:5173'}' class='button'>
                        Track Your Grievance
                    </a>
                </p>

                <p><strong>Important:</strong> Please keep your tracking ID safe. You will need it to check the status of your grievance.</p>
                
                <p>If you have any questions, please contact the administration.</p>
            </div>
            <div class='footer'>
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Sri Vasavi Engineering College. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

module.exports = { sendEmail, generateOTPEmail, generateTrackingEmail };
