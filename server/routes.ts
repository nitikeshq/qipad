import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { communities, jobs, companyFormations } from "@shared/schema";

// Helper function for calculating monthly profits
async function calculateMonthlyProfits(payments: any[], subscriptions: any[]) {
  const monthlyData = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthPayments = payments.filter(p => {
      const payDate = new Date(p.createdAt);
      return payDate >= monthStart && payDate <= monthEnd;
    });
    
    const monthSubs = subscriptions.filter(s => {
      const subDate = new Date(s.createdAt);
      return subDate >= monthStart && subDate <= monthEnd && s.status === 'active';
    });
    
    const revenue = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0) +
                   monthSubs.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue,
      profit: revenue * 0.85
    });
  }
  
  return monthlyData;
}
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertUserSchema, insertProjectSchema, insertDocumentSchema, insertInvestmentSchema, insertCommunitySchema, insertJobSchema, insertJobApplicationSchema, insertBiddingProjectSchema, insertProjectBidSchema, insertCompanySchema, insertPaymentSchema, insertSubscriptionSchema, insertCompanyServiceSchema, insertCompanyProductSchema, insertServiceInquirySchema, insertWalletSchema, insertWalletTransactionSchema, insertReferralSchema } from "@shared/schema";
import { payumoneyService } from "./payumoney";
import { PlatformSettingsService } from "./platformSettingsService";
import { emailService } from "./emailService";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Referral processing function
async function processReferralRegistration(newUser: any, referralCode: string) {
  try {
    console.log(`Processing referral registration for ${newUser.email} with code ${referralCode}`);
    
    // 1. Find pending referral record by code
    const referral = await storage.getReferralByCode(referralCode);
    if (!referral) {
      console.log(`No referral found for code: ${referralCode}`);
      
      // Try to find the referrer by reconstructing the user ID from the referral code
      // Referral code format: QIP{userId.substring(0, 6).toUpperCase()}
      if (referralCode.startsWith('QIP')) {
        const userIdPrefix = referralCode.substring(3).toLowerCase();
        
        // Find users whose ID starts with this prefix
        const allUsers = await storage.getAllUsers();
        const potentialReferrer = allUsers.find(u => u.id.toLowerCase().startsWith(userIdPrefix));
        
        if (potentialReferrer) {
          console.log(`Found potential referrer: ${potentialReferrer.email} for code ${referralCode}`);
          
          // Create a retroactive referral record
          const retroReferral = await storage.createReferral({
            referrerId: potentialReferrer.id,
            referredEmail: newUser.email,
            referralCode: referralCode,
            status: 'pending',
            rewardAmount: '50'
          });
          
          console.log(`Created retroactive referral record: ${retroReferral.id}`);
          
          // Now continue with the found referral
          return processExistingReferral(newUser, retroReferral);
        }
      }
      
      console.log(`Could not find or create referral for code: ${referralCode}`);
      return;
    }
    
    return processExistingReferral(newUser, referral);
  } catch (error) {
    console.error('Error in processReferralRegistration:', error);
    throw error; // Re-throw to be caught by caller
  }
}

// Helper function to process an existing referral record
async function processExistingReferral(newUser: any, referral: any) {
  try {
    
    if (referral.status !== 'pending') {
      console.log(`Referral already processed: ${referral.status}`);
      return;
    }

    // 2. Check if email matches the referred email
    if (referral.referredEmail !== newUser.email) {
      console.log(`Email mismatch: ${referral.referredEmail} vs ${newUser.email}`);
      return;
    }

    // 3. Add bonus credits to new user (₹20 referral bonus)
    await storage.addCredits(
      newUser.id,
      20,
      'Referral bonus - Welcome via referral!',
      'referral_bonus',
      referral.id
    );
    console.log(`Added ₹20 referral bonus to user ${newUser.id}`);

    // 4. Add reward to referrer (₹50)
    await storage.addCredits(
      referral.referrerId,
      50,
      `Referral reward - ${newUser.firstName} joined via your referral`,
      'referral_reward',
      referral.id
    );
    console.log(`Added ₹50 referral reward to referrer ${referral.referrerId}`);

    // 5. Update referral status to completed
    await storage.updateReferral(referral.id, {
      status: 'completed',
      referredUserId: newUser.id,
      creditedAt: new Date()
    });
    console.log(`Updated referral status to completed`);

    // 6. Send reward email to referrer
    const referrer = await storage.getUser(referral.referrerId);
    if (referrer) {
      // Get updated referral stats
      const allReferrals = await storage.getReferralsByUser(referral.referrerId);
      const completedReferrals = allReferrals.filter(r => r.status === 'completed');
      const totalEarned = completedReferrals.reduce((sum, r) => sum + parseFloat(r.rewardAmount || '0'), 0);
      
      // Get referrer's current wallet balance
      const wallet = await storage.getWalletByUserId(referral.referrerId);
      
      await emailService.sendReferralRewardEmail({
        toEmail: referrer.email,
        firstName: referrer.firstName,
        referredEmail: newUser.email,
        rewardAmount: '50',
        rewardDate: new Date().toLocaleDateString(),
        newBalance: wallet?.balance?.toString() || '0',
        totalReferrals: completedReferrals.length.toString(),
        totalEarned: totalEarned.toString(),
        walletUrl: `${process.env.BASE_URL || 'https://qipad.co'}/wallet`,
        referralUrl: `${process.env.BASE_URL || 'https://qipad.co'}/auth?ref=${referral.referralCode}`
      });
      console.log(`Sent referral reward email to ${referrer.email}`);
    }
    
    console.log(`Successfully processed referral for ${newUser.email}`);
  } catch (error) {
    console.error('Error in processExistingReferral:', error);
    throw error; // Re-throw to be caught by caller
  }
}

// File upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const userId = req.user?.userId || 'anonymous';
      const uploadPath = `uploads/${userId}`;
      // Create directory if it doesn't exist
      import('fs').then(fs => {
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
      });
      cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
      // Create unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = file.originalname.split('.').pop();
      cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
    }
  }
});

// Middleware for JWT authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware for admin authentication
const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Admin access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired admin token' });
    }
    
    if (!user.isAdmin || user.userId !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  // Admin login route
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'qipad2024!') {
      const token = jwt.sign(
        { userId: 'admin', isAdmin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({ 
        message: "Admin login successful",
        token,
        user: { id: 'admin', username: 'admin', isAdmin: true }
      });
    }
    
    return res.status(401).json({ message: "Invalid admin credentials" });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const { referralCode } = req.body; // Extract referral code from request
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password if provided
      if (userData.passwordHash) {
        userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      // Give 10 credits joining bonus
      try {
        await storage.addCredits(
          user.id,
          10,
          'Joining bonus - Welcome to Qipad!',
          'joining_bonus',
          `registration-${user.id}`
        );
      } catch (creditError) {
        console.error('Failed to add joining bonus:', creditError);
        // Don't fail registration if credit bonus fails
      }

      // Process referral bonus if referral code was used
      if (req.body.referralCode) {
        try {
          const referrer = await storage.getUserByReferralCode(req.body.referralCode);
          if (referrer) {
            // Give 50 credits bonus to referrer
            const bonusResult = await storage.addCredits(
              referrer.id,
              50,
              `Referral bonus - ${user.firstName} ${user.lastName} joined using your referral code`,
              'referral_bonus',
              user.id
            );

            // Create referral record
            await storage.createReferral({
              referrerId: referrer.id,
              referredUserId: user.id,
              referredEmail: user.email,
              referralCode: req.body.referralCode,
              rewardAmount: "50",
              status: "credited"
            });

            // Send referral reward email to referrer
            try {
              await emailService.sendReferralRewardEmail({
                toEmail: referrer.email,
                firstName: referrer.firstName,
                referredEmail: user.email,
                rewardAmount: '50',
                rewardDate: new Date().toLocaleDateString(),
                newBalance: bonusResult.newBalance.toString(),
                totalReferrals: '1',
                totalEarned: bonusResult.newBalance.toString(),
                walletUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/wallet`,
                referralUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/referrals`
              });
            } catch (emailError) {
              console.error('Failed to send referral reward email:', emailError);
            }
          }
        } catch (referralError) {
          console.error('Failed to process referral bonus:', referralError);
          // Don't fail registration if referral processing fails
        }
      }

      // Send welcome email
      try {
        const welcomeBonus = referralCode ? '30' : '10'; // Show total bonus if referred
        await emailService.sendWelcomeEmail({
          toEmail: user.email,
          firstName: user.firstName,
          welcomeBonus,
          dashboardUrl: `${process.env.BASE_URL || 'https://qipad.co'}/dashboard`
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      res.json({ user: { ...user, passwordHash: undefined }, token });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid user data", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: { ...user, passwordHash: undefined }, token });
    } catch (error: any) {
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { googleId, email, firstName, lastName, userType } = req.body;
      
      let user = await storage.getUserByGoogleId(googleId);
      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          // Link Google account to existing user
          user = await storage.updateUser(user.id, { googleId });
        } else {
          // Create new user
          user = await storage.createUser({
            googleId,
            email,
            firstName,
            lastName,
            userType,
          });

          // Give 10 credits joining bonus
          try {
            await storage.addCredits(
              user.id,
              10,
              'Joining bonus - Welcome to Qipad!',
              'joining_bonus',
              user.id
            );
          } catch (creditError) {
            console.error('Failed to add joining bonus:', creditError);
            // Don't fail registration if credit bonus fails
          }

          // Send welcome email for new Google users
          try {
            await emailService.sendWelcomeEmail({
              toEmail: user.email,
              firstName: user.firstName,
              welcomeBonus: '10',
              dashboardUrl: `${process.env.BASE_URL || 'https://qipad.co'}/dashboard`
            });
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail registration if email fails
          }
        }
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: { ...user, passwordHash: undefined }, token });
    } catch (error: any) {
      res.status(500).json({ message: "Google authentication failed", error: error.message });
    }
  });

  // User routes
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, passwordHash: undefined });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user", error: error.message });
    }
  });

  // Get user by referral code for referral preview
  app.get("/api/users/referrer/:code", async (req, res) => {
    try {
      const referrer = await storage.getUserByReferralCode(req.params.code);
      if (!referrer) {
        return res.status(404).json({ message: "Referral code not found" });
      }
      // Only return safe user info for preview
      res.json({
        firstName: referrer.firstName,
        lastName: referrer.lastName,
        userType: referrer.userType
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch referrer", error: error.message });
    }
  });

  // Platform Settings Routes
  app.get("/api/admin/platform-settings", authenticateToken, async (req: any, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch platform settings", error: error.message });
    }
  });

  app.post("/api/admin/platform-settings", authenticateToken, async (req: any, res) => {
    try {
      const { key, value, description, category } = req.body;
      const setting = await storage.setPlatformSetting(key, value, description, category, req.user.userId);
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create platform setting", error: error.message });
    }
  });

  app.patch("/api/admin/platform-settings/:key", authenticateToken, async (req: any, res) => {
    try {
      const { value } = req.body;
      const setting = await storage.updatePlatformSetting(req.params.key, value, req.user.userId);
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update platform setting", error: error.message });
    }
  });

  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, passwordHash: undefined });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user", error: error.message });
    }
  });

  app.get("/api/users/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.user.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user stats", error: error.message });
    }
  });

  app.get("/api/users/all", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, passwordHash: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get users", error: error.message });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getApprovedProjects();
      // Add owner information for each project
      const projectsWithOwners = await Promise.all(
        projects.map(async (project) => {
          const owner = await storage.getUser(project.userId);
          return {
            ...project,
            owner: owner ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              profileImage: owner.profileImage
            } : null
          };
        })
      );
      res.json(projectsWithOwners);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get projects", error: error.message });
    }
  });

  app.get("/api/projects/my", authenticateToken, async (req: any, res) => {
    try {
      const projects = await storage.getProjectsByUser(req.user.userId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user projects", error: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get project owner information for investor contact
      const projectOwner = await storage.getUser(project.userId);
      const projectWithOwner = {
        ...project,
        owner: projectOwner ? {
          id: projectOwner.id,
          firstName: projectOwner.firstName,
          lastName: projectOwner.lastName,
          email: projectOwner.email,
          phone: projectOwner.phone,
          userType: projectOwner.userType
        } : null
      };

      res.json(projectWithOwner);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get project", error: error.message });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: any, res) => {
    try {
      // Check if user is KYC verified
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.isKycComplete) {
        return res.status(403).json({ 
          message: "KYC verification required", 
          detail: "Only KYC-verified members can create projects" 
        });
      }

      const projectData = insertProjectSchema.parse({ ...req.body, userId: req.user.userId });
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid project data", error: error.message });
    }
  });

  app.patch("/api/projects/:id", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to update this project" });
      }

      const updatedProject = await storage.updateProject(req.params.id, req.body);
      res.json(updatedProject);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update project", error: error.message });
    }
  });

  app.put("/api/projects/:id", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to update this project" });
      }

      const updatedProject = await storage.updateProject(req.params.id, req.body);
      res.json(updatedProject);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update project", error: error.message });
    }
  });

  app.delete("/api/projects/:id", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
      }

      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete project", error: error.message });
    }
  });

  // Document upload routes
  app.post("/api/documents", authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        bodyKeys: Object.keys(req.body),
        documentType: req.body.documentType,
        userId: req.user?.userId
      });
      
      if (!req.file) {
        console.log('No file in request:', req.file);
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = insertDocumentSchema.parse({
        userId: req.user.userId,
        projectId: req.body.projectId,
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error: any) {
      console.error('Document upload error:', error);
      res.status(400).json({ message: "Failed to upload document", error: error.message });
    }
  });

  // Get user's documents (for KYC page)
  app.get("/api/documents", authenticateToken, async (req: any, res) => {
    try {
      const documents = await storage.getDocumentsByUser(req.user.userId);
      res.json(documents);
    } catch (error: any) {
      console.error("Get user documents error:", error);
      res.status(500).json({ message: "Failed to get documents", error: error.message });
    }
  });

  app.get("/api/documents/project/:projectId", authenticateToken, async (req: any, res) => {
    try {
      const documents = await storage.getDocumentsByProject(req.params.projectId);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get documents", error: error.message });
    }
  });

  // Document download endpoint
  app.get("/api/documents/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user owns the document
      if (document.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const path = require('path');
      const fs = require('fs');
      
      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on server" });
      }

      res.download(document.filePath, document.fileName);
    } catch (error: any) {
      console.error("Document download error:", error);
      res.status(500).json({ message: "Failed to download document", error: error.message });
    }
  });

  // INVESTOR CONNECTION ROUTES
  app.post("/api/investors/connect", authenticateToken, async (req: any, res) => {
    try {
      const { investorId } = req.body;
      if (!investorId) {
        return res.status(400).json({ message: "Investor ID is required" });
      }
      
      const userId = req.user.userId;
      
      // Check if connection already exists
      const existingConnection = await storage.getConnectionBetweenUsers(userId, investorId);
      if (existingConnection) {
        return res.status(400).json({ 
          message: "Connection already exists", 
          status: existingConnection.status 
        });
      }
      
      // Create connection request
      const connection = await storage.createConnection(userId, investorId);
      
      res.json({ 
        message: "Connection request sent successfully",
        connection,
        status: "pending"
      });
    } catch (error: any) {
      console.error("Connect investor error:", error);
      res.status(500).json({ message: "Failed to send connection request", error: error.message });
    }
  });

  // Get user's connections
  app.get("/api/connections/my", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const connections = await storage.getConnections(userId);
      res.json(connections);
    } catch (error: any) {
      console.error("Get connections error:", error);
      res.status(500).json({ message: "Failed to get connections", error: error.message });
    }
  });

  // Accept/reject connection request
  app.put("/api/connections/:connectionId", authenticateToken, async (req: any, res) => {
    try {
      const { connectionId } = req.params;
      const { status } = req.body; // 'accepted' or 'rejected'
      
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
      }
      
      const connection = await storage.updateConnectionStatus(connectionId, status);
      res.json(connection);
    } catch (error: any) {
      console.error("Update connection error:", error);
      res.status(500).json({ message: "Failed to update connection", error: error.message });
    }
  });

  // Investment payment route (equity-based)
  app.post("/api/payments/invest", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, amount, expectedStakes, message, phone } = req.body;
      const userId = req.user.userId;
      const user = await storage.getUser(userId);

      const txnId = payumoneyService.generateTxnId();
      
      // Create payment record for investment
      const payment = await storage.createPayment({
        userId,
        projectId,
        amount,
        paymentType: 'investment' as const,
        status: 'pending',
        description: 'Project investment',
        metadata: JSON.stringify({ txnId, expectedStakes, message, phone }),
      });

      const paymentData = {
        amount,
        productInfo: 'Project Investment',
        firstName: user?.firstName || 'User',
        email: user?.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId,
        paymentType: 'investment' as const,
        metadata: { paymentId: payment.id, projectId, expectedStakes, message, phone },
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          txnId: paymentResponse.txnId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error creating investment payment:', error);
      res.status(500).json({ message: 'Failed to create investment payment' });
    }
  });

  // Legacy investment route (now redirects to payment)
  app.post("/api/investments", authenticateToken, async (req: any, res) => {
    try {
      // Redirect to payment flow for investments
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/payments/invest`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization 
        },
        body: JSON.stringify(req.body)
      });
      const investmentResponse = await response.json();
      res.json(investmentResponse);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create investment", error: error.message });
    }
  });

  app.get("/api/investments/my", authenticateToken, async (req: any, res) => {
    try {
      const investments = await storage.getInvestmentsByUser(req.user.userId);
      
      // Include project details for each investment
      const investmentsWithProjects = await Promise.all(
        investments.map(async (investment) => {
          const project = await storage.getProject(investment.projectId);
          return {
            ...investment,
            project: project ? {
              id: project.id,
              title: project.title,
              description: project.description,
              category: project.category,
              status: project.status,
              fundingGoal: project.fundingGoal,
              currentFunding: project.currentFunding
            } : null
          };
        })
      );
      
      res.json(investmentsWithProjects);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get investments", error: error.message });
    }
  });

  app.get("/api/investments/my/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getUserInvestmentStats(req.user.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get investment stats", error: error.message });
    }
  });

  app.get("/api/investments/project/:projectId", authenticateToken, async (req: any, res) => {
    try {
      const investments = await storage.getInvestmentsByProject(req.params.projectId);
      
      // Include investor details for project owners to contact
      const investmentsWithInvestors = await Promise.all(
        investments.map(async (investment) => {
          const investor = await storage.getUser(investment.investorId);
          return {
            ...investment,
            investor: investor ? {
              id: investor.id,
              firstName: investor.firstName,
              lastName: investor.lastName,
              email: investment.investorEmail,
              phone: investment.investorContact,
              userType: investor.userType
            } : null
          };
        })
      );

      res.json(investmentsWithInvestors);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get project investments", error: error.message });
    }
  });

  // Support payment route (donation-based, no equity)
  // DEPRECATED: Old mock route - DO NOT USE
  // This route is kept for backward compatibility but should not be used
  // Use /api/payments/support instead for real PayUMoney integration

  // PayUMoney mock integration
  app.post("/api/payment/initiate", authenticateToken, async (req: any, res) => {
    try {
      const { amount, investmentId } = req.body;
      
      // Mock PayUMoney response
      const paymentData = {
        paymentId: `PAYU_${Date.now()}`,
        amount,
        status: 'initiated',
        redirectUrl: `https://test.payu.in/checkout?paymentId=PAYU_${Date.now()}`,
      };

      res.json(paymentData);
    } catch (error: any) {
      res.status(500).json({ message: "Payment initiation failed", error: error.message });
    }
  });

  app.post("/api/payment/verify", authenticateToken, async (req: any, res) => {
    try {
      const { paymentId, investmentId } = req.body;
      
      // Mock payment verification - in real implementation, verify with PayUMoney
      const isValid = paymentId.startsWith('PAYU_');
      
      if (isValid) {
        await storage.updateInvestment(investmentId, { 
          status: 'completed'
        });
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        await storage.updateInvestment(investmentId, { status: 'rejected' });
        res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Payment verification failed", error: error.message });
    }
  });

  // Community routes
  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get communities", error: error.message });
    }
  });

  app.get("/api/user/communities", authenticateToken, async (req: any, res) => {
    try {
      const memberships = await storage.getUserCommunityMemberships(req.user.userId);
      res.json(memberships);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user communities", error: error.message });
    }
  });

  app.post("/api/communities", authenticateToken, async (req: any, res) => {
    try {
      // Check if user is KYC verified
      const user = await storage.getUser(req.user.userId);
      if (!user?.isKycComplete) {
        return res.status(403).json({ 
          message: "KYC verification required", 
          detail: "Only KYC-verified members can create communities" 
        });
      }

      const communityData = insertCommunitySchema.parse({ 
        ...req.body, 
        creatorId: req.user.userId 
      });
      const community = await storage.createCommunity(communityData);
      
      // Auto-join creator to community
      await storage.joinCommunity(community.id, req.user.userId);
      
      // Set creator as admin
      await storage.updateMemberRole(community.id, req.user.userId, "creator");
      
      res.json(community);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create community", error: error.message });
    }
  });

  app.get("/api/communities/:id", async (req, res) => {
    try {
      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get community", error: error.message });
    }
  });

  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const members = await storage.getCommunityMembers(req.params.id);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get community members", error: error.message });
    }
  });

  app.get("/api/communities/:id/posts", async (req, res) => {
    try {
      const posts = await storage.getCommunityPosts(req.params.id);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get community posts", error: error.message });
    }
  });

  app.post("/api/communities/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const isMember = await storage.isUserMember(req.params.id, req.user.userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member of this community" });
      }
      
      await storage.joinCommunity(req.params.id, req.user.userId);
      res.json({ message: "Joined community successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to join community", error: error.message });
    }
  });

  app.post("/api/communities/:id/leave", authenticateToken, async (req: any, res) => {
    try {
      await storage.leaveCommunity(req.params.id, req.user.userId);
      res.json({ message: "Left community successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to leave community", error: error.message });
    }
  });

  app.post("/api/communities/:id/posts", authenticateToken, async (req: any, res) => {
    try {
      const isMember = await storage.isUserMember(req.params.id, req.user.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Must be a community member to post" });
      }

      const post = await storage.createCommunityPost({
        communityId: req.params.id,
        authorId: req.user.userId,
        content: req.body.content,
        images: req.body.images || [],
        videos: req.body.videos || []
      });
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create post", error: error.message });
    }
  });

  app.put("/api/communities/:id/members/:userId/role", authenticateToken, async (req: any, res) => {
    try {
      // Check if current user is admin of the community
      const members = await storage.getCommunityMembers(req.params.id);
      const currentUserMember = members.find(m => m.userId === req.user.userId);
      
      if (!currentUserMember || (currentUserMember.role !== "admin" && currentUserMember.role !== "creator")) {
        return res.status(403).json({ message: "Only admins can change member roles" });
      }

      await storage.updateMemberRole(req.params.id, req.params.userId, req.body.role);
      res.json({ message: "Member role updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update member role", error: error.message });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get jobs", error: error.message });
    }
  });

  app.post("/api/jobs", authenticateToken, async (req: any, res) => {
    try {
      // Check if user is KYC verified
      const user = await storage.getUser(req.user.userId);
      if (!user?.isKycComplete) {
        return res.status(403).json({ 
          message: "KYC verification required", 
          detail: "Only KYC-verified members can create jobs" 
        });
      }

      const jobData = insertJobSchema.parse({ ...req.body, userId: req.user.userId });
      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create job", error: error.message });
    }
  });

  app.post("/api/jobs/:id/apply", async (req, res) => {
    try {
      const applicationData = insertJobApplicationSchema.parse({ 
        ...req.body, 
        jobId: req.params.id 
      });
      const application = await storage.createJobApplication(applicationData);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to submit application", error: error.message });
    }
  });

  app.get("/api/jobs/:id/applications", authenticateToken, async (req: any, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job || job.userId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to view applications" });
      }
      
      const applications = await storage.getJobApplications(req.params.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get applications", error: error.message });
    }
  });

  // Apply to a job
  app.post("/api/job-applications", authenticateToken, async (req: any, res) => {
    try {
      const { jobId, coverLetter, resume } = req.body;
      
      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Check if user already applied
      const existingApplication = await storage.getUserJobApplication(req.user.userId, jobId);
      if (existingApplication) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }

      const application = await storage.createJobApplication({
        jobId,
        userId: req.user.userId,
        coverLetter,
        resume,
        status: "pending",
        appliedAt: new Date(),
      });

      res.json({ message: "Application submitted successfully", application });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to submit application", error: error.message });
    }
  });

  // Save a job
  app.post("/api/saved-jobs", authenticateToken, async (req: any, res) => {
    try {
      const { jobId } = req.body;
      
      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Check if job is already saved
      const existingSavedJob = await storage.getUserSavedJob(req.user.userId, jobId);
      if (existingSavedJob) {
        return res.status(400).json({ message: "Job is already saved" });
      }

      const savedJob = await storage.createSavedJob({
        jobId,
        userId: req.user.userId,
        savedAt: new Date(),
      });

      res.json({ message: "Job saved successfully", savedJob });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to save job", error: error.message });
    }
  });

  // Connection routes
  app.get("/api/connections", authenticateToken, async (req: any, res) => {
    try {
      const connections = await storage.getUserConnections(req.user.userId);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get connections", error: error.message });
    }
  });

  app.post("/api/connections", authenticateToken, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const connection = await storage.createConnection(req.user.userId, userId);
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create connection", error: error.message });
    }
  });

  // Image upload for posts
  app.post('/api/upload/image', upload.single('image'), (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Like a community post
  app.post('/api/community-posts/:id/like', authenticateToken, async (req: any, res) => {
    try {
      const result = await storage.togglePostLike(req.params.id, req.user.userId);
      res.json({ message: result.liked ? 'Post liked' : 'Post unliked', liked: result.liked });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to like post', error: error.message });
    }
  });

  // Comment on a community post
  app.post('/api/community-posts/:id/comments', authenticateToken, async (req: any, res) => {
    try {
      const comment = await storage.createPostComment({
        postId: req.params.id,
        userId: req.user.userId,
        content: req.body.content
      });
      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to add comment', error: error.message });
    }
  });

  // Company Formation routes for users
  app.get("/api/company-formations/my", authenticateToken, async (req: any, res) => {
    try {
      const formation = await storage.getCompanyFormationByUser(req.user.userId);
      res.json(formation);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company formation", error: error.message });
    }
  });

  app.post("/api/company-formations", authenticateToken, async (req: any, res) => {
    try {
      const formationData = { ...req.body, userId: req.user.userId };
      const formation = await storage.createCompanyFormation(formationData);
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create company formation", error: error.message });
    }
  });

  app.put("/api/company-formations/:id", authenticateToken, async (req: any, res) => {
    try {
      const formation = await storage.updateCompanyFormation(req.params.id, req.body);
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update company formation", error: error.message });
    }
  });

  // Public tender routes
  app.get("/api/tenders", async (req, res) => {
    try {
      const tenders = await storage.getAllTenders();
      res.json(tenders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get tenders", error: error.message });
    }
  });

  app.get("/api/tenders/eligible", authenticateToken, async (req: any, res) => {
    try {
      // In production, this would check user KYC and business profile
      const allTenders = await storage.getAllTenders();
      const eligibleTenders = allTenders.filter((tender: any) => tender.status === 'open');
      res.json(eligibleTenders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get eligible tenders", error: error.message });
    }
  });
  
  // ADMIN ROUTES

  // Admin route for getting all users with documents
  // Users CRUD
  app.get("/api/admin/users", authenticateAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const documents = await storage.getAllDocuments();
      
      const usersWithKyc = users.map(user => {
        const userDocs = documents.filter(doc => doc.userId === user.id);
        const kycStatus = userDocs.length > 0 ? 
          (userDocs.every(doc => doc.status === 'approved') ? 'verified' : 
           userDocs.some(doc => doc.status === 'rejected') ? 'rejected' : 'pending') : 'not_submitted';
        
        return { 
          ...user, 
          passwordHash: undefined,
          kycStatus,
          documents: userDocs
        };
      });
      
      res.json(usersWithKyc);
    } catch (error: any) {
      console.error("Admin users route error:", error);
      res.status(500).json({ message: "Failed to get users", error: error.message });
    }
  });

  app.put("/api/admin/users/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      delete updateData.passwordHash; // Don't allow password hash updates through admin
      
      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(400).json({ message: "Failed to update user", error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(400).json({ message: "Failed to delete user", error: error.message });
    }
  });

  // Admin route for suspending/activating users
  app.patch("/api/admin/users/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body; // 'active' or 'suspended'
      const user = await storage.updateUser(req.params.id, { status });
      res.json({ message: "User status updated successfully", user: { ...user, passwordHash: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update user status", error: error.message });
    }
  });

  // Admin route for KYC verification with user sync
  app.patch("/api/admin/documents/:id/verify", authenticateAdmin, async (req, res) => {
    try {
      const { status, feedback } = req.body; // 'approved' or 'rejected'
      
      // Update the document
      const document = await storage.updateDocument(req.params.id, { 
        status, 
        feedback,
        isVerified: status === 'approved' 
      });
      
      // Get user's documents to check overall verification status
      const userDocs = await storage.getDocumentsByUser(document.userId);
      const allApproved = userDocs.length > 0 && userDocs.every(doc => doc.status === 'approved');
      const hasRejected = userDocs.some(doc => doc.status === 'rejected');
      
      // Update user verification status based on their documents
      await storage.updateUser(document.userId, { 
        isVerified: allApproved,
        isKycComplete: userDocs.length > 0 && !hasRejected
      });
      
      res.json({ 
        message: "Document verification updated and user status synchronized", 
        document,
        userVerificationStatus: {
          isVerified: allApproved,
          isKycComplete: userDocs.length > 0 && !hasRejected
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update document status", error: error.message });
    }
  });

  // Admin KYC approval endpoint
  app.put("/api/admin/users/:userId/kyc", authenticateAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { kycStatus } = req.body;
      
      // Update user's KYC status
      const user = await storage.updateUser(userId, { 
        kycStatus: kycStatus,
        isKycComplete: kycStatus === 'verified' 
      });
      
      // Update all user documents to approved if KYC is verified
      if (kycStatus === 'verified') {
        const userDocs = await storage.getDocumentsByUser(userId);
        for (const doc of userDocs) {
          await storage.updateDocument(doc.id, { 
            status: 'approved',
            isVerified: true 
          });
        }
        
        // Give 20 credits verification bonus
        try {
          await storage.addCredits(
            userId,
            20,
            'Account verification bonus - Thank you for completing KYC!',
            'verification_bonus',
            userId
          );
          console.log(`Added 20 verification bonus credits to user ${userId}`);
        } catch (creditError) {
          console.error('Failed to add verification bonus:', creditError);
          // Don't fail the verification if credit bonus fails
        }
      }
      
      res.json({ message: "KYC status updated successfully", user });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update KYC status", error: error.message });
    }
  });

  // Projects CRUD
  app.get("/api/admin/projects", authenticateAdmin, async (req, res) => {
    try {
      const projects = await storage.getAllProjectsWithOwners();
      res.json(projects);
    } catch (error: any) {
      console.error("Admin projects route error:", error);
      res.status(500).json({ message: "Failed to get projects", error: error.message });
    }
  });

  app.put("/api/admin/projects/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedProject = await storage.updateProject(id, updateData);
      res.json(updatedProject);
    } catch (error: any) {
      console.error("Update project error:", error);
      res.status(400).json({ message: "Failed to update project", error: error.message });
    }
  });

  app.delete("/api/admin/projects/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error: any) {
      console.error("Delete project error:", error);
      res.status(400).json({ message: "Failed to delete project", error: error.message });
    }
  });

  // Investments CRUD
  app.get("/api/admin/investments", authenticateAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const allInvestments = await storage.getAllInvestmentsWithDetails();
      const total = allInvestments.length;
      const paginatedInvestments = allInvestments
        .slice(offset, offset + limit)
        .map(inv => ({
          ...inv,
          stakes: inv.expectedStakes ? `${inv.expectedStakes}%` : 'N/A',
          formattedAmount: `₹${parseFloat(inv.amount).toLocaleString('en-IN')}`
        }));

      res.json({
        investments: paginatedInvestments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get investments", error: error.message });
    }
  });

  app.put("/api/admin/investments/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedInvestment = await storage.updateInvestment(id, updateData);
      res.json(updatedInvestment);
    } catch (error: any) {
      console.error("Update investment error:", error);
      res.status(400).json({ message: "Failed to update investment", error: error.message });
    }
  });

  app.delete("/api/admin/investments/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvestment(id);
      res.json({ message: "Investment deleted successfully" });
    } catch (error: any) {
      console.error("Delete investment error:", error);
      res.status(400).json({ message: "Failed to delete investment", error: error.message });
    }
  });

  app.patch("/api/admin/projects/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const project = await storage.updateProject(req.params.id, { status });
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update project status", error: error.message });
    }
  });

  // TENDER MANAGEMENT ROUTES
  app.get("/api/admin/tenders", authenticateAdmin, async (req, res) => {
    try {
      const tenders = await storage.getAllTenders();
      res.json(tenders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get tenders", error: error.message });
    }
  });

  app.post("/api/admin/tenders", authenticateAdmin, async (req, res) => {
    try {
      const tender = await storage.createTender(req.body);
      res.json(tender);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create tender", error: error.message });
    }
  });

  app.put("/api/admin/tenders/:id", authenticateAdmin, async (req, res) => {
    try {
      const tender = await storage.updateTender(req.params.id, req.body);
      res.json(tender);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update tender", error: error.message });
    }
  });

  app.delete("/api/admin/tenders/:id", authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteTender(req.params.id);
      res.json({ message: "Tender deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete tender", error: error.message });
    }
  });

  // COMPANY FORMATION MANAGEMENT ROUTES
  app.get("/api/admin/company-formations", authenticateAdmin, async (req, res) => {
    try {
      const formations = await storage.getAllCompanyFormations();
      const formationsWithUsers = await Promise.all(
        formations.map(async (formation) => {
          const user = await storage.getUser(formation.userId);
          return {
            ...formation,
            user: user ? { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName, 
              email: user.email 
            } : null
          };
        })
      );
      res.json(formationsWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company formations", error: error.message });
    }
  });

  app.put("/api/admin/company-formations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Handle date conversion for step update
      if (updateData.steps && Array.isArray(updateData.steps)) {
        updateData.steps = updateData.steps.map((step: any) => ({
          ...step,
          completedAt: step.completedAt && step.completedAt !== '' ? new Date(step.completedAt) : null
        }));
      }
      
      // Handle timestamp fields that might be strings
      const timestampFields = ['incorporationDate', 'gstRegistrationDate', 'bankAccountOpenDate', 'createdAt', 'updatedAt'];
      timestampFields.forEach(field => {
        if (updateData[field] && typeof updateData[field] === 'string' && updateData[field] !== '') {
          try {
            updateData[field] = new Date(updateData[field]);
          } catch (e) {
            // If conversion fails, set to null
            updateData[field] = null;
          }
        } else if (updateData[field] === '' || updateData[field] === null) {
          updateData[field] = null;
        }
      });
      
      const updatedFormation = await storage.updateCompanyFormation(id, updateData);
      res.json(updatedFormation);
    } catch (error: any) {
      console.error("Update company formation error:", error);
      res.status(400).json({ message: "Failed to update company formation", error: error.message });
    }
  });

  app.delete("/api/admin/company-formations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCompanyFormation(id);
      res.json({ message: "Company formation deleted successfully" });
    } catch (error: any) {
      console.error("Delete company formation error:", error);
      res.status(400).json({ message: "Failed to delete company formation", error: error.message });
    }
  });

  // Admin - Companies Management
  app.get("/api/admin/companies", authenticateAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error: any) {
      console.error("Admin companies route error:", error);
      res.status(500).json({ message: "Failed to get companies", error: error.message });
    }
  });

  // Admin - Update Company Status
  app.put("/api/admin/companies/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const company = await storage.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const updatedCompany = await storage.updateCompany(id, { status });
      if (!updatedCompany) {
        return res.status(500).json({ message: "Failed to update company status" });
      }

      res.json({ message: "Company status updated successfully", company: updatedCompany });
    } catch (error: any) {
      console.error("Update company status error:", error);
      res.status(500).json({ message: "Failed to update company status", error: error.message });
    }
  });

  // Admin - Services Management  
  app.get("/api/admin/services", authenticateAdmin, async (req, res) => {
    try {
      const services = await storage.getAllCompanyServices();
      res.json(services);
    } catch (error: any) {
      console.error("Admin services route error:", error);
      res.status(500).json({ message: "Failed to get services", error: error.message });
    }
  });

  // Admin - Events Management
  app.get("/api/admin/events", authenticateAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error: any) {
      console.error("Admin events route error:", error);
      res.status(500).json({ message: "Failed to get events", error: error.message });
    }
  });

  // Admin - Profit Analytics
  app.get("/api/admin/analytics/profit", authenticateAdmin, async (req, res) => {
    try {
      // Calculate profit from various sources
      const payments = await storage.getAllPayments();
      const subscriptions = await storage.getAllSubscriptions();
      const events = await storage.getAllEvents();
      
      // Calculate profits
      const eventRevenue = payments
        .filter(p => p.type === 'event_fee')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const subscriptionRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + parseFloat(s.amount), 0);
      
      const serviceInquiryFees = payments
        .filter(p => p.type === 'service_inquiry')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const companyFormationFees = payments
        .filter(p => p.type === 'company_formation')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const totalRevenue = eventRevenue + subscriptionRevenue + serviceInquiryFees + companyFormationFees;
      const totalProfit = totalRevenue * 0.85; // Assuming 15% operational costs
      
      res.json({
        totalRevenue,
        totalProfit,
        breakdown: {
          eventRevenue,
          subscriptionRevenue, 
          serviceInquiryFees,
          companyFormationFees
        },
        monthlyData: await calculateMonthlyProfits(payments, subscriptions)
      });
    } catch (error: any) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics", error: error.message });
    }
  });

  // Wallet Deposits Analytics
  app.get("/api/admin/analytics/wallet-deposits", authenticateAdmin, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      const walletDeposits = payments.filter(p => p.paymentType === 'wallet_deposit');
      
      const totalDeposits = walletDeposits.length;
      const totalDepositAmount = walletDeposits.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const uniqueDepositors = new Set(walletDeposits.map(p => p.userId));
      
      res.json({
        totalDeposits,
        totalDepositAmount,
        totalDepositors: uniqueDepositors.size,
        averageDepositAmount: totalDeposits > 0 ? totalDepositAmount / totalDeposits : 0
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get wallet deposit analytics", error: error.message });
    }
  });

  // Referrals Analytics
  app.get("/api/admin/analytics/referrals", authenticateAdmin, async (req, res) => {
    try {
      const referrals = await storage.getAllReferrals();
      const totalReferrals = referrals.length;
      const completedReferrals = referrals.filter(r => r.status === 'credited').length;
      const totalRewards = referrals.filter(r => r.status === 'credited')
        .reduce((sum, r) => sum + parseFloat(r.rewardAmount || '0'), 0);
      
      res.json({
        totalReferrals,
        completedReferrals,
        conversionRate: totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0,
        totalRewards
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get referral analytics", error: error.message });
    }
  });

  // Credit Configuration Management  
  app.get("/api/admin/credit-configs", authenticateAdmin, async (req, res) => {
    try {
      const configs = await storage.getAllCreditConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get credit configs", error: error.message });
    }
  });

  app.post("/api/admin/credit-configs", authenticateAdmin, async (req, res) => {
    try {
      const config = await storage.createCreditConfig(req.body);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create credit config", error: error.message });
    }
  });

  app.put("/api/admin/credit-configs/:id", authenticateAdmin, async (req, res) => {
    try {
      const config = await storage.updateCreditConfig(req.params.id, req.body);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update credit config", error: error.message });
    }
  });

  app.post("/api/admin/company-formations", async (req, res) => {
    try {
      const formation = await storage.createCompanyFormation(req.body);
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create company formation", error: error.message });
    }
  });



  app.patch("/api/admin/company-formations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const formation = await storage.updateCompanyFormation(req.params.id, { status });
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update company formation status", error: error.message });
    }
  });

  app.delete("/api/admin/company-formations/:id", async (req, res) => {
    try {
      await db.delete(companyFormations).where(eq(companyFormations.id, req.params.id));
      res.json({ message: "Company formation deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete company formation", error: error.message });
    }
  });

  // Admin - Communities Management
  app.get("/api/admin/communities", authenticateAdmin, async (req, res) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get communities", error: error.message });
    }
  });

  // Admin delete/deactivate community
  app.delete("/api/admin/communities/:id", async (req, res) => {
    try {
      await db.delete(communities).where(eq(communities.id, req.params.id));
      res.json({ message: "Community deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete community", error: error.message });
    }
  });

  app.patch("/api/admin/communities/:id/deactivate", async (req, res) => {
    try {
      await db.update(communities)
        .set({ isActive: false })
        .where(eq(communities.id, req.params.id));
      res.json({ message: "Community deactivated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to deactivate community", error: error.message });
    }
  });

  // Admin - Jobs Management
  app.get("/api/admin/jobs", authenticateAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get jobs", error: error.message });
    }
  });

  // Admin delete/deactivate job
  app.delete("/api/admin/jobs/:id", async (req, res) => {
    try {
      await db.delete(jobs).where(eq(jobs.id, req.params.id));
      res.json({ message: "Job deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete job", error: error.message });
    }
  });

  app.patch("/api/admin/jobs/:id/deactivate", async (req, res) => {
    try {
      await db.update(jobs)
        .set({ isActive: false })
        .where(eq(jobs.id, req.params.id));
      res.json({ message: "Job deactivated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to deactivate job", error: error.message });
    }
  });

  // Admin - Tenders Management
  app.get("/api/admin/tenders", async (req, res) => {
    try {
      const tenders = await storage.getAllBiddingProjects();
      res.json(tenders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get tenders", error: error.message });
    }
  });

  // Admin - Categories Management
  app.get("/api/admin/categories", authenticateAdmin, async (req, res) => {
    try {
      // Return mock categories for now - in production, this would come from database
      const categories = [
        { id: "1", name: "Technology", description: "Tech-related projects and startups", type: "project" },
        { id: "2", name: "Healthcare", description: "Medical and health services", type: "project" },
        { id: "3", name: "Education", description: "Educational services and platforms", type: "project" },
        { id: "4", name: "Finance", description: "Financial services and fintech", type: "project" },
        { id: "5", name: "E-commerce", description: "Online retail and marketplace", type: "project" },
        { id: "6", name: "Startup Discussions", description: "General startup conversations", type: "community" },
        { id: "7", name: "Funding Tips", description: "Investment and funding advice", type: "community" },
        { id: "8", name: "Software Development", description: "Development job opportunities", type: "job" },
        { id: "9", name: "Marketing", description: "Marketing and sales positions", type: "job" }
      ];
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get categories", error: error.message });
    }
  });

  app.post("/api/admin/categories", authenticateAdmin, async (req, res) => {
    try {
      const { name, description, type } = req.body;
      // Note: In full production, this would use a categories table
      const newCategory = {
        id: Date.now().toString(),
        name,
        description,
        type,
        createdAt: new Date()
      };
      res.json(newCategory);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create category", error: error.message });
    }
  });

  app.put("/api/admin/categories/:id", async (req, res) => {
    try {
      const { name, description, type } = req.body;
      // Note: In full production, this would update the categories table
      const updatedCategory = {
        id: req.params.id,
        name,
        description,
        type,
        updatedAt: new Date()
      };
      res.json(updatedCategory);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update category", error: error.message });
    }
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      // Note: In full production, this would delete from categories table
      res.json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete category", error: error.message });
    }
  });

  // Admin - Media Content Management
  app.get("/api/admin/media-content", authenticateAdmin, async (req, res) => {
    try {
      const mediaContent = await storage.getAllMediaContent();
      res.json(mediaContent);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get media content", error: error.message });
    }
  });

  app.post("/api/admin/media-content", authenticateAdmin, async (req, res) => {
    try {
      const { title, description, type, url, thumbnailUrl, tags, featured, author } = req.body;
      const mediaContentData = {
        title,
        description,
        type,
        url,
        thumbnailUrl,
        tags: tags || [],
        featured: featured || false,
        author,
        isActive: true
      };
      const newMediaContent = await storage.createMediaContent(mediaContentData);
      res.json(newMediaContent);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create media content", error: error.message });
    }
  });

  app.put("/api/admin/media-content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedMediaContent = await storage.updateMediaContent(id, updateData);
      res.json(updatedMediaContent);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update media content", error: error.message });
    }
  });

  app.delete("/api/admin/media-content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMediaContent(id);
      res.json({ message: "Media content deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete media content", error: error.message });
    }
  });

  // Admin - Platform Settings Management
  app.get("/api/admin/platform-settings", authenticateAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get platform settings", error: error.message });
    }
  });

  app.post("/api/admin/platform-settings", async (req, res) => {
    try {
      const { key, value, description, category } = req.body;
      const setting = await storage.setPlatformSetting(key, value, description, category);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create platform setting", error: error.message });
    }
  });

  app.put("/api/admin/platform-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await storage.updatePlatformSetting(key, value);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update platform setting", error: error.message });
    }
  });

  app.delete("/api/admin/platform-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deletePlatformSetting(key);
      res.json({ message: "Platform setting deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete platform setting", error: error.message });
    }
  });

  // Admin - Departments Management
  app.get("/api/admin/departments", authenticateAdmin, async (req, res) => {
    try {
      // Return mock departments for now - in production, this would come from database
      const departments = [
        { id: "1", name: "Engineering", description: "Software development and technical roles", headCount: 25 },
        { id: "2", name: "Marketing", description: "Marketing and promotional activities", headCount: 8 },
        { id: "3", name: "Sales", description: "Business development and sales", headCount: 12 },
        { id: "4", name: "HR", description: "Human resources and recruitment", headCount: 5 },
        { id: "5", name: "Finance", description: "Financial planning and analysis", headCount: 6 },
        { id: "6", name: "Operations", description: "Day-to-day operations management", headCount: 10 }
      ];
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get departments", error: error.message });
    }
  });

  app.post("/api/admin/departments", async (req, res) => {
    try {
      const { name, description } = req.body;
      // Note: In full production, this would use a departments table
      const newDepartment = {
        id: Date.now().toString(),
        name,
        description,
        headCount: 0,
        createdAt: new Date()
      };
      res.json(newDepartment);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create department", error: error.message });
    }
  });

  app.put("/api/admin/departments/:id", async (req, res) => {
    try {
      const { name, description } = req.body;
      // Note: In full production, this would update the departments table
      const updatedDepartment = {
        id: req.params.id,
        name,
        description,
        headCount: 0,
        updatedAt: new Date()
      };
      res.json(updatedDepartment);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update department", error: error.message });
    }
  });

  app.delete("/api/admin/departments/:id", async (req, res) => {
    try {
      // Note: In full production, this would delete from departments table
      res.json({ message: "Department deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete department", error: error.message });
    }
  });

  // Admin - Company Formations Management
  app.get("/api/admin/company-formations", async (req, res) => {
    try {
      const formations = await storage.getAllCompanyFormations();
      res.json(formations);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company formations", error: error.message });
    }
  });

  app.post("/api/admin/company-formations", async (req, res) => {
    try {
      const formation = await storage.createCompanyFormation(req.body);
      res.status(201).json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create company formation", error: error.message });
    }
  });

  app.patch("/api/admin/company-formations/:id", async (req, res) => {
    try {
      const formation = await storage.updateCompanyFormation(req.params.id, req.body);
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update company formation", error: error.message });
    }
  });

  app.delete("/api/admin/company-formations/:id", async (req, res) => {
    try {
      await storage.deleteCompanyFormation(req.params.id);
      res.json({ message: "Company formation deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete company formation", error: error.message });
    }
  });



  // Connection routes
  app.post("/api/connections", authenticateToken, async (req: any, res) => {
    try {
      const connectionData = {
        ...req.body,
        requesterId: req.user.userId
      };
      
      // Check if connection already exists
      const existingConnection = await storage.getConnectionBetweenUsers(
        connectionData.requesterId,
        connectionData.recipientId,
        connectionData.projectId
      );
      
      if (existingConnection) {
        return res.status(400).json({ message: "Connection request already exists" });
      }
      
      const connection = await storage.createConnection(connectionData.requesterId, connectionData.recipientId);
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create connection", error: error.message });
    }
  });

  app.get("/api/connections", authenticateToken, async (req: any, res) => {
    try {
      const connections = await storage.getUserConnections(req.user.userId);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get connections", error: error.message });
    }
  });

  app.patch("/api/connections/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { status } = req.body;
      const connection = await storage.updateConnectionStatus(req.params.id, status);
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update connection status", error: error.message });
    }
  });

  app.post("/api/company-formations", authenticateToken, async (req: any, res) => {
    try {
      const formationData = { 
        ...req.body, 
        userId: req.user.userId 
      };
      
      const formation = await storage.createCompanyFormation(formationData);
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create company formation", error: error.message });
    }
  });

  app.get("/api/company-formations/my", authenticateToken, async (req: any, res) => {
    try {
      const formation = await storage.getCompanyFormationByUser(req.user.userId);
      res.json(formation);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company formation", error: error.message });
    }
  });

  app.get("/api/company-formations", authenticateToken, async (req: any, res) => {
    try {
      const formations = await storage.getAllCompanyFormations();
      res.json(formations);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company formations", error: error.message });
    }
  });

  app.put("/api/company-formations/:id", authenticateToken, async (req: any, res) => {
    try {
      const formation = await storage.updateCompanyFormation(req.params.id, req.body);
      res.json(formation);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update company formation", error: error.message });
    }
  });

  // Bidding project routes
  app.get("/api/bidding-projects", async (req, res) => {
    try {
      const projects = await storage.getAllBiddingProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get bidding projects", error: error.message });
    }
  });

  app.get("/api/bidding-projects/:id", async (req, res) => {
    try {
      const project = await storage.getBiddingProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get project", error: error.message });
    }
  });

  app.get("/api/bidding-projects/user/:userId", authenticateToken, async (req: any, res) => {
    try {
      const projects = await storage.getBiddingProjectsByUser(req.params.userId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user projects", error: error.message });
    }
  });

  app.post("/api/bidding-projects", authenticateToken, async (req: any, res) => {
    try {
      const projectData = insertBiddingProjectSchema.parse({
        ...req.body,
        userId: req.user.userId
      });
      const project = await storage.createBiddingProject(projectData);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create project", error: error.message });
    }
  });

  app.put("/api/bidding-projects/:id", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getBiddingProject(req.params.id);
      if (!project || project.userId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to update this project" });
      }
      
      const updates = insertBiddingProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateBiddingProject(req.params.id, updates);
      res.json(updatedProject);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update project", error: error.message });
    }
  });

  // Project bid routes
  app.get("/api/project-bids/:projectId", async (req, res) => {
    try {
      const bids = await storage.getProjectBids(req.params.projectId);
      res.json(bids);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get project bids", error: error.message });
    }
  });

  app.get("/api/project-bids/user/:userId", authenticateToken, async (req: any, res) => {
    try {
      const bids = await storage.getBidsByUser(req.params.userId);
      res.json(bids);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user bids", error: error.message });
    }
  });

  app.post("/api/project-bids", authenticateToken, async (req: any, res) => {
    try {
      // Check if user is KYC verified
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.isKycComplete) {
        return res.status(403).json({ message: "KYC verification required to submit bids" });
      }

      const bidData = insertProjectBidSchema.parse({
        ...req.body,
        userId: req.user.userId
      });
      const bid = await storage.createProjectBid(bidData);
      res.json(bid);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create bid", error: error.message });
    }
  });

  app.put("/api/project-bids/:id", authenticateToken, async (req: any, res) => {
    try {
      const bid = await storage.getProjectBids(req.params.id);
      // Check if user owns the bid or the project
      // This would require more complex logic to verify ownership
      
      const updates = insertProjectBidSchema.partial().parse(req.body);
      const updatedBid = await storage.updateProjectBid(req.params.id, updates);
      res.json(updatedBid);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update bid", error: error.message });
    }
  });

  // Companies routes
  app.get('/api/companies', async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: 'Failed to fetch companies' });
    }
  });

  app.get('/api/companies/my', authenticateToken, async (req: any, res) => {
    try {
      const companies = await storage.getCompaniesByOwner(req.user.userId);
      res.json(companies);
    } catch (error: any) {
      console.error('Error fetching user companies:', error);
      res.status(500).json({ message: 'Failed to fetch user companies' });
    }
  });

  app.post('/api/companies', authenticateToken, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.parse({ ...req.body, ownerId: req.user.userId });
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error: any) {
      console.error('Error creating company:', error);
      res.status(400).json({ message: 'Failed to create company', error: error.message });
    }
  });

  app.get('/api/companies/:id', async (req, res) => {
    try {
      const company = await storage.getCompanyById(req.params.id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ message: 'Failed to fetch company' });
    }
  });

  app.put('/api/companies/:id', authenticateToken, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'profilePdf', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const company = await storage.getCompanyById(req.params.id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      if (company.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Unauthorized to update this company' });
      }

      const updates: any = { ...req.body };
      
      // Handle logo upload
      if (req.files?.logo?.[0]) {
        updates.logo = `/uploads/${req.files.logo[0].filename}`;
      }
      
      // Handle profile PDF upload
      if (req.files?.profilePdf?.[0]) {
        updates.profilePdf = `/uploads/${req.files.profilePdf[0].filename}`;
      }
      
      // Handle tags - convert from JSON string if needed
      if (updates.tags && typeof updates.tags === 'string') {
        try {
          updates.tags = JSON.parse(updates.tags);
        } catch (e) {
          // If parsing fails, assume it's a comma-separated string
          updates.tags = updates.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        }
      }
      
      // Convert establishedYear to number if provided
      if (updates.establishedYear) {
        updates.establishedYear = parseInt(updates.establishedYear);
      }

      const updatedCompany = await storage.updateCompany(req.params.id, updates);
      res.json(updatedCompany);
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ message: 'Failed to update company' });
    }
  });

  app.delete("/api/admin/companies/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCompany(id);
      res.json({ message: "Company deleted successfully" });
    } catch (error: any) {
      console.error("Delete company error:", error);
      res.status(400).json({ message: "Failed to delete company", error: error.message });
    }
  });

  // Company Services Routes
  app.get('/api/companies/:id/services', async (req, res) => {
    try {
      const services = await storage.getCompanyServices(req.params.id);
      res.json(services);
    } catch (error) {
      console.error('Error fetching company services:', error);
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  app.post('/api/companies/:id/services', authenticateToken, async (req: any, res) => {
    try {
      const companyId = req.params.id;
      const company = await storage.getCompanyById(companyId);
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      if (company.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to add services to this company' });
      }

      const serviceData = { ...req.body, companyId };
      const service = await storage.createCompanyService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error('Error creating service:', error);
      res.status(400).json({ message: 'Failed to create service', error: error.message });
    }
  });

  // Company Products Routes
  app.get('/api/companies/:id/products', async (req, res) => {
    try {
      const products = await storage.getCompanyProducts(req.params.id);
      res.json(products);
    } catch (error) {
      console.error('Error fetching company products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.post('/api/companies/:id/products', authenticateToken, async (req: any, res) => {
    try {
      const companyId = req.params.id;
      const company = await storage.getCompanyById(companyId);
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      if (company.ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to add products to this company' });
      }

      const productData = { ...req.body, companyId };
      const product = await storage.createCompanyProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ message: 'Failed to create product', error: error.message });
    }
  });

  // PayUMoney payment routes
  app.post('/api/payments/company-creation', authenticateToken, async (req, res) => {
    try {
      const { amount, companyData } = req.body;
      const userId = req.user.userId;

      const txnId = payumoneyService.generateTxnId();
      
      // Create payment record
      const payment = await storage.createPayment({
        userId,
        amount,
        paymentType: 'company_creation' as const,
        status: 'pending',
        description: 'Company registration fee',
        metadata: JSON.stringify({ companyData, txnId }),
      });

      const paymentData = {
        amount,
        productInfo: 'Company Registration Fee',
        firstName: req.user.firstName || 'User',
        email: req.user.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId,
        paymentType: 'company_creation' as const,
        metadata: { paymentId: payment.id, companyData },
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          txnId: paymentResponse.txnId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error creating company payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  app.post('/api/payments/support', authenticateToken, async (req, res) => {
    try {
      const { amount, projectId } = req.body;
      const userId = req.user.userId;

      const txnId = payumoneyService.generateTxnId();
      
      // Create payment record
      const payment = await storage.createPayment({
        userId,
        projectId,
        amount,
        paymentType: 'support' as const,
        status: 'pending',
        description: 'Project support donation',
        metadata: JSON.stringify({ txnId }),
      });

      const paymentData = {
        amount: parseFloat(amount).toFixed(2),
        productInfo: 'Project Support Donation',
        firstName: req.user.firstName || 'User',
        email: req.user.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId,
        paymentType: 'support' as const,
        metadata: { paymentId: payment.id, projectId },
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          formData: paymentResponse.formData,
          txnId: paymentResponse.txnId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error creating support payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  app.post('/api/payments/subscription', authenticateToken, async (req, res) => {
    try {
      const { planType } = req.body;
      const userId = req.user.userId;

      const amount = planType === 'monthly' ? 399 : planType === 'annual' ? 3990 : 0; // Beta is free
      const txnId = payumoneyService.generateTxnId();
      
      // Create subscription
      const subscription = await storage.createSubscription({
        userId,
        planType,
        amount,
        status: amount === 0 ? 'trial' : 'inactive',
      });

      if (amount === 0) {
        // Beta subscription - no payment needed
        res.json({
          success: true,
          subscriptionId: subscription.id,
          message: 'Beta subscription activated',
        });
        return;
      }

      // Create payment record
      const payment = await storage.createPayment({
        userId,
        subscriptionId: subscription.id,
        amount,
        paymentType: 'subscription' as const,
        status: 'pending',
        description: `Qipad ${planType} subscription`,
        metadata: JSON.stringify({ txnId, subscriptionId: subscription.id }),
      });

      const paymentData = {
        amount,
        productInfo: `Qipad ${planType} subscription`,
        firstName: req.user.firstName || 'User',
        email: req.user.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId,
        paymentType: 'subscription' as const,
        metadata: { paymentId: payment.id, subscriptionId: subscription.id },
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          txnId: paymentResponse.txnId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error creating subscription payment:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  // PayUMoney callback handlers
  app.post('/api/payments/success', async (req, res) => {
    try {
      const callbackResult = await payumoneyService.processCallback(req.body);
      
      if (callbackResult.success) {
        // Update payment status
        const metadata = JSON.parse(req.body.udf3 || '{}');
        await storage.updatePaymentStatus(callbackResult.txnId, 'completed', req.body.payuMoneyId);
        
        // Handle different payment types
        if (req.body.udf2 === 'company_creation') {
          // Create the company after successful payment
          const companyData = metadata.companyData;
          if (companyData) {
            await storage.createCompany({
              ...companyData,
              ownerId: req.body.udf1,
              status: 'pending',
            });
          }
        } else if (req.body.udf2 === 'subscription') {
          // Activate subscription
          const subscriptionId = metadata.subscriptionId;
          if (subscriptionId) {
            await storage.updateSubscriptionStatus(subscriptionId, 'active');
          }
        } else if (req.body.udf2 === 'support') {
          // Update project funding (with configurable platform fee deducted)
          const projectId = metadata.projectId;
          const platformFeePercentage = await PlatformSettingsService.getPlatformFeePercentage();
          const platformFee = callbackResult.amount * platformFeePercentage;
          const netAmount = callbackResult.amount - platformFee;
          
          if (projectId) {
            await storage.updateProjectFunding(projectId, netAmount);
          }
        } else if (req.body.udf2 === 'investment') {
          // Create investment record after successful payment
          const { projectId, expectedStakes, message, phone } = metadata;
          const investmentData = {
            projectId,
            investorId: req.body.udf1,
            amount: callbackResult.amount,
            expectedStakes,
            type: 'invest',
            status: 'pending', // Project owner needs to approve
            investorContact: phone,
            investorEmail: req.body.email,
            message,
            platformFeePaid: true
          };
          
          const investment = await storage.createInvestment(investmentData);
          
          // Send investment success email
          try {
            const [user, project] = await Promise.all([
              storage.getUser(req.body.udf1),
              storage.getProject(projectId)
            ]);
            
            if (user && project) {
              await emailService.sendInvestmentSuccessEmail({
                toEmail: user.email,
                firstName: user.firstName,
                projectTitle: project.title,
                investmentAmount: callbackResult.amount.toString(),
                equityPercentage: expectedStakes.toString(),
                transactionId: callbackResult.txnId,
                investmentDate: new Date().toLocaleDateString(),
                projectUrl: `${process.env.BASE_URL || 'https://qipad.co'}/projects/${projectId}`,
                portfolioUrl: `${process.env.BASE_URL || 'https://qipad.co'}/portfolio`
              });
            }
          } catch (emailError) {
            console.error('Failed to send investment success email:', emailError);
            // Don't fail the investment if email fails
          }
        } else if (req.body.udf2 === 'event') {
          // Handle event registration payment
          const { eventId } = metadata;
          
          if (eventId) {
            // Register user for the event
            await storage.registerForEvent({
              eventId,
              userId: req.body.udf1,
              registeredAt: new Date()
            });
            
            // Update event participant count
            const event = await storage.getEvent(eventId);
            if (event) {
              await storage.updateEvent(eventId, {
                currentParticipants: (event.currentParticipants || 0) + 1
              });
            }
          }
        }
        
        // Determine payment type for redirect
        const paymentType = req.body.udf2 || 'payment';
        res.redirect(`/payment-success?type=${paymentType}`);
      } else {
        res.redirect('/dashboard?payment=failed');
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      res.redirect('/dashboard?payment=error');
    }
  });

  app.post('/api/payments/failure', async (req, res) => {
    try {
      const callbackResult = await payumoneyService.processCallback(req.body);
      await storage.updatePaymentStatus(callbackResult.txnId, 'failed', req.body.payuMoneyId);
      res.redirect('/dashboard?payment=failed');
    } catch (error) {
      console.error('Error processing payment failure:', error);
      res.redirect('/dashboard?payment=error');
    }
  });

  // Billing and subscription routes
  app.get('/api/subscriptions/my', authenticateToken, async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription(req.user.userId);
      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  app.get('/api/payments/my', authenticateToken, async (req, res) => {
    try {
      const payments = await storage.getUserPayments(req.user.userId);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is KYC verified - check isKycComplete instead of kycStatus
      if (!user.isKycComplete) {
        return res.status(403).json({ message: "Only KYC-verified members can create events. Complete your KYC verification to start creating events." });
      }

      const eventData = {
        ...req.body,
        creatorId: user.id,
        eventDate: new Date(req.body.eventDate + 'T' + req.body.eventTime),
      };

      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Media Content routes
  app.get("/api/media-content", async (req, res) => {
    try {
      // For now return empty array - will be populated by admin
      const mediaContent = await storage.getAllMediaContent();
      res.json(mediaContent);
    } catch (error) {
      console.error("Error fetching media content:", error);
      res.status(500).json({ message: "Failed to fetch media content" });
    }
  });

  // PayUMoney integration for paid event registration
  app.post("/api/events/:id/register", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const eventId = req.params.id;
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if event is paid
      if (!event.isPaid || parseFloat(event.price) === 0) {
        // Free event - direct registration
        await storage.joinEvent(eventId, user.id);
        return res.json({ message: "Successfully registered for free event" });
      }

      const txnId = payumoneyService.generateTxnId();
      
      // Calculate platform fee (2% for paid events) - INCLUSIVE
      const eventPrice = parseFloat(event.price);
      const platformFee = eventPrice * 0.02;
      const totalAmount = eventPrice; // Total amount user pays remains same
      const netAmount = eventPrice - platformFee; // Amount that goes to event creator

      // Create payment record
      const payment = await storage.createPayment({
        userId: user.id,
        amount: totalAmount,
        paymentType: 'event',
        status: 'pending',
        description: `Event Registration: ${event.title}`,
        metadata: JSON.stringify({ txnId, eventId, platformFee, netAmount }),
      });

      const paymentData = {
        amount: Number(totalAmount), // Ensure numeric value
        productInfo: `Event Registration - ${event.title}`,
        firstName: user.firstName || 'User',
        email: user.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId: user.id,
        paymentType: 'event',
        metadata: { paymentId: payment.id, eventId, platformFee, netAmount },
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          formData: paymentResponse.formData,
          txnId: paymentResponse.txnId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      res.status(500).json({ message: 'Failed to register for event' });
    }
  });

  app.post("/api/events/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const eventId = req.params.id;
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // For paid events, redirect to register endpoint
      if (event.isPaid && parseFloat(event.price) > 0) {
        return res.status(400).json({ 
          message: "This is a paid event. Use the register endpoint.",
          requiresPayment: true
        });
      }

      // Check if user is already a participant
      const isParticipant = await storage.isUserParticipant(eventId, user.id);
      if (isParticipant) {
        return res.status(400).json({ message: "Already joined this event" });
      }

      // Check if event is full
      if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
        return res.status(400).json({ message: "Event is full" });
      }

      await storage.joinEvent(eventId, user.id);
      res.json({ message: "Successfully joined the event" });
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.get("/api/events/:id/participants", async (req, res) => {
    try {
      const participants = await storage.getEventParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Notification system routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get notifications", error: error.message });
    }
  });

  app.post("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notification = await storage.createNotification({
        userId: req.body.userId,
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'general',
        isRead: false
      });
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create notification", error: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to mark notification as read", error: error.message });
    }
  });

  app.patch("/api/notifications/read-all", authenticateToken, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to mark all notifications as read", error: error.message });
    }
  });

  // Company Services Routes
  app.get("/api/companies/:companyId/services", async (req, res) => {
    try {
      const services = await storage.getCompanyServices(req.params.companyId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company services", error: error.message });
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllCompanyServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get services", error: error.message });
    }
  });

  app.post("/api/companies/:companyId/services", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user?.isKycComplete) {
        return res.status(403).json({ message: "KYC verification required to create services" });
      }

      const company = await storage.getCompanyById(req.params.companyId);
      if (!company || company.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to add services to this company" });
      }

      const serviceData = insertCompanyServiceSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      
      const service = await storage.createCompanyService(serviceData);
      res.json(service);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create service", error: error.message });
    }
  });

  app.put("/api/services/:id", authenticateToken, async (req: any, res) => {
    try {
      const service = await storage.getCompanyServices(req.params.id);
      // This would need additional logic to verify ownership
      const updates = insertCompanyServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateCompanyService(req.params.id, updates);
      res.json(updatedService);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update service", error: error.message });
    }
  });

  app.delete("/api/services/:id", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteCompanyService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete service", error: error.message });
    }
  });

  // Company Products Routes
  app.get("/api/companies/:companyId/products", async (req, res) => {
    try {
      const products = await storage.getCompanyProducts(req.params.companyId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get company products", error: error.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllCompanyProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get products", error: error.message });
    }
  });

  app.post("/api/companies/:companyId/products", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user?.isKycComplete) {
        return res.status(403).json({ message: "KYC verification required to create products" });
      }

      const company = await storage.getCompanyById(req.params.companyId);
      if (!company || company.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to add products to this company" });
      }

      const productData = insertCompanyProductSchema.parse({
        ...req.body,
        companyId: req.params.companyId
      });
      
      const product = await storage.createCompanyProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create product", error: error.message });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: any, res) => {
    try {
      const updates = insertCompanyProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateCompanyProduct(req.params.id, updates);
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update product", error: error.message });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteCompanyProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
  });

  // Service Inquiry Routes
  app.post("/api/services/:serviceId/inquire", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const inquiryData = insertServiceInquirySchema.parse({
        ...req.body,
        serviceId: req.params.serviceId,
        inquirerUserId: req.user.userId
      });
      
      const inquiry = await storage.createServiceInquiry(inquiryData);
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create inquiry", error: error.message });
    }
  });

  app.post("/api/products/:productId/inquire", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const inquiryData = insertServiceInquirySchema.parse({
        ...req.body,
        productId: req.params.productId,
        inquirerUserId: req.user.userId
      });
      
      const inquiry = await storage.createServiceInquiry(inquiryData);
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create inquiry", error: error.message });
    }
  });

  app.get("/api/companies/:companyId/inquiries", authenticateToken, async (req: any, res) => {
    try {
      const company = await storage.getCompanyById(req.params.companyId);
      if (!company || company.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to view inquiries for this company" });
      }

      const inquiries = await storage.getServiceInquiries(req.params.companyId);
      res.json(inquiries);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get inquiries", error: error.message });
    }
  });

  app.get("/api/inquiries/my", authenticateToken, async (req: any, res) => {
    try {
      const inquiries = await storage.getUserServiceInquiries(req.user.userId);
      res.json(inquiries);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user inquiries", error: error.message });
    }
  });

  app.put("/api/inquiries/:id", authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const updatedInquiry = await storage.updateServiceInquiry(req.params.id, updates);
      res.json(updatedInquiry);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update inquiry", error: error.message });
    }
  });

  // Service Purchase Routes (for 2% platform fee payments)
  app.post("/api/services/:serviceId/purchase", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { amount, description } = req.body;
      
      if (!amount || amount < 10) {
        return res.status(400).json({ message: "Minimum purchase amount is ₹10" });
      }

      const txnId = payumoneyService.generateTxnId();
      
      // Calculate platform fee (configurable percentage of service amount)
      const platformFeePercentage = await PlatformSettingsService.getPlatformFeePercentage();
      const platformFee = amount * platformFeePercentage;
      const netAmount = amount - platformFee;

      // Create service purchase record
      const purchase = await storage.createServicePurchase({
        serviceId: req.params.serviceId,
        companyId: req.body.companyId,
        customerId: user.id,
        amount,
        platformFee,
        netAmount,
        paymentStatus: 'pending',
        description: description || 'Service Purchase'
      });

      // Create payment record
      const payment = await storage.createPayment({
        userId: user.id,
        amount,
        paymentType: 'service_purchase',
        status: 'pending',
        description: `Service Purchase - ${description || 'Service'}`,
        metadata: JSON.stringify({ txnId, serviceId: req.params.serviceId, purchaseId: purchase.id }),
      });

      const paymentData = {
        amount,
        productInfo: `Service Purchase - ${description || 'Service'}`,
        firstName: user.firstName || 'User',
        email: user.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId: user.id,
        paymentType: 'service_purchase',
        metadata: { paymentId: payment.id, serviceId: req.params.serviceId, purchaseId: purchase.id },
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          txnId: paymentResponse.txnId,
          platformFee,
          netAmount
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error creating service purchase:', error);
      res.status(500).json({ message: 'Failed to create service purchase' });
    }
  });

  // ========================================
  // WALLET SYSTEM ROUTES
  // ========================================

  // Get user's wallet balance and details
  app.get("/api/wallet", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      
      // Get or create wallet
      let wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await storage.createWallet({ userId, balance: "0" });
      }

      res.json({
        balance: parseFloat(wallet.balance),
        totalEarned: parseFloat(wallet.totalEarned || "0"),
        totalSpent: parseFloat(wallet.totalSpent || "0"),
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ message: 'Failed to fetch wallet details' });
    }
  });

  // Get wallet transaction history
  app.get("/api/wallet/transactions", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const transactions = await storage.getWalletTransactions(userId, limit);
      
      res.json(transactions.map(transaction => ({
        ...transaction,
        amount: parseFloat(transaction.amount),
        balanceBefore: parseFloat(transaction.balanceBefore),
        balanceAfter: parseFloat(transaction.balanceAfter),
      })));
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transaction history' });
    }
  });

  // Initiate wallet deposit via PayUMoney
  app.post("/api/wallet/deposit", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      const { amount } = req.body;

      // Validate amount
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount < 10) {
        return res.status(400).json({
          success: false,
          error: 'Minimum deposit amount is ₹10'
        });
      }

      // Calculate fees (2% payment gateway + 1% platform = 3% total)
      const paymentGatewayFee = depositAmount * 0.02;
      const platformFee = depositAmount * 0.01;
      const totalFees = paymentGatewayFee + platformFee;
      const netCredits = depositAmount - totalFees;

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Create payment record
      const payment = await storage.createPayment({
        userId,
        amount: depositAmount.toFixed(2),
        paymentType: 'wallet_deposit',
        description: `Wallet deposit of ₹${depositAmount} (Net credits: ₹${netCredits.toFixed(2)})`,
        metadata: JSON.stringify({ netCredits: netCredits.toFixed(2), totalFees: totalFees.toFixed(2) })
      });

      // Generate unique transaction ID
      const txnId = `WALLET_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // PayUMoney payment data
      const paymentData = {
        txnId,
        amount: depositAmount,
        productInfo: `Qipad Wallet Deposit - ₹${depositAmount}`,
        firstName: user.firstName,
        email: user.email,
        phone: user.phone || '',
        successUrl: `${process.env.BASE_URL || 'https://qipad.co'}/api/wallet/callback/success`,
        failureUrl: `${process.env.BASE_URL || 'https://qipad.co'}/api/wallet/callback/failure`,
        userId,
        paymentType: 'wallet_deposit',
        metadata: { paymentId: payment.id, netCredits: netCredits.toFixed(2) }
      };

      const paymentResponse = await payumoneyService.createPayment(paymentData);
      
      if (paymentResponse.success) {
        res.json({
          success: true,
          paymentUrl: paymentResponse.paymentUrl,
          txnId: paymentResponse.txnId,
          depositAmount,
          paymentGatewayFee: paymentGatewayFee.toFixed(2),
          platformFee: platformFee.toFixed(2),
          totalFees: totalFees.toFixed(2),
          netCredits: netCredits.toFixed(2),
          formData: paymentResponse.formData
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      console.error('Error initiating wallet deposit:', error);
      res.status(500).json({ message: 'Failed to initiate deposit' });
    }
  });

  // Handle PayUMoney success callback for wallet deposits
  app.post("/api/wallet/callback/success", async (req: any, res: any) => {
    try {
      const callbackData = req.body;
      console.log('Wallet deposit callback received:', callbackData);

      // Process the callback
      const callbackResult = await payumoneyService.processCallback(callbackData);
      
      if (callbackResult.success && callbackResult.status === 'success') {
        const { txnId, amount } = callbackResult;
        
        // Extract user ID from transaction metadata
        const userId = callbackData.udf1;
        const paymentMetadata = JSON.parse(callbackData.udf3 || '{}');
        const netCredits = parseFloat(paymentMetadata.netCredits || amount);

        if (userId) {
          // Add credits to user's wallet
          const creditResult = await storage.addCredits(
            userId,
            netCredits,
            `Wallet deposit via PayUMoney (TxnID: ${txnId})`,
            'deposit',
            txnId
          );

          if (creditResult.success) {
            console.log(`Successfully added ${netCredits} credits to user ${userId}`);
            
            // Send deposit success email
            try {
              const user = await storage.getUser(userId);
              if (user) {
                await emailService.sendDepositSuccessEmail({
                  toEmail: user.email,
                  firstName: user.firstName,
                  amount: amount.toString(),
                  credits: netCredits.toString(),
                  transactionId: txnId,
                  newBalance: creditResult.newBalance?.toString() || '0',
                  walletUrl: `${process.env.BASE_URL || 'https://qipad.co'}/wallet`,
                  dashboardUrl: `${process.env.BASE_URL || 'https://qipad.co'}/dashboard`
                });
              }
            } catch (emailError) {
              console.error('Failed to send deposit success email:', emailError);
              // Don't fail the deposit if email fails
            }
            
            res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?success=true&amount=${netCredits}`);
          } else {
            console.error('Failed to add credits:', creditResult.error);
            res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?error=credit_failed`);
          }
        } else {
          console.error('User ID not found in callback data');
          res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?error=invalid_callback`);
        }
      } else {
        console.error('Payment verification failed:', callbackResult);
        res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?error=payment_failed`);
      }
    } catch (error) {
      console.error('Error processing wallet deposit callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?error=callback_error`);
    }
  });

  // Handle PayUMoney failure callback for wallet deposits
  app.post("/api/wallet/callback/failure", async (req: any, res: any) => {
    try {
      const callbackData = req.body;
      console.log('Wallet deposit failed:', callbackData);
      
      res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?error=payment_cancelled`);
    } catch (error) {
      console.error('Error processing wallet deposit failure:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'https://qipad.co'}/wallet?error=callback_error`);
    }
  });

  // ========================================
  // REFERRAL SYSTEM ROUTES
  // ========================================

  // Get user's personal referral info and referrals
  app.get("/api/referrals", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      
      // Generate or get user's permanent referral code
      const userReferralId = `QIP${userId.substring(0, 6).toUpperCase()}`;
      const userReferralUrl = `${process.env.BASE_URL || 'https://qipad.co'}/auth?ref=${userReferralId}`;
      
      // Get referrals from both sources: referrals table and wallet transactions
      const referrals = await storage.getReferralsByUser(userId);
      const referralTransactions = await storage.getReferralTransactionsByUser(userId);
      
      // Use wallet transaction data as the source of truth for counts and totals
      const totalReferralsFromWallet = referralTransactions.length;
      const totalEarnedFromWallet = referralTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
      
      res.json({
        personalReferral: {
          referralId: userReferralId,
          referralUrl: userReferralUrl,
          totalReferrals: totalReferralsFromWallet > 0 ? totalReferralsFromWallet : referrals.length,
          totalEarned: totalEarnedFromWallet > 0 ? totalEarnedFromWallet : referrals.reduce((sum, ref) => sum + parseFloat(ref.rewardAmount || '0'), 0)
        },
        referrals: referrals.map(referral => ({
          ...referral,
          rewardAmount: parseFloat(referral.rewardAmount),
          referralId: referral.referralCode,
          referralUrl: `${process.env.BASE_URL || 'https://qipad.co'}/auth?ref=${referral.referralCode}`
        }))
      });
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // Send referral invitation
  app.post("/api/referrals", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      const { referredEmail } = req.body;

      if (!referredEmail || !referredEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }

      // Get user info for the email
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is already referred by this user
      const existingReferrals = await storage.getReferralsByUser(userId);
      const alreadyReferred = existingReferrals.some(ref => ref.referredEmail === referredEmail);
      
      if (alreadyReferred) {
        return res.status(400).json({ error: 'This email has already been referred by you' });
      }

      // Use user's permanent referral ID and URL
      const userReferralId = `QIP${userId.substring(0, 6).toUpperCase()}`;
      const userReferralUrl = `${process.env.BASE_URL || 'https://qipad.co'}/auth?ref=${userReferralId}`;

      // Send referral email
      const referrerName = `${user.firstName} ${user.lastName}`;
      const emailSent = await emailService.sendReferralEmail({
        toEmail: referredEmail,
        referrerName,
        referralUrl: userReferralUrl,
        referralId: userReferralId
      });

      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send referral email' });
      }

      // Create referral record
      const referral = await storage.createReferral({
        referrerId: userId,
        referredEmail,
        referralCode: userReferralId,
        status: 'pending',
        rewardAmount: '50'
      });

      res.json({
        success: true,
        message: `Referral invitation sent to ${referredEmail}`,
        referral: {
          ...referral,
          rewardAmount: parseFloat(referral.rewardAmount),
          referralId: userReferralId,
          referralUrl: userReferralUrl
        }
      });
    } catch (error) {
      console.error('Error sending referral:', error);
      res.status(500).json({ message: 'Failed to send referral invitation' });
    }
  });

  // ========================================
  // CREDIT MANAGEMENT ROUTES
  // ========================================

  // Check if user has sufficient credits for an action
  app.post("/api/credits/check", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      const { action, amount } = req.body;

      // Get platform settings for credit costs
      const creditCosts = {
        'innovation': 100,
        'job': 50,
        'investor_connection': 10,
        'community_create': 100,
        'community_join': 10,
        'event': 50
      };

      const requiredCredits = amount || creditCosts[action as keyof typeof creditCosts] || 0;
      
      // Get wallet balance
      let wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await storage.createWallet({ userId, balance: "0" });
      }

      const currentBalance = parseFloat(wallet.balance);
      const hasEnoughCredits = currentBalance >= requiredCredits;

      res.json({
        hasEnoughCredits,
        currentBalance,
        requiredCredits,
        shortfall: hasEnoughCredits ? 0 : requiredCredits - currentBalance
      });
    } catch (error) {
      console.error('Error checking credits:', error);
      res.status(500).json({ message: 'Failed to check credits' });
    }
  });

  // Deduct credits for an action
  app.post("/api/credits/deduct", authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      const { action, amount, description, referenceType, referenceId } = req.body;

      // Get platform settings for credit costs
      const creditCosts = {
        'innovation': 100,
        'job': 50,
        'investor_connection': 10,
        'community_create': 100,
        'community_join': 10,
        'event': 50
      };

      const creditsToDeduct = amount || creditCosts[action as keyof typeof creditCosts] || 0;
      
      if (creditsToDeduct <= 0) {
        return res.status(400).json({ error: 'Invalid credit amount' });
      }

      const result = await storage.deductCredits(
        userId,
        creditsToDeduct,
        description || `Credits deducted for ${action}`,
        referenceType || action,
        referenceId
      );

      if (result.success) {
        res.json({
          success: true,
          newBalance: result.newBalance,
          deductedAmount: creditsToDeduct
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          currentBalance: result.newBalance
        });
      }
    } catch (error) {
      console.error('Error deducting credits:', error);
      res.status(500).json({ message: 'Failed to deduct credits' });
    }
  });

  // ========================================
  // OBJECT STORAGE ROUTES FOR PROJECT IMAGES
  // ========================================

  // Serve public object storage files (for images, documents, etc.)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects for project images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for project images
  app.post("/api/projects/images/upload", authenticateToken, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Update project images after upload
  app.put("/api/projects/:projectId/images", authenticateToken, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const projectId = req.params.projectId;
      const userId = req.user.userId;

      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this project" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageURL,
      );

      // Get existing images and add new one
      const existingImages = project.images || [];
      const updatedImages = [...existingImages, objectPath];

      // Update project with new image
      const updatedProject = await storage.updateProject(projectId, {
        images: updatedImages,
        updatedAt: new Date()
      });

      res.status(200).json({
        objectPath: objectPath,
        project: updatedProject
      });
    } catch (error) {
      console.error("Error updating project images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
