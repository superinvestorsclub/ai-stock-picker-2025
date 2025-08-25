/*
  # Database Schema Optimization and Performance Enhancement

  This migration addresses the following issues:
  1. Poor table relationships and foreign key constraints
  2. Missing indexes for performance optimization
  3. Inefficient authentication flow
  4. Missing user data initialization triggers
  5. Lack of proper RLS policies for data security
  6. Missing materialized views for analytics
  7. No real-time notification system

  ## Changes Made:
  1. **Enhanced Foreign Key Relationships**: Proper CASCADE relationships
  2. **Performance Indexes**: Strategic indexing for optimal query performance
  3. **User Data Initialization**: Automatic user profile and portfolio data creation
  4. **Materialized Views**: Pre-computed analytics for faster queries
  5. **Real-time Notifications**: PostgreSQL NOTIFY/LISTEN for instant updates
  6. **Optimized RLS Policies**: Secure and efficient data access
*/

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS portfolio_performance_summary;

-- Create or update subscription_status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('free', 'premium');
EXCEPTION
  WHEN duplicate_object THEN 
    -- If enum exists, check if we need to add 'premium' value
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'premium' AND enumtypid = 'subscription_status'::regtype) THEN
      ALTER TYPE subscription_status ADD VALUE 'premium';
    END IF;
END $$;

-- 1. Optimize User Profiles Table
-- Add missing constraints and indexes
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add performance indexes
  CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_updated ON user_profiles(subscription_status, updated_at DESC);
END $$;

-- 2. Optimize Portfolio Constituents Table
-- Add missing user_id column and constraints
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio_constituents' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE portfolio_constituents ADD COLUMN user_id UUID;
  END IF;

  -- Add foreign key constraint for user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'portfolio_constituents_user_id_fkey' 
    AND table_name = 'portfolio_constituents'
  ) THEN
    ALTER TABLE portfolio_constituents 
    ADD CONSTRAINT portfolio_constituents_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add performance indexes
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_user_id ON portfolio_constituents(user_id);
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_quarter ON portfolio_constituents(quarter);
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_stock_code ON portfolio_constituents(stock_code);
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_created_at ON portfolio_constituents(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_quarter_stock ON portfolio_constituents(quarter, stock_code);
  CREATE INDEX IF NOT EXISTS idx_portfolio_user_quarter ON portfolio_constituents(user_id, quarter, weight DESC);
  CREATE INDEX IF NOT EXISTS idx_portfolio_user_returns ON portfolio_constituents(user_id, quarterly_returns DESC);
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_composite ON portfolio_constituents(user_id, quarter, quarterly_returns DESC, weight DESC);

  -- Add full-text search index
  CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_search ON portfolio_constituents 
  USING gin(to_tsvector('english', stock_name || ' ' || stock_code));
END $$;

-- 3. Optimize User Sessions Table
-- Add foreign key constraint and indexes
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_sessions_user_id_fkey' 
    AND table_name = 'user_sessions'
  ) THEN
    ALTER TABLE user_sessions 
    ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add performance indexes
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_token_expires ON user_sessions(session_token, expires_at);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires ON user_sessions(user_id, expires_at DESC);
END $$;

-- 4. Optimize User Preferences Table
-- Add foreign key constraint and indexes
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_preferences_user_id_fkey' 
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE user_preferences 
    ADD CONSTRAINT user_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add performance indexes
  CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_preferences_updated ON user_preferences(updated_at DESC);
END $$;

-- 5. Create Enhanced Trigger Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    updated_at = now();

  -- Create user preferences
  INSERT INTO public.user_preferences (user_id, preferences, cache_data)
  VALUES (NEW.id, '{}'::jsonb, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure user has portfolio data
CREATE OR REPLACE FUNCTION ensure_user_portfolio_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user already has portfolio data
  IF NOT EXISTS (
    SELECT 1 FROM portfolio_constituents 
    WHERE user_id = p_user_id 
    LIMIT 1
  ) THEN
    -- Copy default portfolio data for the user
    INSERT INTO portfolio_constituents (
      user_id, quarter, stock_name, stock_code, company_logo_url, 
      weight, quarterly_returns, created_at, updated_at
    )
    SELECT 
      p_user_id, quarter, stock_name, stock_code, company_logo_url,
      weight, quarterly_returns, now(), now()
    FROM portfolio_constituents 
    WHERE user_id IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user portfolio summary
CREATE OR REPLACE FUNCTION get_user_portfolio_summary(p_user_id UUID, p_quarter TEXT DEFAULT NULL)
RETURNS TABLE(
  quarter TEXT,
  total_stocks BIGINT,
  avg_returns NUMERIC,
  total_weight NUMERIC,
  top_performer TEXT,
  top_performer_return NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.quarter,
    COUNT(*)::BIGINT as total_stocks,
    AVG(pc.quarterly_returns) as avg_returns,
    SUM(pc.weight) as total_weight,
    (SELECT stock_code FROM portfolio_constituents 
     WHERE user_id = p_user_id AND quarter = pc.quarter 
     ORDER BY quarterly_returns DESC LIMIT 1) as top_performer,
    MAX(pc.quarterly_returns) as top_performer_return
  FROM portfolio_constituents pc
  WHERE pc.user_id = p_user_id
    AND (p_quarter IS NULL OR pc.quarter = p_quarter)
  GROUP BY pc.quarter
  ORDER BY pc.quarter DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate user session
CREATE OR REPLACE FUNCTION validate_user_session(p_session_token TEXT)
RETURNS TABLE(user_id UUID, is_valid BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    (us.expires_at > now()) as is_valid
  FROM user_sessions us
  WHERE us.session_token = p_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_portfolio_performance()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_performance_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger materialized view refresh
CREATE OR REPLACE FUNCTION trigger_refresh_portfolio_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_notify to trigger async refresh
  PERFORM pg_notify('portfolio_refresh', 'refresh_needed');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function for real-time notifications
CREATE OR REPLACE FUNCTION notify_portfolio_change()
RETURNS TRIGGER AS $$
DECLARE
  notification JSON;
BEGIN
  notification = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'user_id', COALESCE(NEW.user_id, OLD.user_id),
    'quarter', COALESCE(NEW.quarter, OLD.quarter),
    'timestamp', extract(epoch from now())
  );
  
  PERFORM pg_notify('portfolio_changes', notification::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Create/Update Triggers
-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_portfolio_constituents_updated_at ON portfolio_constituents;
DROP TRIGGER IF EXISTS portfolio_performance_refresh_trigger ON portfolio_constituents;
DROP TRIGGER IF EXISTS portfolio_change_notify ON portfolio_constituents;

-- Create new optimized triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_constituents_updated_at
  BEFORE UPDATE ON portfolio_constituents
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_constituents_updated_at();

CREATE TRIGGER portfolio_performance_refresh_trigger
  AFTER INSERT OR UPDATE OR DELETE ON portfolio_constituents
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_portfolio_performance();

CREATE TRIGGER portfolio_change_notify
  AFTER INSERT OR UPDATE OR DELETE ON portfolio_constituents
  FOR EACH ROW EXECUTE FUNCTION notify_portfolio_change();

-- 7. Create Materialized View for Performance Analytics
CREATE MATERIALIZED VIEW portfolio_performance_summary AS
SELECT 
  user_id,
  quarter,
  COUNT(*) as total_stocks,
  AVG(quarterly_returns) as avg_returns,
  SUM(weight) as total_weight,
  MAX(quarterly_returns) as best_performer,
  MIN(quarterly_returns) as worst_performer,
  STDDEV(quarterly_returns) as volatility,
  now() as updated_at
FROM portfolio_constituents
WHERE user_id IS NOT NULL
GROUP BY user_id, quarter;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_portfolio_performance_summary_unique 
ON portfolio_performance_summary (user_id, quarter);

-- 8. Enhanced RLS Policies
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can read portfolio constituents" ON portfolio_constituents;
DROP POLICY IF EXISTS "Users can read own portfolio data" ON portfolio_constituents;
DROP POLICY IF EXISTS "Users can manage own portfolio data" ON portfolio_constituents;
DROP POLICY IF EXISTS "Authenticated users can insert portfolio constituents" ON portfolio_constituents;
DROP POLICY IF EXISTS "Authenticated users can update portfolio constituents" ON portfolio_constituents;
DROP POLICY IF EXISTS "Authenticated users can delete portfolio constituents" ON portfolio_constituents;

-- Create optimized RLS policies
-- User Profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- User Sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- User Preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Portfolio Constituents - Enhanced policies
CREATE POLICY "Anyone can read portfolio constituents" ON portfolio_constituents
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Users can read own portfolio data" ON portfolio_constituents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage own portfolio data" ON portfolio_constituents
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert portfolio constituents" ON portfolio_constituents
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update portfolio constituents" ON portfolio_constituents
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete portfolio constituents" ON portfolio_constituents
  FOR DELETE TO authenticated
  USING (true);

-- 9. Create helper function for portfolio constituent updated_at
CREATE OR REPLACE FUNCTION update_portfolio_constituents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Optimize existing data
-- Update any existing portfolio_constituents without user_id to have NULL explicitly
UPDATE portfolio_constituents SET user_id = NULL WHERE user_id IS NULL;

-- Create default portfolio data if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM portfolio_constituents WHERE user_id IS NULL LIMIT 1) THEN
    -- Insert sample default data
    INSERT INTO portfolio_constituents (user_id, quarter, stock_name, stock_code, company_logo_url, weight, quarterly_returns) VALUES
    (NULL, 'Q4 2024', 'Tata Consultancy Services Ltd.', 'TCS', 'https://logo.clearbit.com/tcs.com', 8.33, 15.2),
    (NULL, 'Q4 2024', 'Reliance Industries Ltd.', 'RELIANCE', 'https://logo.clearbit.com/ril.com', 8.33, 12.8),
    (NULL, 'Q4 2024', 'HDFC Bank Ltd.', 'HDFCBANK', 'https://logo.clearbit.com/hdfcbank.com', 8.33, 10.5),
    (NULL, 'Q4 2024', 'Infosys Ltd.', 'INFY', 'https://logo.clearbit.com/infosys.com', 8.33, 14.7),
    (NULL, 'Q4 2024', 'ICICI Bank Ltd.', 'ICICIBANK', 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop', 8.33, 11.2),
    (NULL, 'Q4 2024', 'Bharti Airtel Ltd.', 'BHARTIARTL', 'https://logo.clearbit.com/airtel.in', 8.33, 13.5),
    (NULL, 'Q4 2024', 'State Bank of India', 'SBIN', 'https://logo.clearbit.com/sbi.co.in', 8.33, 9.8),
    (NULL, 'Q4 2024', 'ITC Ltd.', 'ITC', 'https://logo.clearbit.com/itcportal.com', 8.33, 7.2),
    (NULL, 'Q4 2024', 'Hindustan Unilever Ltd.', 'HINDUNILVR', 'https://logo.clearbit.com/hul.co.in', 8.33, 8.9),
    (NULL, 'Q4 2024', 'Larsen & Toubro Ltd.', 'LT', 'https://logo.clearbit.com/larsentoubro.com', 8.33, 16.4),
    (NULL, 'Q4 2024', 'Asian Paints Ltd.', 'ASIANPAINT', 'https://logo.clearbit.com/asianpaints.com', 8.33, 6.7),
    (NULL, 'Q4 2024', 'Maruti Suzuki India Ltd.', 'MARUTI', 'https://logo.clearbit.com/marutisuzuki.com', 8.33, 18.3);
  END IF;
END $$;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant specific permissions for materialized view
GRANT SELECT ON portfolio_performance_summary TO authenticated, anon;

-- 12. Refresh materialized view
REFRESH MATERIALIZED VIEW portfolio_performance_summary;

-- 13. Create indexes for auth.users if they don't exist (for performance)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
  CREATE INDEX IF NOT EXISTS idx_auth_users_created_at ON auth.users(created_at DESC);
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Skip if we don't have permission to create indexes on auth schema
    NULL;
END $$;