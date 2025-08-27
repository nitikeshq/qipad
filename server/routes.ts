import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertDocumentSchema, insertInvestmentSchema, insertCommunitySchema, insertJobSchema, insertJobApplicationSchema, insertBiddingProjectSchema, insertProjectBidSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// File upload configuration
const upload = multer({
  dest: 'uploads/',
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
      res.json(projects);
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
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get project", error: error.message });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: any, res) => {
    try {
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

  // Document upload routes
  app.post("/api/documents", authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
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
      res.status(400).json({ message: "Failed to upload document", error: error.message });
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

  // Investment routes
  app.post("/api/investments", authenticateToken, async (req: any, res) => {
    try {
      const investmentData = insertInvestmentSchema.parse({ 
        ...req.body, 
        investorId: req.user.userId 
      });
      
      const investment = await storage.createInvestment(investmentData);
      
      // Update project funding
      const project = await storage.getProject(investment.projectId);
      if (project) {
        const newFunding = parseFloat(project.currentFunding || '0') + parseFloat(investment.amount);
        await storage.updateProject(project.id, { currentFunding: newFunding.toString() });
      }

      res.json(investment);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create investment", error: error.message });
    }
  });

  app.get("/api/investments/my", authenticateToken, async (req: any, res) => {
    try {
      const investments = await storage.getInvestmentsByUser(req.user.userId);
      res.json(investments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get investments", error: error.message });
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
          status: 'completed',
          paymentGatewayId: paymentId 
        });
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        await storage.updateInvestment(investmentId, { status: 'failed' });
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

  app.post("/api/communities", authenticateToken, async (req: any, res) => {
    try {
      const communityData = insertCommunitySchema.parse({ 
        ...req.body, 
        creatorId: req.user.userId 
      });
      const community = await storage.createCommunity(communityData);
      
      // Auto-join creator to community
      await storage.joinCommunity(community.id, req.user.userId);
      
      res.json(community);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create community", error: error.message });
    }
  });

  app.post("/api/communities/:id/join", authenticateToken, async (req: any, res) => {
    try {
      await storage.joinCommunity(req.params.id, req.user.userId);
      res.json({ message: "Joined community successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to join community", error: error.message });
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

  // Connection routes
  app.get("/api/connections", authenticateToken, async (req: any, res) => {
    try {
      const connections = await storage.getConnections(req.user.userId);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get connections", error: error.message });
    }
  });

  app.post("/api/connections", authenticateToken, async (req: any, res) => {
    try {
      const { recipientId } = req.body;
      const connection = await storage.createConnection(req.user.userId, recipientId);
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create connection", error: error.message });
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
      if (!user || !user.isVerified) {
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

  const httpServer = createServer(app);
  return httpServer;
}
