import nodemailer from 'nodemailer';

interface SendReferralEmailParams {
  toEmail: string;
  referrerName: string;
  referralUrl: string;
  referralId: string;
}

// Create transporter with Gmail SMTP
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('Gmail SMTP not configured - Email functionality disabled');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

export const emailService = {
  async sendReferralEmail({ toEmail, referrerName, referralUrl, referralId }: SendReferralEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Email would be sent to:', toEmail);
      return true; // Return true for testing when not configured
    }

    try {
      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `${referrerName} invited you to join Qipad - Get ₹50 Welcome Credits!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Join Qipad</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; color: white;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚀 Join Qipad</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">The Energized Startup Space</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <p style="font-size: 18px; margin-bottom: 20px;">Hello! 👋</p>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                <strong>${referrerName}</strong> has invited you to join <strong>Qipad</strong>, the ultimate platform for entrepreneurs and investors to connect, collaborate, and grow their businesses.
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #28a745; font-size: 18px;">🎁 Welcome Bonus</h3>
                <p style="margin: 0; font-size: 16px;">Sign up using this referral link and get <strong>₹50 free credits</strong> to kickstart your journey!</p>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${referralUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: transform 0.2s;">
                  Join Qipad Now
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="margin: 0 0 15px 0; color: #856404;">What can you do on Qipad?</h4>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  <li style="margin-bottom: 8px;">🚀 <strong>Create Innovation Projects</strong> and raise funding</li>
                  <li style="margin-bottom: 8px;">💼 <strong>Post Job Openings</strong> and find talent</li>
                  <li style="margin-bottom: 8px;">🎯 <strong>Connect with Investors</strong> and business partners</li>
                  <li style="margin-bottom: 8px;">👥 <strong>Join Communities</strong> and network with peers</li>
                  <li style="margin-bottom: 8px;">🎪 <strong>Host Events</strong> and workshops</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">Your referral code:</p>
                <code style="background: #e9ecef; padding: 8px 16px; border-radius: 4px; font-size: 16px; font-weight: bold; color: #495057;">${referralId}</code>
              </div>
              
              <p style="font-size: 14px; color: #6c757d; margin-top: 30px; text-align: center;">
                If you have any questions, feel free to reply to this email.<br>
                Welcome to the Qipad community!
              </p>
              
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
              <p style="margin: 0;">© 2025 Qipad. All rights reserved.</p>
            </div>
            
          </body>
          </html>
        `,
        text: `
Hi!

${referrerName} has invited you to join Qipad, the ultimate platform for entrepreneurs and investors.

🎁 WELCOME BONUS: Sign up and get ₹50 free credits!

Join now: ${referralUrl}

Your referral code: ${referralId}

What you can do on Qipad:
- Create Innovation Projects and raise funding
- Post Job Openings and find talent  
- Connect with Investors and business partners
- Join Communities and network with peers
- Host Events and workshops

Welcome to Qipad!
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Referral email sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending referral email via Gmail SMTP:', error);
      return false;
    }
  }
};