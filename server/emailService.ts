import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import path from 'path';

interface SendReferralEmailParams {
  toEmail: string;
  referrerName: string;
  referralUrl: string;
  referralId: string;
}

interface SendWelcomeEmailParams {
  toEmail: string;
  firstName: string;
  welcomeBonus: string;
  dashboardUrl: string;
}

interface SendDepositSuccessEmailParams {
  toEmail: string;
  firstName: string;
  amount: string;
  credits: string;
  transactionId: string;
  newBalance: string;
  walletUrl: string;
  dashboardUrl: string;
}

interface SendInvestmentSuccessEmailParams {
  toEmail: string;
  firstName: string;
  projectTitle: string;
  investmentAmount: string;
  equityPercentage: string;
  transactionId: string;
  investmentDate: string;
  projectUrl: string;
  portfolioUrl: string;
}

interface SendReferralRewardEmailParams {
  toEmail: string;
  firstName: string;
  referredEmail: string;
  rewardAmount: string;
  rewardDate: string;
  newBalance: string;
  totalReferrals: string;
  totalEarned: string;
  walletUrl: string;
  referralUrl: string;
}

interface SendWithdrawalEmailParams {
  toEmail: string;
  firstName: string;
  withdrawalAmount: string;
  processingFee: string;
  netAmount: string;
  bankAccountLast4: string;
  transactionId: string;
  processingDate: string;
  remainingBalance: string;
  processingTime: string;
  walletUrl: string;
  supportUrl: string;
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

// Load and process email template
const loadTemplate = (templateName: string, variables: Record<string, string>): { html: string; text: string } => {
  try {
    const templatePath = path.join(process.cwd(), 'emailtemplates', `${templateName}.html`);
    let html = readFileSync(templatePath, 'utf-8');
    
    // Replace all variables in the template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });
    
    // Generate plain text version (simple HTML strip)
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return { html, text };
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

export const emailService = {
  // Send referral invitation email
  async sendReferralEmail({ toEmail, referrerName, referralUrl, referralId }: SendReferralEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Referral email would be sent to:', toEmail);
      return true;
    }

    try {
      const { html, text } = loadTemplate('referral-invitation', {
        referrerName,
        referralUrl,
        referralId
      });

      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `${referrerName} invited you to join Qipad - Get ₹50 Welcome Credits!`,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      console.log(`Referral invitation sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending referral email via Gmail SMTP:', error);
      return false;
    }
  },

  // Send welcome email for new users
  async sendWelcomeEmail({ toEmail, firstName, welcomeBonus, dashboardUrl }: SendWelcomeEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Welcome email would be sent to:', toEmail);
      return true;
    }

    try {
      const { html, text } = loadTemplate('welcome', {
        firstName,
        welcomeBonus,
        dashboardUrl
      });

      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Welcome to Qipad, ${firstName}! Your journey starts here 🚀`,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email via Gmail SMTP:', error);
      return false;
    }
  },

  // Send deposit success confirmation email
  async sendDepositSuccessEmail({ toEmail, firstName, amount, credits, transactionId, newBalance, walletUrl, dashboardUrl }: SendDepositSuccessEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Deposit success email would be sent to:', toEmail);
      return true;
    }

    try {
      const { html, text } = loadTemplate('deposit-success', {
        firstName,
        amount,
        credits,
        transactionId,
        newBalance,
        walletUrl,
        dashboardUrl
      });

      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Deposit Successful - ₹${amount} added to your wallet!`,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      console.log(`Deposit success email sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending deposit success email via Gmail SMTP:', error);
      return false;
    }
  },

  // Send investment success confirmation email
  async sendInvestmentSuccessEmail({ toEmail, firstName, projectTitle, investmentAmount, equityPercentage, transactionId, investmentDate, projectUrl, portfolioUrl }: SendInvestmentSuccessEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Investment success email would be sent to:', toEmail);
      return true;
    }

    try {
      const { html, text } = loadTemplate('investment-success', {
        firstName,
        projectTitle,
        investmentAmount,
        equityPercentage,
        transactionId,
        investmentDate,
        projectUrl,
        portfolioUrl
      });

      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Investment Successful - You're now part of ${projectTitle}!`,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      console.log(`Investment success email sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending investment success email via Gmail SMTP:', error);
      return false;
    }
  },

  // Send referral reward notification email
  async sendReferralRewardEmail({ toEmail, firstName, referredEmail, rewardAmount, rewardDate, newBalance, totalReferrals, totalEarned, walletUrl, referralUrl }: SendReferralRewardEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Referral reward email would be sent to:', toEmail);
      return true;
    }

    try {
      const { html, text } = loadTemplate('referral-reward', {
        firstName,
        referredEmail,
        rewardAmount,
        rewardDate,
        newBalance,
        totalReferrals,
        totalEarned,
        walletUrl,
        referralUrl
      });

      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Referral Reward Earned - ${rewardAmount} QP added to your wallet!`,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      console.log(`Referral reward email sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending referral reward email via Gmail SMTP:', error);
      return false;
    }
  },

  // Send withdrawal confirmation email
  async sendWithdrawalEmail({ toEmail, firstName, withdrawalAmount, processingFee, netAmount, bankAccountLast4, transactionId, processingDate, remainingBalance, processingTime, walletUrl, supportUrl }: SendWithdrawalEmailParams): Promise<boolean> {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Gmail SMTP not configured - Withdrawal email would be sent to:', toEmail);
      return true;
    }

    try {
      const { html, text } = loadTemplate('withdrawal-confirmation', {
        firstName,
        withdrawalAmount,
        processingFee,
        netAmount,
        bankAccountLast4,
        transactionId,
        processingDate,
        remainingBalance,
        processingTime,
        walletUrl,
        supportUrl
      });

      const mailOptions = {
        from: `"Qipad Platform" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Withdrawal Processed - ₹${netAmount} on the way!`,
        html,
        text
      };

      await transporter.sendMail(mailOptions);
      console.log(`Withdrawal confirmation email sent to ${toEmail} via Gmail SMTP`);
      return true;
    } catch (error) {
      console.error('Error sending withdrawal email via Gmail SMTP:', error);
      return false;
    }
  }
};