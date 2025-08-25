/*
  # Database Schema Optimization and Relationship Enhancement

  1. Schema Improvements
    - Add proper foreign key relationships
    - Create optimized indexes for performance
    - Add user-specific portfolio tracking
    - Implement session management enhancements

  2. Performance Optimizations
    - Strategic indexing for fast queries
    - Materialized views for complex aggregations
    - Optimized RLS policies

  3. Data Integrity
    - Proper foreign key constraints
    - Cascade delete operations
    - Data validation constraints
*/

-- First, ensure we have the auth.users reference
-- (This is handled by Supabase Auth automatically)

-- Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_updated ON user_profiles(subscription_status, updated_at DESC);

-- Optimize user_sessions table with better indexing
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_expires ON user_sessions(session_token, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires ON user_sessions(user_id, expires_at DESC);

-- Add user-specific portfolio tracking
ALTER TABLE portfolio_constituents 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user-specific portfolio queries
CREATE INDEX IF NOT EXISTS idx_portfolio_user_quarter ON portfolio_constituents(user_id, quarter, weight DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_returns ON portfolio_constituents(user_id, quarterly_returns DESC);

-- Create a materialized view for portfolio performance analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS portfolio_performance_summary AS
SELECT 
  user_id,
  quarter,
  COUNT(*) as total_stocks,
  AVG(quarterly_returns) as avg_returns,
  SUM(weight) as total_weight,
  MAX(quarterly_returns) as best_performer,
  MIN(quarterly_returns) as worst_performer,
  STDDEV(quarterly_returns) as volatility,
  updated_at
FROM portfolio_constituents 
WHERE user_id IS NOT NULL
GROUP BY user_id, quarter, updated_at;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_performance_user_quarter 
ON portfolio_performance_summary(user_id, quarter);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_portfolio_performance()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_portfolio_performance()
RETURNS trigger AS $$
BEGIN
  -- Refresh in background to avoid blocking
  PERFORM pg_notify('refresh_portfolio_performance', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to portfolio_constituents
DROP TRIGGER IF EXISTS portfolio_performance_refresh_trigger ON portfolio_constituents;
CREATE TRIGGER portfolio_performance_refresh_trigger
  AFTER INSERT OR UPDATE OR DELETE ON portfolio_constituents
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_portfolio_performance();

-- Create user preferences table for caching and personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}',
  cache_data jsonb DEFAULT '{}',
  last_portfolio_quarter text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS to user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated ON user_preferences(updated_at DESC);

-- Update RLS policies for portfolio_constituents to support user-specific data
DROP POLICY IF EXISTS "Users can read own portfolio data" ON portfolio_constituents;
CREATE POLICY "Users can read own portfolio data"
  ON portfolio_constituents
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IS NULL -- Allow reading public/default portfolio data
  );

DROP POLICY IF EXISTS "Users can manage own portfolio data" ON portfolio_constituents;
CREATE POLICY "Users can manage own portfolio data"
  ON portfolio_constituents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function for efficient user session validation
CREATE OR REPLACE FUNCTION validate_user_session(session_token text)
RETURNS TABLE(user_id uuid, is_valid boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    (us.expires_at > now()) as is_valid
  FROM user_sessions us
  WHERE us.session_token = validate_user_session.session_token
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for user portfolio summary (cached)
CREATE OR REPLACE FUNCTION get_user_portfolio_summary(p_user_id uuid, p_quarter text DEFAULT NULL)
RETURNS TABLE(
  quarter text,
  total_stocks bigint,
  avg_returns numeric,
  total_weight numeric,
  top_performer text,
  top_performer_return numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.quarter,
    COUNT(*)::bigint as total_stocks,
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

-- Create function to get or create user portfolio data
CREATE OR REPLACE FUNCTION ensure_user_portfolio_data(p_user_id uuid)
RETURNS void AS $$
DECLARE
  user_has_data boolean;
BEGIN
  -- Check if user has any portfolio data
  SELECT EXISTS(
    SELECT 1 FROM portfolio_constituents 
    WHERE user_id = p_user_id
  ) INTO user_has_data;
  
  -- If no user-specific data, copy from default/public portfolio
  IF NOT user_has_data THEN
    INSERT INTO portfolio_constituents (
      user_id, quarter, stock_name, stock_code, company_logo_url, 
      weight, quarterly_returns
    )
    SELECT 
      p_user_id, quarter, stock_name, stock_code, company_logo_url,
      weight, quarterly_returns
    FROM portfolio_constituents 
    WHERE user_id IS NULL
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers where missing
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for real-time portfolio updates
CREATE OR REPLACE FUNCTION notify_portfolio_change()
RETURNS trigger AS $$
BEGIN
  -- Notify specific user channel
  IF TG_OP = 'DELETE' then
    PERFORM pg_notify('portfolio_change_' || OLD.user_id::text, 
      json_build_object('operation', TG_OP, 'quarter', OLD.quarter)::text);
    RETURN OLD;
  ELSE
    PERFORM pg_notify('portfolio_change_' || NEW.user_id::text, 
      json_build_object('operation', TG_OP, 'quarter', NEW.quarter)::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add real-time notification trigger
DROP TRIGGER IF EXISTS portfolio_change_notify ON portfolio_constituents;
CREATE TRIGGER portfolio_change_notify
  AFTER INSERT OR UPDATE OR DELETE ON portfolio_constituents
  FOR EACH ROW EXECUTE FUNCTION notify_portfolio_change();

-- Create comprehensive indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_composite 
ON portfolio_constituents(user_id, quarter, quarterly_returns DESC, weight DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_search 
ON portfolio_constituents USING gin(to_tsvector('english', stock_name || ' ' || stock_code));

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON portfolio_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_portfolio_summary(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_portfolio_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_session(text) TO authenticated;