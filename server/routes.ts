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
      if (!user || !user.isVerified) {
        return res.status(403).json({ message: "KYC verification required to create projects" });
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
      // Get investor's contact information for sharing with project owner
      const investor = await storage.getUser(req.user.userId);
      
      const investmentData = insertInvestmentSchema.parse({ 
        ...req.body, 
        investorId: req.user.userId,
        investorContact: req.body.investorPhone || investor?.phone || '',
        investorPhone: req.body.investorPhone || investor?.phone || '',
        investorEmail: investor?.email || '',
        type: "invest", // Always invest for equity-based investments
        status: "pending" // Project owner needs to approve
      });
      
      const investment = await storage.createInvestment(investmentData);

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
      const { userId } = req.body;
      const connection = await storage.createConnection(req.user.userId, userId);
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create connection", error: error.message });
    }
  });

  // Company Formation routes
  // Admin routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Admin credentials for Qipad
      if ((username === "admin" || username === "admin@qipad.com") && password === "admin123") {
        const adminToken = jwt.sign(
          { userId: "admin", isAdmin: true }, 
          JWT_SECRET, 
          { expiresIn: "24h" }
        );
        res.json({ token: adminToken });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Admin login failed", error: error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, passwordHash: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get users", error: error.message });
    }
  });

  app.get("/api/admin/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjectsWithOwners();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get projects", error: error.message });
    }
  });

  app.get("/api/admin/investments", async (req, res) => {
    try {
      const investments = await storage.getAllInvestmentsWithDetails();
      res.json(investments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get investments", error: error.message });
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

  // Admin - Communities Management
  app.get("/api/admin/communities", async (req, res) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get communities", error: error.message });
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
      // In production, save to database
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

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      // In production, delete from database
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
      // In production, save to database
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

  app.delete("/api/admin/departments/:id", async (req, res) => {
    try {
      // In production, delete from database
      res.json({ message: "Department deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete department", error: error.message });
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
      
      const connection = await storage.createConnection(connectionData);
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
