import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userTypeEnum = pgEnum('user_type', ['business_owner', 'investor']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'pending_review', 'approved', 'rejected', 'active', 'completed']);
export const documentTypeEnum = pgEnum('document_type', ['business_pan', 'gst_certificate', 'incorporation_certificate', 'personal_pan']);
export const investmentStatusEnum = pgEnum('investment_status', ['pending', 'approved', 'rejected', 'completed']);

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
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  location: text("location"),
  salary: text("salary"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  applicantPhone: text("applicant_phone"),
  resume: text("resume"),
  coverLetter: text("cover_letter"),
  createdAt: timestamp("created_at").defaultNow(),
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
  currentStep: integer("current_step").default(1), // 1-8 process steps
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
  projectPosted: boolean("project_posted").default(false),
  governmentSchemesApplied: boolean("government_schemes_applied").default(false),
  
  // Documents and details
  incorporationCertificate: text("incorporation_certificate"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  dinNumber: text("din_number"),
  trademarkNumber: text("trademark_number"),
  bankAccountDetails: text("bank_account_details"),
  
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
