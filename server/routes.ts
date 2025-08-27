import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertDocumentSchema, insertInvestmentSchema, insertCommunitySchema, insertJobSchema, insertJobApplicationSchema, insertBiddingProjectSchema, insertProjectBidSchema, insertCompanySchema, insertPaymentSchema, insertSubscriptionSchema, insertCompanyServiceSchema, insertCompanyProductSchema, insertServiceInquirySchema } from "@shared/schema";
import { payumoneyService } from "./payumoney";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post("/api/payment/support", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, amount, platformFee, finalAmount, phone, message } = req.body;
      
      // Create support record in investments table with type 'support'
      const supportData = {
        projectId,
        investorId: req.user.userId,
        amount,
        type: "support", // Support type for donations
        status: "completed", // Support payments are completed immediately
        platformFeePaid: true,
        investorContact: phone,
        message,
        expectedStakes: null // No stakes for support
      };
      
      const support = await storage.createInvestment(supportData);

      // Update project funding
      const project = await storage.getProject(projectId);
      if (project) {
        const newFunding = parseFloat(project.currentFunding || '0') + parseFloat(finalAmount);
        await storage.updateProject(projectId, { 
          currentFunding: newFunding.toString() 
        });
      }

      res.json({ 
        success: true, 
        support,
        paymentUrl: `https://test.payu.in/success?amount=${amount}&fee=${platformFee}`,
        message: "Support payment processed successfully" 
      });
    } catch (error: any) {
      console.error("Support payment error:", error);
      res.status(500).json({ message: "Failed to process support payment", error: error.message });
    }
  });

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
  app.get("/api/admin/users", async (req, res) => {
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

  app.put("/api/admin/users/:id", async (req, res) => {
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

  app.delete("/api/admin/users/:id", async (req, res) => {
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
  app.patch("/api/admin/users/:id/status", async (req, res) => {
    try {
      const { status } = req.body; // 'active' or 'suspended'
      const user = await storage.updateUser(req.params.id, { status });
      res.json({ message: "User status updated successfully", user: { ...user, passwordHash: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update user status", error: error.message });
    }
  });

  // Admin route for KYC verification with user sync
  app.patch("/api/admin/documents/:id/verify", async (req, res) => {
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
  app.put("/api/admin/users/:userId/kyc", async (req, res) => {
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
          await storage.updateDocument(doc.id, { status: 'approved' });
        }
      }
      
      res.json({ message: "KYC status updated successfully", user });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update KYC status", error: error.message });
    }
  });

  // Projects CRUD
  app.get("/api/admin/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjectsWithOwners();
      res.json(projects);
    } catch (error: any) {
      console.error("Admin projects route error:", error);
      res.status(500).json({ message: "Failed to get projects", error: error.message });
    }
  });

  app.put("/api/admin/projects/:id", async (req, res) => {
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

  app.delete("/api/admin/projects/:id", async (req, res) => {
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
  app.get("/api/admin/investments", async (req, res) => {
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

  app.put("/api/admin/investments/:id", async (req, res) => {
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

  app.delete("/api/admin/investments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvestment(id);
      res.json({ message: "Investment deleted successfully" });
    } catch (error: any) {
      console.error("Delete investment error:", error);
      res.status(400).json({ message: "Failed to delete investment", error: error.message });
    }
  });

  app.patch("/api/admin/projects/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const project = await storage.updateProject(req.params.id, { status });
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update project status", error: error.message });
    }
  });

  // TENDER MANAGEMENT ROUTES
  app.get("/api/admin/tenders", async (req, res) => {
    try {
      const tenders = await storage.getAllTenders();
      res.json(tenders);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get tenders", error: error.message });
    }
  });

  app.post("/api/admin/tenders", async (req, res) => {
    try {
      const tender = await storage.createTender(req.body);
      res.json(tender);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create tender", error: error.message });
    }
  });

  app.put("/api/admin/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.updateTender(req.params.id, req.body);
      res.json(tender);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update tender", error: error.message });
    }
  });

  app.delete("/api/admin/tenders/:id", async (req, res) => {
    try {
      await storage.deleteTender(req.params.id);
      res.json({ message: "Tender deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete tender", error: error.message });
    }
  });

  // COMPANY FORMATION MANAGEMENT ROUTES
  app.get("/api/admin/company-formations", async (req, res) => {
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
      const { companyFormations } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(companyFormations).where(eq(companyFormations.id, req.params.id));
      res.json({ message: "Company formation deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete company formation", error: error.message });
    }
  });

  // Admin - Communities Management
  app.get("/api/admin/communities", async (req, res) => {
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
  app.get("/api/admin/jobs", async (req, res) => {
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
  app.get("/api/admin/categories", async (req, res) => {
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

  app.post("/api/admin/categories", async (req, res) => {
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

  // Admin - Departments Management
  app.get("/api/admin/departments", async (req, res) => {
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
          // Update project funding (with 2% platform fee deducted)
          const projectId = metadata.projectId;
          const platformFee = callbackResult.amount * 0.02;
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
          
          await storage.createInvestment(investmentData);
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
        
        res.redirect('/dashboard?payment=success');
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
      
      // Calculate platform fee (2% for paid events)
      const eventPrice = parseFloat(event.price);
      const platformFee = eventPrice * 0.02;
      const totalAmount = eventPrice;

      // Create payment record
      const payment = await storage.createPayment({
        userId: user.id,
        amount: totalAmount,
        paymentType: 'event',
        status: 'pending',
        description: `Event Registration: ${event.title}`,
        metadata: JSON.stringify({ txnId, eventId, platformFee }),
      });

      const paymentData = {
        amount: totalAmount,
        productInfo: `Event Registration - ${event.title}`,
        firstName: user.firstName || 'User',
        email: user.email || 'user@example.com',
        txnId,
        successUrl: `${req.protocol}://${req.get('host')}/api/payments/success`,
        failureUrl: `${req.protocol}://${req.get('host')}/api/payments/failure`,
        userId: user.id,
        paymentType: 'event',
        metadata: { paymentId: payment.id, eventId },
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
      
      // Calculate platform fee (2% of service amount)
      const platformFee = amount * 0.02;
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

  const httpServer = createServer(app);
  return httpServer;
}
