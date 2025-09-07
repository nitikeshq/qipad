-- Database changes for Qipad platform
-- Run these SQL commands on your local database

-- Create media_content table for admin-managed media center
CREATE TABLE IF NOT EXISTS media_content (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- press_release, video, document, image
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  published_date TIMESTAMP DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  author TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create platform_settings table for configurable platform settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description, category) VALUES
('platform_fee_percentage', '5.0', 'Platform fee percentage charged on successful transactions (includes payment gateway fees)', 'fees'),
('max_investment_amount', '10000000', 'Maximum investment amount allowed per transaction (in rupees)', 'limits'),
('min_investment_amount', '1000', 'Minimum investment amount required per transaction (in rupees)', 'limits')
ON CONFLICT (key) DO NOTHING;

-- Add company column to jobs table if it doesn't exist
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;

-- Update any existing schema changes that may be missing
-- (Add any other schema modifications here as needed)