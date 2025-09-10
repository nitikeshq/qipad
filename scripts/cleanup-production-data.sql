-- Production Data Cleanup Script
-- This script removes all user-generated data while preserving system defaults
-- WARNING: This action is IRREVERSIBLE!

-- Disable foreign key constraints temporarily to avoid dependency issues
SET session_replication_role = replica;

-- Clear user-generated data in dependency order
DELETE FROM credit_transactions;
DELETE FROM wallet_transactions;
DELETE FROM wallets;
DELETE FROM referrals;
DELETE FROM user_connections;
DELETE FROM community_posts;
DELETE FROM community_members;
DELETE FROM communities;
DELETE FROM job_applications;
DELETE FROM jobs;
DELETE FROM event_participants;
DELETE FROM events;
DELETE FROM investments;
DELETE FROM documents;
DELETE FROM projects;
DELETE FROM company_formations;
DELETE FROM companies;
DELETE FROM users;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Reset auto-increment sequences if any exist
-- Note: Most tables use UUIDs, but if any use sequences, reset them here
-- ALTER SEQUENCE IF EXISTS some_sequence_name RESTART WITH 1;

-- Keep system defaults like:
-- - categories
-- - departments  
-- - configuration tables
-- - admin users (if any system defaults exist)

SELECT 'Production data cleanup completed successfully' as result;