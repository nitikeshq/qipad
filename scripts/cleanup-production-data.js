#!/usr/bin/env node

/**
 * Production Data Cleanup Script
 * 
 * This script removes all user-generated data while preserving system defaults
 * WARNING: This action is IRREVERSIBLE!
 * 
 * Usage: node scripts/cleanup-production-data.js
 */

const { neon } = require("@neondatabase/serverless");
require('dotenv').config();

async function cleanupProductionData() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("⚠️  PRODUCTION DATA CLEANUP");
  console.log("This will permanently delete ALL user data!");
  console.log("System defaults (categories, departments, etc.) will be preserved.");
  
  try {
    console.log("🚀 Starting cleanup process...");

    // Disable foreign key constraints temporarily
    await sql`SET session_replication_role = replica`;

    console.log("🧹 Clearing user-generated data in dependency order...");

    // Clear in dependency order to avoid foreign key conflicts
    await sql`DELETE FROM notifications`;
    console.log("✅ Cleared notifications");

    await sql`DELETE FROM post_comments`;
    console.log("✅ Cleared post_comments");

    await sql`DELETE FROM post_likes`;
    console.log("✅ Cleared post_likes");

    await sql`DELETE FROM service_purchases`;
    console.log("✅ Cleared service_purchases");

    await sql`DELETE FROM service_inquiries`;
    console.log("✅ Cleared service_inquiries");

    await sql`DELETE FROM company_products`;
    console.log("✅ Cleared company_products");

    await sql`DELETE FROM company_services`;
    console.log("✅ Cleared company_services");

    await sql`DELETE FROM wallet_transactions`;
    console.log("✅ Cleared wallet_transactions");

    await sql`DELETE FROM wallets`;
    console.log("✅ Cleared wallets");

    await sql`DELETE FROM referrals`;
    console.log("✅ Cleared referrals");

    await sql`DELETE FROM user_connections`;
    console.log("✅ Cleared user_connections");

    await sql`DELETE FROM connections`;
    console.log("✅ Cleared connections");

    await sql`DELETE FROM saved_jobs`;
    console.log("✅ Cleared saved_jobs");

    await sql`DELETE FROM job_applications`;
    console.log("✅ Cleared job_applications");

    await sql`DELETE FROM jobs`;
    console.log("✅ Cleared jobs");

    await sql`DELETE FROM project_bids`;
    console.log("✅ Cleared project_bids");

    await sql`DELETE FROM bidding_projects`;
    console.log("✅ Cleared bidding_projects");

    await sql`DELETE FROM tender_eligibility`;
    console.log("✅ Cleared tender_eligibility");

    await sql`DELETE FROM tenders`;
    console.log("✅ Cleared tenders");

    await sql`DELETE FROM community_posts`;
    console.log("✅ Cleared community_posts");

    await sql`DELETE FROM community_members`;
    console.log("✅ Cleared community_members");

    await sql`DELETE FROM communities`;
    console.log("✅ Cleared communities");

    await sql`DELETE FROM event_tickets`;
    console.log("✅ Cleared event_tickets");

    await sql`DELETE FROM event_participants`;
    console.log("✅ Cleared event_participants");

    await sql`DELETE FROM events`;
    console.log("✅ Cleared events");

    await sql`DELETE FROM user_interests`;
    console.log("✅ Cleared user_interests");

    await sql`DELETE FROM payments`;
    console.log("✅ Cleared payments");

    await sql`DELETE FROM subscriptions`;
    console.log("✅ Cleared subscriptions");

    await sql`DELETE FROM investments`;
    console.log("✅ Cleared investments");

    await sql`DELETE FROM documents`;
    console.log("✅ Cleared documents");

    await sql`DELETE FROM projects`;
    console.log("✅ Cleared projects");

    await sql`DELETE FROM company_formations`;
    console.log("✅ Cleared company_formations");

    await sql`DELETE FROM companies`;
    console.log("✅ Cleared companies");

    // Clear users last (has most dependencies)
    await sql`DELETE FROM users WHERE user_type != 'admin'`;
    console.log("✅ Cleared users (preserved admin accounts)");

    // Re-enable foreign key constraints
    await sql`SET session_replication_role = DEFAULT`;

    console.log("🎉 Production data cleanup completed successfully!");
    console.log("📊 System defaults and configuration data preserved");
    console.log("💡 Platform is ready for production launch");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    
    // Try to re-enable foreign key constraints even if cleanup failed
    try {
      await sql`SET session_replication_role = DEFAULT`;
    } catch (constraintError) {
      console.error("❌ Failed to re-enable foreign key constraints:", constraintError);
    }
    
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  cleanupProductionData();
}

module.exports = { cleanupProductionData };