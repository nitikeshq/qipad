import { 
  users, projects, documents, investments, communities, communityMembers, 
  communityPosts, postLikes, postComments, jobs, jobApplications, savedJobs, connections, biddingProjects, projectBids,
  companyFormations, tenders, tenderEligibility, companies, subscriptions, payments, userInterests,
  events, eventParticipants, eventTickets, companyServices, companyProducts, serviceInquiries, servicePurchases,
  mediaContent, platformSettings, notifications, wallets, walletTransactions, referrals,
  type User, type InsertUser, type Project, type InsertProject,
  type Document, type InsertDocument, type Investment, type InsertInvestment,
  type Community, type InsertCommunity, type CommunityMember, type InsertCommunityMember,
  type CommunityPost, type InsertCommunityPost, type PostLike, type InsertPostLike,
  type PostComment, type InsertPostComment, type Job, type InsertJob,
  type JobApplication, type InsertJobApplication, type Connection,
  type BiddingProject, type InsertBiddingProject, type ProjectBid, type InsertProjectBid,
  type CompanyFormation, type InsertCompanyFormation, type Tender, type InsertTender,
  type TenderEligibility, type InsertTenderEligibility, type Company, type InsertCompany,
  type Subscription, type InsertSubscription, type Payment, type InsertPayment,
  type UserInterest, type InsertUserInterest,
  type Event, type InsertEvent, type EventParticipant, type InsertEventParticipant,
  type EventTicket, type InsertEventTicket, type CompanyService, type InsertCompanyService,
  type CompanyProduct, type InsertCompanyProduct, type ServiceInquiry, type InsertServiceInquiry,
  type ServicePurchase, type InsertServicePurchase, type Notification, type InsertNotification,
  type Wallet, type InsertWallet, type WalletTransaction, type InsertWalletTransaction,
  type Referral, type InsertReferral
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, ne } from "drizzle-orm";

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
  getAllDocuments(): Promise<Document[]>;
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
  getCommunityMembers(communityId: string): Promise<any[]>;
  updateMemberRole(communityId: string, userId: string, role: string): Promise<void>;
  getCommunityPosts(communityId: string): Promise<any[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  isUserMember(communityId: string, userId: string): Promise<boolean>;
  togglePostLike(postId: string, userId: string): Promise<{ liked: boolean }>;
  createPostComment(data: { postId: string; userId: string; content: string }): Promise<PostComment>;

  // Job methods
  getAllJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByUser(userId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getJobApplications(jobId: string): Promise<JobApplication[]>;
  getUserJobApplication(userId: string, jobId: string): Promise<JobApplication | undefined>;
  getUserJobApplications(userId: string): Promise<JobApplication[]>;
  createSavedJob(savedJob: any): Promise<any>;
  getUserSavedJob(userId: string, jobId: string): Promise<any>;
  getUserSavedJobs(userId: string): Promise<any[]>;

  // Events methods
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByUser(userId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  joinEvent(eventId: string, userId: string): Promise<void>;
  getEventParticipants(eventId: string): Promise<EventParticipant[]>;
  isUserParticipant(eventId: string, userId: string): Promise<boolean>;
  createEventTicket(ticket: InsertEventTicket): Promise<EventTicket>;
  getUserEventTicket(eventId: string, userId: string): Promise<EventTicket | undefined>;

  // Connection methods
  getConnections(userId: string): Promise<Connection[]>;
  getUserConnections(userId: string): Promise<any[]>;
  createConnection(requesterId: string, recipientId: string): Promise<Connection>;
  acceptConnection(connectionId: string): Promise<Connection>;
  getConnectionBetweenUsers(requesterId: string, recipientId: string, projectId?: string): Promise<any>;
  updateConnectionStatus(connectionId: string, status: string): Promise<any>;
  
  // Community membership methods
  getUserCommunityMemberships(userId: string): Promise<any[]>;

  // Notification methods
  getUserNotifications(userId: string): Promise<any[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

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

  // Tender management
  createTender(tender: InsertTender): Promise<Tender>;
  getAllTenders(): Promise<Tender[]>;
  getTender(id: string): Promise<Tender | undefined>;
  updateTender(id: string, updates: Partial<Tender>): Promise<Tender>;
  deleteTender(id: string): Promise<void>;

  // Company methods
  getAllCompanies(): Promise<Company[]>;
  getCompanyById(id: string): Promise<Company | undefined>;
  getCompaniesByOwner(ownerId: string): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company>;

  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: string, status: string): Promise<Subscription>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: string): Promise<Payment[]>;
  updatePaymentStatus(txnId: string, status: string, payumoneyId?: string): Promise<Payment>;
  updateProjectFunding(projectId: string, amount: number): Promise<void>;

  // Company Services and Products methods
  getCompanyServices(companyId: string): Promise<CompanyService[]>;
  getAllCompanyServices(): Promise<CompanyService[]>;
  createCompanyService(service: InsertCompanyService): Promise<CompanyService>;
  updateCompanyService(id: string, updates: Partial<CompanyService>): Promise<CompanyService>;
  deleteCompanyService(id: string): Promise<void>;

  getCompanyProducts(companyId: string): Promise<CompanyProduct[]>;
  getAllCompanyProducts(): Promise<CompanyProduct[]>;
  createCompanyProduct(product: InsertCompanyProduct): Promise<CompanyProduct>;
  updateCompanyProduct(id: string, updates: Partial<CompanyProduct>): Promise<CompanyProduct>;
  deleteCompanyProduct(id: string): Promise<void>;

  // Service Inquiry methods
  createServiceInquiry(inquiry: InsertServiceInquiry): Promise<ServiceInquiry>;
  getServiceInquiries(companyId: string): Promise<ServiceInquiry[]>;
  getUserServiceInquiries(userId: string): Promise<ServiceInquiry[]>;
  updateServiceInquiry(id: string, updates: Partial<ServiceInquiry>): Promise<ServiceInquiry>;

  // Service Purchase methods
  createServicePurchase(purchase: InsertServicePurchase): Promise<ServicePurchase>;
  getServicePurchases(companyId: string): Promise<ServicePurchase[]>;
  getUserServicePurchases(userId: string): Promise<ServicePurchase[]>;

  // Media Content methods
  getAllMediaContent(): Promise<any[]>;
  getMediaContent(id: string): Promise<any | undefined>;
  createMediaContent(mediaContent: any): Promise<any>;
  updateMediaContent(id: string, updates: any): Promise<any>;
  deleteMediaContent(id: string): Promise<void>;

  // Platform Settings methods
  getPlatformSetting(key: string): Promise<any | undefined>;
  getAllPlatformSettings(): Promise<any[]>;
  setPlatformSetting(key: string, value: string, description?: string, category?: string, updatedBy?: string): Promise<any>;
  updatePlatformSetting(key: string, value: string, updatedBy?: string): Promise<any>;
  deletePlatformSetting(key: string): Promise<void>;

  // Wallet methods
  getWalletByUserId(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, newBalance: string): Promise<Wallet>;
  
  // Wallet Transaction methods
  getWalletTransactions(userId: string, limit?: number): Promise<WalletTransaction[]>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  
  // Referral methods
  getReferralsByUser(userId: string): Promise<Referral[]>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral>;
  
  // Credit operations
  deductCredits(userId: string, amount: number, description: string, referenceType?: string, referenceId?: string): Promise<{ success: boolean; newBalance: number; error?: string }>;
  addCredits(userId: string, amount: number, description: string, referenceType?: string, referenceId?: string): Promise<{ success: boolean; newBalance: number; error?: string }>;
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
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getAllProjectsWithOwners(): Promise<any[]> {
    const allProjects = await this.getAllProjects();
    const projectsWithOwners = await Promise.all(
      allProjects.map(async (project) => {
        const owner = await this.getUser(project.userId);
        return {
          ...project,
          owner
        };
      })
    );
    return projectsWithOwners;
  }

  async updateProject(id: string, updateData: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async updateInvestment(id: string, updateData: Partial<Investment>): Promise<Investment> {
    const [updatedInvestment] = await db
      .update(investments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return updatedInvestment;
  }

  async deleteInvestment(id: string): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }

  async updateCompanyFormation(id: string, updateData: Partial<any>): Promise<any> {
    const [updatedFormation] = await db
      .update(companyFormations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(companyFormations.id, id))
      .returning();
    return updatedFormation;
  }

  async deleteCompanyFormation(id: string): Promise<void> {
    await db.delete(companyFormations).where(eq(companyFormations.id, id));
  }

  async getAllInvestmentsWithDetails(): Promise<any[]> {
    const allInvestments = await db.select().from(investments);
    const investmentsWithDetails = await Promise.all(
      allInvestments.map(async (investment) => {
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

  async getConnections(userId: string): Promise<Connection[]> {
    return await db.select().from(connections).where(
      or(eq(connections.requesterId, userId), eq(connections.recipientId, userId))
    );
  }

  async getUserConnections(userId: string): Promise<any[]> {
    return await db.select().from(connections).where(
      or(eq(connections.requesterId, userId), eq(connections.recipientId, userId))
    );
  }

  async getUserCommunityMemberships(userId: string): Promise<any[]> {
    return await db.select({
      id: communityMembers.id,
      communityId: communityMembers.communityId,
      userId: communityMembers.userId,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
      communityName: communities.name,
      communityDescription: communities.description
    })
    .from(communityMembers)
    .leftJoin(communities, eq(communityMembers.communityId, communities.id))
    .where(eq(communityMembers.userId, userId));
  }

  // Notification methods
  async getUserNotifications(userId: string): Promise<any[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }



  async acceptConnection(connectionId: string): Promise<Connection> {
    const [connection] = await db.update(connections)
      .set({ status: 'accepted' })
      .where(eq(connections.id, connectionId))
      .returning();
    return connection;
  }

  // Connection management
  async createConnection(requesterId: string, recipientId: string): Promise<Connection> {
    const [connection] = await db.insert(connections).values({
      requesterId,
      recipientId,
      status: 'pending'
    }).returning();
    return connection;
  }

  async getConnectionBetweenUsers(requesterId: string, recipientId: string, projectId?: string): Promise<any> {
    let whereCondition = and(
      eq(connections.requesterId, requesterId),
      eq(connections.recipientId, recipientId)
    );
    
    if (projectId) {
      whereCondition = and(whereCondition!, eq(connections.projectId, projectId));
    }

    const [connection] = await db
      .select()
      .from(connections)
      .where(whereCondition!);

    return connection;
  }

  async updateConnectionStatus(connectionId: string, status: string): Promise<any> {
    const [connection] = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, connectionId))
      .returning();
    return connection;
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
    try {
      const communitiesList = await db.select().from(communities).orderBy(desc(communities.createdAt));
      
      // Add member count for each community
      const communitiesWithCounts = await Promise.all(
        communitiesList.map(async (community) => {
          try {
            const members = await this.getCommunityMembers(community.id);
            return {
              ...community,
              memberCount: members.length
            };
          } catch (error) {
            console.error(`Error getting members for community ${community.id}:`, error);
            return {
              ...community,
              memberCount: 0
            };
          }
        })
      );
      
      return communitiesWithCounts;
    } catch (error) {
      console.error('Error in getAllCommunities:', error);
      throw error;
    }
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community || undefined;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db
      .insert(communities)
      .values({
        ...community,
        category: community.category || 'general'
      })
      .returning();
    return newCommunity;
  }

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    await db.insert(communityMembers).values({ communityId, userId, role: "member" });
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  }

  async getCommunityMembers(communityId: string): Promise<any[]> {
    return await db.select({
      id: communityMembers.id,
      userId: communityMembers.userId,
      role: communityMembers.role,
      joinedAt: communityMembers.joinedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImage: users.profileImage
    })
    .from(communityMembers)
    .leftJoin(users, eq(communityMembers.userId, users.id))
    .where(eq(communityMembers.communityId, communityId));
  }

  async updateMemberRole(communityId: string, userId: string, role: string): Promise<void> {
    await db.update(communityMembers)
      .set({ role })
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  }

  async getCommunityPosts(communityId: string, userId?: string): Promise<any[]> {
    const posts = await db.select({
      id: communityPosts.id,
      content: communityPosts.content,
      images: communityPosts.images,
      videos: communityPosts.videos,
      createdAt: communityPosts.createdAt,
      authorId: communityPosts.authorId,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorProfileImage: users.profileImage
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.communityId, communityId))
    .orderBy(desc(communityPosts.createdAt));

    return posts;
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db.insert(communityPosts).values(post).returning();
    return newPost;
  }

  async isUserMember(communityId: string, userId: string): Promise<boolean> {
    const [member] = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId), 
        eq(communityMembers.userId, userId),
        ne(communityMembers.role, "banned")
      ));
    return !!member;
  }

  async getAllJobs(): Promise<any[]> {
    return await db
      .select({
        id: jobs.id,
        userId: jobs.userId,
        title: jobs.title,
        description: jobs.description,
        company: jobs.company,
        location: jobs.location,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        jobType: jobs.jobType,
        requiredSkills: jobs.requiredSkills,
        requirements: jobs.requirements,
        benefits: jobs.benefits,
        applicationDeadline: jobs.applicationDeadline,
        isActive: jobs.isActive,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.userId, users.id))
      .where(eq(jobs.isActive, true))
      .orderBy(desc(jobs.createdAt));
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

  async getUserJobApplication(userId: string, jobId: string): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(and(eq(jobApplications.userId, userId), eq(jobApplications.jobId, jobId)));
    return application;
  }

  async getUserJobApplications(userId: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async createSavedJob(savedJob: any): Promise<any> {
    const [saved] = await db.insert(savedJobs).values(savedJob).returning();
    return saved;
  }

  async getUserSavedJob(userId: string, jobId: string): Promise<any> {
    const [saved] = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));
    return saved;
  }

  async getUserSavedJobs(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(savedJobs)
      .where(eq(savedJobs.userId, userId))
      .orderBy(desc(savedJobs.savedAt));
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
      totalFunding: `₹${totalFunding.toLocaleString('en-IN')}`,
      investorCount: uniqueInvestors.size,
      connectionCount: userConnections.length,
    };
  }

  async getUserInvestmentStats(userId: string): Promise<any> {
    const userInvestments = await this.getInvestmentsByUser(userId);
    
    const totalInvested = userInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const activeInvestments = userInvestments.filter(inv => inv.status === 'pending' || inv.status === 'approved').length;
    const uniqueProjects = new Set(userInvestments.map(inv => inv.projectId)).size;
    
    // Calculate total equity stakes for "invest" type investments
    const totalStakes = userInvestments
      .filter(inv => inv.type === 'invest' && inv.expectedStakes)
      .reduce((sum, inv) => sum + parseFloat(inv.expectedStakes || '0'), 0);
    
    const investmentTypes = userInvestments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + 1;
      return acc;
    }, {} as any);

    return {
      totalInvested: `₹${totalInvested.toLocaleString('en-IN')}`,
      activeInvestments,
      uniqueProjects,
      totalStakes: totalStakes.toFixed(1), // Total equity percentage owned
      totalTransactions: userInvestments.length,
      investmentTypes,
      averageInvestment: userInvestments.length > 0 ? `₹${(totalInvested / userInvestments.length).toLocaleString('en-IN')}` : '₹0',
      lastInvestment: userInvestments[0]?.createdAt || null
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
    // Convert date strings to Date objects for timestamp fields
    const processedUpdates = { ...updates };
    
    // Handle timestamp fields that might come as strings
    const timestampFields = ['incorporationDate', 'gstRegistrationDate', 'bankAccountOpenDate'];
    timestampFields.forEach(field => {
      if (processedUpdates[field] && typeof processedUpdates[field] === 'string') {
        processedUpdates[field] = new Date(processedUpdates[field]);
      }
    });

    const [formation] = await db
      .update(companyFormations)
      .set({ ...processedUpdates, updatedAt: new Date() })
      .where(eq(companyFormations.id, id))
      .returning();
    return formation;
  }

  // Tender management methods
  async createTender(tender: InsertTender): Promise<Tender> {
    const [newTender] = await db.insert(tenders).values(tender).returning();
    return newTender;
  }

  async getAllTenders(): Promise<Tender[]> {
    return await db.select().from(tenders).orderBy(desc(tenders.createdAt));
  }

  async getTender(id: string): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    return tender || undefined;
  }

  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender> {
    const [tender] = await db
      .update(tenders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenders.id, id))
      .returning();
    return tender;
  }

  async deleteTender(id: string): Promise<void> {
    await db.delete(tenders).where(eq(tenders.id, id));
  }

  async deleteCompanyFormation(id: string): Promise<void> {
    await db.delete(companyFormations).where(eq(companyFormations.id, id));
  }

  // Company methods
  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompaniesByOwner(ownerId: string): Promise<Company[]> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, ownerId))
      .orderBy(desc(companies.createdAt));
    return result;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  // Media Content methods
  async getAllMediaContent(): Promise<any[]> {
    const result = await db
      .select()
      .from(mediaContent)
      .where(eq(mediaContent.isActive, true))
      .orderBy(desc(mediaContent.createdAt));
    return result;
  }

  async getMediaContent(id: string): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(mediaContent)
      .where(eq(mediaContent.id, id));
    return result || undefined;
  }

  async createMediaContent(insertMediaContent: any): Promise<any> {
    const [result] = await db
      .insert(mediaContent)
      .values(insertMediaContent)
      .returning();
    return result;
  }

  async updateMediaContent(id: string, updates: any): Promise<any> {
    const [result] = await db
      .update(mediaContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaContent.id, id))
      .returning();
    return result;
  }

  async deleteMediaContent(id: string): Promise<void> {
    await db
      .update(mediaContent)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(mediaContent.id, id));
  }

  // Platform Settings methods
  async getPlatformSetting(key: string): Promise<any | undefined> {
    const [setting] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, key));
    return setting || undefined;
  }

  async getAllPlatformSettings(): Promise<any[]> {
    const result = await db
      .select()
      .from(platformSettings)
      .orderBy(platformSettings.category, platformSettings.key);
    return result;
  }

  async setPlatformSetting(key: string, value: string, description?: string, category?: string, updatedBy?: string): Promise<any> {
    const [setting] = await db
      .insert(platformSettings)
      .values({
        key,
        value,
        description,
        category: category || "general",
        updatedBy
      })
      .returning();
    return setting;
  }

  async updatePlatformSetting(key: string, value: string, updatedBy?: string): Promise<any> {
    const [setting] = await db
      .update(platformSettings)
      .set({ value, updatedBy, updatedAt: new Date() })
      .where(eq(platformSettings.key, key))
      .returning();
    return setting;
  }

  async deletePlatformSetting(key: string): Promise<void> {
    await db
      .delete(platformSettings)
      .where(eq(platformSettings.key, key));
  }

  // Credit Configuration methods
  async getAllCreditConfigs(): Promise<any[]> {
    const { creditConfigurations } = await import("@shared/schema");
    const result = await db
      .select()
      .from(creditConfigurations)
      .orderBy(creditConfigurations.featureType);
    return result;
  }

  async createCreditConfig(data: any): Promise<any> {
    const { creditConfigurations, insertCreditConfigSchema } = await import("@shared/schema");
    const configData = insertCreditConfigSchema.parse(data);
    const [config] = await db
      .insert(creditConfigurations)
      .values(configData)
      .returning();
    return config;
  }

  async updateCreditConfig(id: string, data: any): Promise<any> {
    const { creditConfigurations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const [config] = await db
      .update(creditConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(creditConfigurations.id, id))
      .returning();
    return config;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async updateSubscriptionStatus(id: string, status: string): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  // Payment methods
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(txnId: string, status: string, payumoneyId?: string): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ 
        status, 
        payumoneyTransactionId: payumoneyId,
        updatedAt: new Date() 
      })
      .where(eq(payments.payumoneyTransactionId, txnId))
      .returning();
    return payment;
  }

  async updateProjectFunding(projectId: string, amount: number): Promise<void> {
    await db
      .update(projects)
      .set({ 
        currentFunding: sql`COALESCE(${projects.currentFunding}, 0) + ${amount}`,
        updatedAt: new Date() 
      })
      .where(eq(projects.id, projectId));
  }

  // USER INTERESTS METHODS
  async createUserInterest(data: InsertUserInterest): Promise<UserInterest> {
    const [interest] = await db.insert(userInterests).values(data).returning();
    return interest;
  }

  async getUserInterests(userId: string): Promise<UserInterest[]> {
    return await db.select().from(userInterests).where(eq(userInterests.userId, userId));
  }

  async updateUserInterest(id: string, data: Partial<InsertUserInterest>): Promise<UserInterest | undefined> {
    const [interest] = await db
      .update(userInterests)
      .set(data)
      .where(eq(userInterests.id, id))
      .returning();
    return interest;
  }

  async deleteUserInterest(id: string): Promise<void> {
    await db.delete(userInterests).where(eq(userInterests.id, id));
  }

  // Events methods
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByUser(userId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.creatorId, userId)).orderBy(desc(events.createdAt));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const [updatedEvent] = await db.update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async joinEvent(eventId: string, userId: string): Promise<void> {
    await db.insert(eventParticipants).values({
      eventId,
      userId,
      paymentStatus: "completed", // For free events
    });

    // Update participant count
    await db.update(events)
      .set({ 
        currentParticipants: sql`COALESCE(current_participants, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));
  }

  async getEventParticipants(eventId: string): Promise<EventParticipant[]> {
    return await db.select().from(eventParticipants).where(eq(eventParticipants.eventId, eventId));
  }

  async isUserParticipant(eventId: string, userId: string): Promise<boolean> {
    const [participant] = await db.select()
      .from(eventParticipants)
      .where(and(eq(eventParticipants.eventId, eventId), eq(eventParticipants.userId, userId)));
    return !!participant;
  }

  async createEventTicket(ticket: InsertEventTicket): Promise<EventTicket> {
    const [newTicket] = await db.insert(eventTickets).values(ticket).returning();
    return newTicket;
  }

  async getUserEventTicket(eventId: string, userId: string): Promise<EventTicket | undefined> {
    const [participant] = await db.select()
      .from(eventParticipants)
      .where(and(eq(eventParticipants.eventId, eventId), eq(eventParticipants.userId, userId)));
    
    if (!participant || !participant.ticketId) return undefined;

    const [ticket] = await db.select()
      .from(eventTickets)
      .where(eq(eventTickets.id, participant.ticketId));
    
    return ticket || undefined;
  }
  // Post likes and comments methods
  async togglePostLike(postId: string, userId: string): Promise<{ liked: boolean }> {
    // Check if user already liked the post
    const existingLike = await db.select().from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    if (existingLike.length > 0) {
      // Unlike the post
      await db.delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      
      // Update likes count
      await db.update(communityPosts)
        .set({ likesCount: sql`COALESCE(${communityPosts.likesCount}, 0) - 1` })
        .where(eq(communityPosts.id, postId));
      
      return { liked: false };
    } else {
      // Like the post
      await db.insert(postLikes).values({
        postId,
        userId
      });
      
      // Update likes count
      await db.update(communityPosts)
        .set({ likesCount: sql`COALESCE(${communityPosts.likesCount}, 0) + 1` })
        .where(eq(communityPosts.id, postId));
      
      return { liked: true };
    }
  }

  async createPostComment(data: { postId: string; userId: string; content: string }): Promise<PostComment> {
    // Create comment
    const [comment] = await db.insert(postComments).values(data).returning();
    
    // Update comments count
    await db.update(communityPosts)
      .set({ commentsCount: sql`COALESCE(${communityPosts.commentsCount}, 0) + 1` })
      .where(eq(communityPosts.id, data.postId));
    
    return comment;
  }

  // Company Services methods
  async getCompanyServices(companyId: string): Promise<CompanyService[]> {
    return await db.select().from(companyServices)
      .where(eq(companyServices.companyId, companyId))
      .orderBy(desc(companyServices.createdAt));
  }

  async getAllCompanyServices(): Promise<CompanyService[]> {
    return await db.select().from(companyServices)
      .where(eq(companyServices.isActive, true))
      .orderBy(desc(companyServices.createdAt));
  }

  async createCompanyService(service: InsertCompanyService): Promise<CompanyService> {
    const [newService] = await db.insert(companyServices).values(service).returning();
    return newService;
  }

  async updateCompanyService(id: string, updates: Partial<CompanyService>): Promise<CompanyService> {
    const [updatedService] = await db
      .update(companyServices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyServices.id, id))
      .returning();
    return updatedService;
  }

  async deleteCompanyService(id: string): Promise<void> {
    await db.delete(companyServices).where(eq(companyServices.id, id));
  }

  // Company Products methods
  async getCompanyProducts(companyId: string): Promise<CompanyProduct[]> {
    return await db.select().from(companyProducts)
      .where(eq(companyProducts.companyId, companyId))
      .orderBy(desc(companyProducts.createdAt));
  }

  async getAllCompanyProducts(): Promise<CompanyProduct[]> {
    return await db.select().from(companyProducts)
      .where(eq(companyProducts.isActive, true))
      .orderBy(desc(companyProducts.createdAt));
  }

  async createCompanyProduct(product: InsertCompanyProduct): Promise<CompanyProduct> {
    const [newProduct] = await db.insert(companyProducts).values(product).returning();
    return newProduct;
  }

  async updateCompanyProduct(id: string, updates: Partial<CompanyProduct>): Promise<CompanyProduct> {
    const [updatedProduct] = await db
      .update(companyProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteCompanyProduct(id: string): Promise<void> {
    await db.delete(companyProducts).where(eq(companyProducts.id, id));
  }

  // Service Inquiry methods
  async createServiceInquiry(inquiry: InsertServiceInquiry): Promise<ServiceInquiry> {
    const [newInquiry] = await db.insert(serviceInquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getServiceInquiries(companyId: string): Promise<ServiceInquiry[]> {
    return await db.select().from(serviceInquiries)
      .where(eq(serviceInquiries.companyId, companyId))
      .orderBy(desc(serviceInquiries.createdAt));
  }

  async getUserServiceInquiries(userId: string): Promise<ServiceInquiry[]> {
    return await db.select().from(serviceInquiries)
      .where(eq(serviceInquiries.inquirerUserId, userId))
      .orderBy(desc(serviceInquiries.createdAt));
  }

  async updateServiceInquiry(id: string, updates: Partial<ServiceInquiry>): Promise<ServiceInquiry> {
    const [updatedInquiry] = await db
      .update(serviceInquiries)
      .set(updates)
      .where(eq(serviceInquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  // Service Purchase methods
  async createServicePurchase(purchase: InsertServicePurchase): Promise<ServicePurchase> {
    const [newPurchase] = await db.insert(servicePurchases).values(purchase).returning();
    return newPurchase;
  }

  async getServicePurchases(companyId: string): Promise<ServicePurchase[]> {
    return await db.select().from(servicePurchases)
      .where(eq(servicePurchases.companyId, companyId))
      .orderBy(desc(servicePurchases.createdAt));
  }

  async getUserServicePurchases(userId: string): Promise<ServicePurchase[]> {
    return await db.select().from(servicePurchases)
      .where(eq(servicePurchases.customerId, userId))
      .orderBy(desc(servicePurchases.createdAt));
  }

  // Payment and Subscription methods for analytics
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  // Wallet methods implementation
  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(userId: string, newBalance: string): Promise<Wallet> {
    const [updatedWallet] = await db
      .update(wallets)
      .set({ 
        balance: newBalance, 
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId))
      .returning();
    return updatedWallet;
  }

  // Wallet Transaction methods implementation
  async getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    return await db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await db.insert(walletTransactions).values(transaction).returning();
    return newTransaction;
  }

  // Referral methods implementation
  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, code));
    return referral;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral> {
    const [updatedReferral] = await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id))
      .returning();
    return updatedReferral;
  }

  // Credit operations implementation
  async deductCredits(userId: string, amount: number, description: string, referenceType?: string, referenceId?: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      // Get current wallet
      let wallet = await this.getWalletByUserId(userId);
      
      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await this.createWallet({ userId, balance: "0" });
      }

      const currentBalance = parseFloat(wallet.balance);
      
      // Check if sufficient balance
      if (currentBalance < amount) {
        return {
          success: false,
          newBalance: currentBalance,
          error: "Insufficient credits"
        };
      }

      const newBalance = currentBalance - amount;
      const newBalanceStr = newBalance.toFixed(2);

      // Update wallet balance
      await this.updateWalletBalance(userId, newBalanceStr);

      // Create transaction record
      await this.createWalletTransaction({
        userId,
        type: "spend",
        amount: amount.toFixed(2),
        balanceBefore: wallet.balance,
        balanceAfter: newBalanceStr,
        description,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        status: "completed"
      });

      // Update wallet totalSpent
      await db
        .update(wallets)
        .set({ 
          totalSpent: sql`${wallets.totalSpent} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, userId));

      return {
        success: true,
        newBalance
      };
    } catch (error) {
      console.error("Failed to deduct credits:", error);
      return {
        success: false,
        newBalance: 0,
        error: "Transaction failed"
      };
    }
  }

  async addCredits(userId: string, amount: number, description: string, referenceType?: string, referenceId?: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      // Get current wallet
      let wallet = await this.getWalletByUserId(userId);
      
      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await this.createWallet({ userId, balance: "0" });
      }

      const currentBalance = parseFloat(wallet.balance);
      const newBalance = currentBalance + amount;
      const newBalanceStr = newBalance.toFixed(2);

      // Update wallet balance
      await this.updateWalletBalance(userId, newBalanceStr);

      // Create transaction record
      await this.createWalletTransaction({
        userId,
        type: referenceType === "referral_bonus" ? "referral_bonus" : referenceType === "deposit" ? "deposit" : "earn",
        amount: amount.toFixed(2),
        balanceBefore: wallet.balance,
        balanceAfter: newBalanceStr,
        description,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        status: "completed"
      });

      // Update wallet totalEarned for non-deposit transactions
      if (referenceType !== "deposit") {
        await db
          .update(wallets)
          .set({ 
            totalEarned: sql`${wallets.totalEarned} + ${amount}`,
            updatedAt: new Date()
          })
          .where(eq(wallets.userId, userId));
      }

      return {
        success: true,
        newBalance
      };
    } catch (error) {
      console.error("Failed to add credits:", error);
      return {
        success: false,
        newBalance: 0,
        error: "Transaction failed"
      };
    }
  }
}

export const storage = new DatabaseStorage();
