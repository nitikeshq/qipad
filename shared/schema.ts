import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userTypeEnum = pgEnum('user_type', ['business_owner', 'investor', 'individual']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'pending_review', 'approved', 'rejected', 'active', 'completed']);
export const documentTypeEnum = pgEnum('document_type', ['business_pan', 'gst_certificate', 'incorporation_certificate', 'personal_pan']);
export const investmentStatusEnum = pgEnum('investment_status', ['pending', 'approved', 'rejected', 'completed']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'trial', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const companyStatusEnum = pgEnum('company_status', ['pending', 'approved', 'rejected']);
export const connectionStatusEnum = pgEnum('connection_status', ['pending', 'accepted', 'rejected']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  userType: userTypeEnum("user_type").notNull(),
  isVerified: boolean("is_verified").default(false),
  isKycComplete: boolean("is_kyc_complete").default(false),
  profileImage: text("profile_image"),
  googleId: text("google_id"),
  passwordHash: text("password_hash"),
  status: text("status").default("active"), // active, suspended
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  briefDescription: text("brief_description"),
  industry: text("industry").notNull(),
  fundingGoal: decimal("funding_goal", { precision: 15, scale: 2 }).notNull(),
  minimumInvestment: decimal("minimum_investment", { precision: 15, scale: 2 }).notNull(),
  currentFunding: decimal("current_funding", { precision: 15, scale: 2 }).default("0"),
  campaignDuration: integer("campaign_duration").notNull(), // in days
  status: projectStatusEnum("status").default("draft"),
  images: text("images").array(),
  videos: text("videos").array(),
  businessPlan: text("business_plan"),
  marketAnalysis: text("market_analysis"),
  competitiveAdvantage: text("competitive_advantage"),
  teamInfo: text("team_info"),
  financialProjections: text("financial_projections"),
  riskAssessment: text("risk_assessment"),
  useOfFunds: text("use_of_funds"),
  exitStrategy: text("exit_strategy"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  isVerified: boolean("is_verified").default(false),
  status: text("status").default("pending"), // pending, approved, rejected
  feedback: text("feedback"), // Admin feedback on verification
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  investorId: varchar("investor_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull().default("invest"), // "invest" or "support"
  expectedStakes: decimal("expected_stakes", { precision: 5, scale: 2 }), // percentage for investments
  status: investmentStatusEnum("status").default("pending"), // pending, approved, rejected, completed
  platformFeePaid: boolean("platform_fee_paid").default(false), // Track 2% platform fee payment
  investorContact: text("investor_contact"), // shared with project owner
  investorEmail: text("investor_email"), // shared with project owner
  investorPhone: text("investor_phone"), // investor contact for owner
  message: text("message"), // investor's message to project owner
  ownerNotes: text("owner_notes"), // Notes from project owner
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // member, admin, banned
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  images: text("images").array(),
  videos: text("videos").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  salaryMin: decimal("salary_min", { precision: 15, scale: 2 }).default("0"),
  salaryMax: decimal("salary_max", { precision: 15, scale: 2 }).default("0"),
  jobType: text("job_type").notNull(), // full-time, part-time, contract, remote
  requiredSkills: text("required_skills").array(),
  requirements: text("requirements"),
  benefits: text("benefits"),
  applicationDeadline: timestamp("application_deadline"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  coverLetter: text("cover_letter"),
  resume: text("resume"),
  status: text("status").default("pending"), // pending, reviewed, accepted, rejected
  appliedAt: timestamp("applied_at").defaultNow(),
});

export const savedJobs = pgTable("saved_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id), // Optional project context
  status: varchar("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  message: text("message"),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New bidding project system
export const biddingProjects = pgTable("bidding_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  budget: decimal("budget", { precision: 15, scale: 2 }).notNull(),
  timeline: text("timeline").notNull(),
  skillsRequired: text("skills_required").array(),
  requirements: text("requirements"),
  attachments: text("attachments").array(),
  status: text("status").default("open"), // open, in_progress, completed, cancelled
  selectedBidId: varchar("selected_bid_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectBids = pgTable("project_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => biddingProjects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  timeline: text("timeline").notNull(),
  proposal: text("proposal").notNull(),
  attachments: text("attachments").array(),
  status: text("status").default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Formation Tables
export const companyFormations = pgTable("company_formations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyName: text("company_name"),
  companyType: text("company_type"), // Private Limited, Partnership, Proprietary, LLP, Public Limited
  currentStep: integer("current_step").default(1), // 1-9 process steps
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  preferredLocation: text("preferred_location"),
  businessIdea: text("business_idea"),
  estimatedCapital: decimal("estimated_capital", { precision: 15, scale: 2 }),
  
  // Step completion tracking
  companyCreated: boolean("company_created").default(false),
  dinGenerated: boolean("din_generated").default(false),
  documentsObtained: boolean("documents_obtained").default(false),
  trademarkApplied: boolean("trademark_applied").default(false),
  bankAccountCreated: boolean("bank_account_created").default(false),
  certificationsObtained: boolean("certifications_obtained").default(false),
  projectPosted: boolean("project_posted").default(false),
  governmentSchemesApplied: boolean("government_schemes_applied").default(false),
  
  // Documents and details
  incorporationCertificate: text("incorporation_certificate"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  dinNumber: text("din_number"),
  trademarkNumber: text("trademark_number"),
  bankAccountDetails: text("bank_account_details"),
  
  // Certification fields
  startupCertificate: text("startup_certificate"),
  msmeCertificate: text("msme_certificate"),
  udyamCertificate: text("udyam_certificate"),
  isoCertificate: text("iso_certificate"),
  nasscomCertificate: text("nasscom_certificate"),
  
  status: text("status").default("in_progress"), // in_progress, completed, on_hold
  assignedConsultant: varchar("assigned_consultant").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tender Management
export const tenders = pgTable("tenders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  organization: text("organization").notNull(),
  category: text("category").notNull(),
  eligibilityCriteria: text("eligibility_criteria").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  submissionDeadline: timestamp("submission_deadline").notNull(),
  openingDate: timestamp("opening_date"),
  location: text("location"),
  documentUrl: text("document_url"),
  contactDetails: text("contact_details"),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tender Eligibility Tracking
export const tenderEligibility = pgTable("tender_eligibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id").notNull().references(() => tenders.id),
  companyFormationId: varchar("company_formation_id").notNull().references(() => companyFormations.id),
  isEligible: boolean("is_eligible").notNull(),
  eligibilityScore: integer("eligibility_score"), // 0-100
  missingRequirements: text("missing_requirements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  documents: many(documents),
  investments: many(investments),
  communities: many(communities),
  communityMemberships: many(communityMembers),
  communityPosts: many(communityPosts),
  jobs: many(jobs),
  biddingProjects: many(biddingProjects),
  projectBids: many(projectBids),
  connectionsSent: many(connections, { relationName: "requester" }),
  connectionsReceived: many(connections, { relationName: "recipient" }),
  companyFormations: many(companyFormations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  documents: many(documents),
  investments: many(investments),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  project: one(projects, {
    fields: [investments.projectId],
    references: [projects.id],
  }),
  investor: one(users, {
    fields: [investments.investorId],
    references: [users.id],
  }),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, {
    fields: [communities.creatorId],
    references: [users.id],
  }),
  members: many(communityMembers),
  posts: many(communityPosts),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  community: one(communities, {
    fields: [communityPosts.communityId],
    references: [communities.id],
  }),
  author: one(users, {
    fields: [communityPosts.authorId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, {
    fields: [jobApplications.jobId],
    references: [jobs.id],
  }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  requester: one(users, {
    fields: [connections.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  recipient: one(users, {
    fields: [connections.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const biddingProjectsRelations = relations(biddingProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [biddingProjects.userId],
    references: [users.id],
  }),
  bids: many(projectBids),
}));

export const projectBidsRelations = relations(projectBids, ({ one }) => ({
  project: one(biddingProjects, {
    fields: [projectBids.projectId],
    references: [biddingProjects.id],
  }),
  user: one(users, {
    fields: [projectBids.userId],
    references: [users.id],
  }),
}));

export const companyFormationsRelations = relations(companyFormations, ({ one, many }) => ({
  user: one(users, {
    fields: [companyFormations.userId],
    references: [users.id],
  }),
  consultant: one(users, {
    fields: [companyFormations.assignedConsultant],
    references: [users.id],
  }),
  tenderEligibilities: many(tenderEligibility),
}));

export const tendersRelations = relations(tenders, ({ many }) => ({
  eligibilities: many(tenderEligibility),
}));

export const tenderEligibilityRelations = relations(tenderEligibility, ({ one }) => ({
  tender: one(tenders, {
    fields: [tenderEligibility.tenderId],
    references: [tenders.id],
  }),
  companyFormation: one(companyFormations, {
    fields: [tenderEligibility.companyFormationId],
    references: [companyFormations.id],
  }),
}));

// Companies Table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry").notNull(),
  website: text("website"),
  logo: text("logo"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  gstNumber: text("gst_number"),
  cinNumber: text("cin_number"),
  panNumber: text("pan_number"),
  status: companyStatusEnum("status").default("pending"),
  employeeCount: integer("employee_count"),
  foundedYear: integer("founded_year"),
  revenue: decimal("revenue", { precision: 15, scale: 2 }),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions Table for Billing
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planType: text("plan_type").notNull().default("beta"), // beta, monthly, annual
  status: subscriptionStatusEnum("status").default("trial"),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("INR"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at").default(sql`now() + interval '6 months'`),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments Table for PayUMoney integration
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  projectId: varchar("project_id").references(() => projects.id),
  companyId: varchar("company_id").references(() => companies.id),
  biddingId: varchar("bidding_id").references(() => projectBids.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("INR"),
  paymentType: text("payment_type").notNull(), // subscription, support, investment, company_creation, bidding_fee
  status: paymentStatusEnum("status").default("pending"),
  payumoneyTransactionId: text("payumoney_transaction_id"),
  payumoneyStatus: text("payumoney_status"),
  paymentMethod: text("payment_method"),
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for new tables
export const companiesRelations = relations(companies, ({ one }) => ({
  owner: one(users, {
    fields: [companies.ownerId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  currentFunding: true,
  status: true,
  isKycComplete: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  isVerified: true,
  createdAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  status: true,
  platformFeePaid: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
});

export const insertBiddingProjectSchema = createInsertSchema(biddingProjects).omit({
  id: true,
  status: true,
  selectedBidId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectBidSchema = createInsertSchema(projectBids).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyFormationSchema = createInsertSchema(companyFormations).omit({
  id: true,
  currentStep: true,
  companyCreated: true,
  dinGenerated: true,
  documentsObtained: true,
  trademarkApplied: true,
  bankAccountCreated: true,
  projectPosted: true,
  governmentSchemesApplied: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenderEligibilitySchema = createInsertSchema(tenderEligibility).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Community = typeof communities.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type Connection = typeof connections.$inferSelect;
export type BiddingProject = typeof biddingProjects.$inferSelect;
export type InsertBiddingProject = z.infer<typeof insertBiddingProjectSchema>;
export type ProjectBid = typeof projectBids.$inferSelect;
export type InsertProjectBid = z.infer<typeof insertProjectBidSchema>;
export type CompanyFormation = typeof companyFormations.$inferSelect;
export type InsertCompanyFormation = z.infer<typeof insertCompanyFormationSchema>;
export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type TenderEligibility = typeof tenderEligibility.$inferSelect;
export type InsertTenderEligibility = z.infer<typeof insertTenderEligibilitySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
