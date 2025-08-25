import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserPreferences {
  id: string;
  user_id: string;
  preferences: Record<string, any>;
  cache_data: Record<string, any>;
  last_portfolio_quarter: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_status: 'free' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export interface PortfolioPerformanceSummary {
  user_id: string;
  quarter: string;
  total_stocks: number;
  avg_returns: number;
  total_weight: number;
  best_performer: number;
  worst_performer: number;
  volatility: number;
  updated_at: string;
}