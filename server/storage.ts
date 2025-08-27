import { 
  users, projects, documents, investments, communities, communityMembers, 
  communityPosts, jobs, jobApplications, connections, biddingProjects, projectBids,
  companyFormations,
  type User, type InsertUser, type Project, type InsertProject,
  type Document, type InsertDocument, type Investment, type InsertInvestment,
  type Community, type InsertCommunity, type Job, type InsertJob,
  type JobApplication, type InsertJobApplication, type Connection,
  type BiddingProject, type InsertBiddingProject, type ProjectBid, type InsertProjectBid,
  type CompanyFormation, type InsertCompanyFormation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  getApprovedProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;

  // Document methods
  getDocumentsByProject(projectId: string): Promise<Document[]>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;

  // Investment methods
  getInvestmentsByProject(projectId: string): Promise<Investment[]>;
  getInvestmentsByUser(userId: string): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment>;

  // Community methods
  getAllCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  joinCommunity(communityId: string, userId: string): Promise<void>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;

  // Job methods
  getAllJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByUser(userId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getJobApplications(jobId: string): Promise<JobApplication[]>;

  // Connection methods
  getConnections(userId: string): Promise<Connection[]>;
  createConnection(requesterId: string, recipientId: string): Promise<Connection>;
  acceptConnection(connectionId: string): Promise<Connection>;

  // Bidding project methods
  getAllBiddingProjects(): Promise<BiddingProject[]>;
  getBiddingProject(id: string): Promise<BiddingProject | undefined>;
  getBiddingProjectsByUser(userId: string): Promise<BiddingProject[]>;
  createBiddingProject(project: InsertBiddingProject): Promise<BiddingProject>;
  updateBiddingProject(id: string, updates: Partial<BiddingProject>): Promise<BiddingProject>;

  // Project bid methods
  getProjectBids(projectId: string): Promise<ProjectBid[]>;
  getBidsByUser(userId: string): Promise<ProjectBid[]>;
  createProjectBid(bid: InsertProjectBid): Promise<ProjectBid>;
  updateProjectBid(id: string, updates: Partial<ProjectBid>): Promise<ProjectBid>;

  // Stats methods
  getUserStats(userId: string): Promise<{
    activeProjects: number;
    totalFunding: string;
    investorCount: number;
    connectionCount: number;
  }>;

  // Company formations
  createCompanyFormation(formation: InsertCompanyFormation): Promise<CompanyFormation>;
  getAllCompanyFormations(): Promise<CompanyFormation[]>;
  getCompanyFormation(id: string): Promise<CompanyFormation | undefined>;
  getCompanyFormationByUser(userId: string): Promise<CompanyFormation | undefined>;
  updateCompanyFormation(id: string, formation: Partial<InsertCompanyFormation>): Promise<CompanyFormation>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllProjectsWithOwners(): Promise<any[]> {
    const projects = await db.select().from(projects);
    const projectsWithOwners = await Promise.all(
      projects.map(async (project) => {
        const owner = await this.getUser(project.userId);
        return {
          ...project,
          owner
        };
      })
    );
    return projectsWithOwners;
  }

  async getAllInvestmentsWithDetails(): Promise<any[]> {
    const investments = await db.select().from(investments);
    const investmentsWithDetails = await Promise.all(
      investments.map(async (investment) => {
        const investor = await this.getUser(investment.investorId);
        const project = await this.getProject(investment.projectId);
        return {
          ...investment,
          investor,
          project
        };
      })
    );
    return investmentsWithDetails;
  }

  // Connection management
  async createConnection(connectionData: any): Promise<any> {
    const connection = await db.insert(connections).values(connectionData).returning();
    return connection[0];
  }

  async getConnectionBetweenUsers(requesterId: string, recipientId: string, projectId?: string): Promise<any> {
    const whereConditions = and(
      eq(connections.requesterId, requesterId),
      eq(connections.recipientId, recipientId)
    );
    
    if (projectId) {
      whereConditions && eq(connections.projectId, projectId);
    }

    const [connection] = await db
      .select()
      .from(connections)
      .where(whereConditions);
    return connection;
  }

  async updateConnectionStatus(connectionId: string, status: "pending" | "accepted" | "declined"): Promise<any> {
    const [connection] = await db
      .update(connections)
      .set({ 
        status, 
        isAccepted: status === 'accepted',
        updatedAt: new Date()
      })
      .where(eq(connections.id, connectionId))
      .returning();
    return connection;
  }

  async getUserConnections(userId: string): Promise<any[]> {
    const userConnections = await db
      .select()
      .from(connections)
      .where(
        or(
          eq(connections.requesterId, userId),
          eq(connections.recipientId, userId)
        )
      );

    const connectionsWithUsers = await Promise.all(
      userConnections.map(async (connection) => {
        const otherUserId = connection.requesterId === userId 
          ? connection.recipientId 
          : connection.requesterId;
        const otherUser = await this.getUser(otherUserId);
        return {
          ...connection,
          otherUser,
          isRequester: connection.requesterId === userId
        };
      })
    );

    return connectionsWithUsers;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getApprovedProjects(): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.status, 'approved')).orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.projectId, projectId));
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async getInvestmentsByProject(projectId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.projectId, projectId));
  }

  async getInvestmentsByUser(userId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.investorId, userId));
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [newInvestment] = await db
      .insert(investments)
      .values(investment)
      .returning();
    return newInvestment;
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment> {
    const [investment] = await db
      .update(investments)
      .set(updates)
      .where(eq(investments.id, id))
      .returning();
    return investment;
  }

  async getAllCommunities(): Promise<Community[]> {
    return await db.select().from(communities).orderBy(desc(communities.createdAt));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community || undefined;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db
      .insert(communities)
      .values(community)
      .returning();
    return newCommunity;
  }

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    await db.insert(communityMembers).values({ communityId, userId });
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.isActive, true)).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobsByUser(userId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
  }



  async getAllBiddingProjects(): Promise<BiddingProject[]> {
    return await db.select().from(biddingProjects).orderBy(desc(biddingProjects.createdAt));
  }

  async getBiddingProject(id: string): Promise<BiddingProject | undefined> {
    const [project] = await db.select().from(biddingProjects).where(eq(biddingProjects.id, id));
    return project || undefined;
  }

  async getBiddingProjectsByUser(userId: string): Promise<BiddingProject[]> {
    return await db.select().from(biddingProjects).where(eq(biddingProjects.userId, userId)).orderBy(desc(biddingProjects.createdAt));
  }

  async createBiddingProject(project: InsertBiddingProject): Promise<BiddingProject> {
    const [newProject] = await db
      .insert(biddingProjects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateBiddingProject(id: string, updates: Partial<BiddingProject>): Promise<BiddingProject> {
    const [project] = await db
      .update(biddingProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(biddingProjects.id, id))
      .returning();
    return project;
  }

  async getProjectBids(projectId: string): Promise<ProjectBid[]> {
    return await db.select().from(projectBids).where(eq(projectBids.projectId, projectId)).orderBy(desc(projectBids.createdAt));
  }

  async getBidsByUser(userId: string): Promise<ProjectBid[]> {
    return await db.select().from(projectBids).where(eq(projectBids.userId, userId)).orderBy(desc(projectBids.createdAt));
  }

  async createProjectBid(bid: InsertProjectBid): Promise<ProjectBid> {
    const [newBid] = await db
      .insert(projectBids)
      .values(bid)
      .returning();
    return newBid;
  }

  async updateProjectBid(id: string, updates: Partial<ProjectBid>): Promise<ProjectBid> {
    const [bid] = await db
      .update(projectBids)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectBids.id, id))
      .returning();
    return bid;
  }

  async getUserStats(userId: string): Promise<{
    activeProjects: number;
    totalFunding: string;
    investorCount: number;
    connectionCount: number;
  }> {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    const activeProjects = userProjects.filter(p => p.status === 'active' || p.status === 'approved').length;
    
    const totalFunding = userProjects.reduce((sum, project) => {
      return sum + parseFloat(project.currentFunding || '0');
    }, 0);

    const allInvestments = await Promise.all(
      userProjects.map(project => this.getInvestmentsByProject(project.id))
    );
    const uniqueInvestors = new Set(allInvestments.flat().map(inv => inv.investorId));
    
    const userConnections = await this.getConnections(userId);

    return {
      activeProjects,
      totalFunding: totalFunding.toFixed(2),
      investorCount: uniqueInvestors.size,
      connectionCount: userConnections.length,
    };
  }

  // Company Formation methods
  async createCompanyFormation(formation: InsertCompanyFormation): Promise<CompanyFormation> {
    const [newFormation] = await db
      .insert(companyFormations)
      .values(formation)
      .returning();
    return newFormation;
  }

  async getAllCompanyFormations(): Promise<CompanyFormation[]> {
    return await db.select().from(companyFormations).orderBy(desc(companyFormations.createdAt));
  }

  async getCompanyFormation(id: string): Promise<CompanyFormation | undefined> {
    const [formation] = await db.select().from(companyFormations).where(eq(companyFormations.id, id));
    return formation || undefined;
  }

  async getCompanyFormationByUser(userId: string): Promise<CompanyFormation | undefined> {
    const [formation] = await db.select().from(companyFormations).where(eq(companyFormations.userId, userId));
    return formation || undefined;
  }

  async updateCompanyFormation(id: string, updates: Partial<InsertCompanyFormation>): Promise<CompanyFormation> {
    const [formation] = await db
      .update(companyFormations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyFormations.id, id))
      .returning();
    return formation;
  }
}

export const storage = new DatabaseStorage();
