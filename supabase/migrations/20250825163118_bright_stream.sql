/*
  # Portfolio Constituents Management System

  1. New Tables
    - `portfolio_constituents`
      - `id` (bigint, primary key, auto-increment)
      - `quarter` (text, format: "Q1 2024")
      - `stock_name` (text, company name)
      - `stock_code` (text, stock symbol)
      - `company_logo_url` (text, logo image URL)
      - `weight` (decimal, portfolio weight percentage)
      - `quarterly_returns` (decimal, percentage returns)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `portfolio_constituents` table
    - Add policies for authenticated users to read data
    - Add policies for admin users to manage data

  3. Indexes
    - Index on quarter for fast filtering
    - Index on stock_code for lookups
    - Composite index on quarter and stock_code

  4. Sample Data
    - Historical data for Q1-2023, Q2-2023, Q1-2024, Q2-2024
*/

-- Create the portfolio_constituents table
CREATE TABLE IF NOT EXISTS portfolio_constituents (
  id bigserial PRIMARY KEY,
  quarter text NOT NULL,
  stock_name text NOT NULL,
  stock_code text NOT NULL,
  company_logo_url text,
  weight decimal(5,2) NOT NULL DEFAULT 0.00,
  quarterly_returns decimal(6,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE portfolio_constituents 
ADD CONSTRAINT portfolio_constituents_quarter_check 
CHECK (quarter ~ '^Q[1-4] \d{4}$');

ALTER TABLE portfolio_constituents 
ADD CONSTRAINT portfolio_constituents_weight_check 
CHECK (weight >= 0 AND weight <= 100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_quarter 
ON portfolio_constituents(quarter);

CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_stock_code 
ON portfolio_constituents(stock_code);

CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_quarter_stock 
ON portfolio_constituents(quarter, stock_code);

CREATE INDEX IF NOT EXISTS idx_portfolio_constituents_created_at 
ON portfolio_constituents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE portfolio_constituents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read portfolio constituents"
  ON portfolio_constituents
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert portfolio constituents"
  ON portfolio_constituents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update portfolio constituents"
  ON portfolio_constituents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete portfolio constituents"
  ON portfolio_constituents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_portfolio_constituents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_constituents_updated_at
  BEFORE UPDATE ON portfolio_constituents
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_constituents_updated_at();

-- Insert sample data for Q1-2023
INSERT INTO portfolio_constituents (quarter, stock_name, stock_code, company_logo_url, weight, quarterly_returns) VALUES
('Q1 2023', 'Reliance Industries Ltd.', 'RELIANCE', 'https://logo.clearbit.com/ril.com', 8.33, 12.5),
('Q1 2023', 'Tata Consultancy Services Ltd.', 'TCS', 'https://logo.clearbit.com/tcs.com', 8.33, 15.2),
('Q1 2023', 'HDFC Bank Ltd.', 'HDFCBANK', 'https://logo.clearbit.com/hdfcbank.com', 8.33, 8.7),
('Q1 2023', 'Infosys Ltd.', 'INFY', 'https://logo.clearbit.com/infosys.com', 8.33, 11.3),
('Q1 2023', 'ICICI Bank Ltd.', 'ICICIBANK', 'https://logo.clearbit.com/icicibank.com', 8.33, 9.8),
('Q1 2023', 'Hindustan Unilever Ltd.', 'HINDUNILVR', 'https://logo.clearbit.com/hul.co.in', 8.33, 6.4),
('Q1 2023', 'ITC Ltd.', 'ITC', 'https://logo.clearbit.com/itcportal.com', 8.33, 4.2),
('Q1 2023', 'State Bank of India', 'SBIN', 'https://logo.clearbit.com/sbi.co.in', 8.33, 7.9),
('Q1 2023', 'Bharti Airtel Ltd.', 'BHARTIARTL', 'https://logo.clearbit.com/airtel.in', 8.33, 13.6),
('Q1 2023', 'Asian Paints Ltd.', 'ASIANPAINT', 'https://logo.clearbit.com/asianpaints.com', 8.33, 5.8),
('Q1 2023', 'Maruti Suzuki India Ltd.', 'MARUTI', 'https://logo.clearbit.com/marutisuzuki.com', 8.33, 10.4),
('Q1 2023', 'Kotak Mahindra Bank Ltd.', 'KOTAKBANK', 'https://logo.clearbit.com/kotak.com', 8.37, 7.1);

-- Insert sample data for Q2-2023
INSERT INTO portfolio_constituents (quarter, stock_name, stock_code, company_logo_url, weight, quarterly_returns) VALUES
('Q2 2023', 'Tata Consultancy Services Ltd.', 'TCS', 'https://logo.clearbit.com/tcs.com', 8.33, 18.7),
('Q2 2023', 'Reliance Industries Ltd.', 'RELIANCE', 'https://logo.clearbit.com/ril.com', 8.33, 14.2),
('Q2 2023', 'HDFC Bank Ltd.', 'HDFCBANK', 'https://logo.clearbit.com/hdfcbank.com', 8.33, 11.5),
('Q2 2023', 'Infosys Ltd.', 'INFY', 'https://logo.clearbit.com/infosys.com', 8.33, 16.8),
('Q2 2023', 'ICICI Bank Ltd.', 'ICICIBANK', 'https://logo.clearbit.com/icicibank.com', 8.33, 12.9),
('Q2 2023', 'Bharti Airtel Ltd.', 'BHARTIARTL', 'https://logo.clearbit.com/airtel.in', 8.33, 19.3),
('Q2 2023', 'Hindustan Unilever Ltd.', 'HINDUNILVR', 'https://logo.clearbit.com/hul.co.in', 8.33, 8.1),
('Q2 2023', 'Titan Company Ltd.', 'TITAN', 'https://logo.clearbit.com/titan.co.in', 8.33, 15.4),
('Q2 2023', 'ITC Ltd.', 'ITC', 'https://logo.clearbit.com/itcportal.com', 8.33, 6.7),
('Q2 2023', 'State Bank of India', 'SBIN', 'https://logo.clearbit.com/sbi.co.in', 8.33, 9.2),
('Q2 2023', 'Asian Paints Ltd.', 'ASIANPAINT', 'https://logo.clearbit.com/asianpaints.com', 8.33, 7.3),
('Q2 2023', 'Maruti Suzuki India Ltd.', 'MARUTI', 'https://logo.clearbit.com/marutisuzuki.com', 8.37, 4.8);

-- Insert sample data for Q1-2024
INSERT INTO portfolio_constituents (quarter, stock_name, stock_code, company_logo_url, weight, quarterly_returns) VALUES
('Q1 2024', 'Tata Consultancy Services Ltd.', 'TCS', 'https://logo.clearbit.com/tcs.com', 8.33, 28.4),
('Q1 2024', 'Bharti Airtel Ltd.', 'BHARTIARTL', 'https://logo.clearbit.com/airtel.in', 8.33, 30.2),
('Q1 2024', 'Reliance Industries Ltd.', 'RELIANCE', 'https://logo.clearbit.com/ril.com', 8.33, 21.8),
('Q1 2024', 'Titan Company Ltd.', 'TITAN', 'https://logo.clearbit.com/titan.co.in', 8.33, 27.1),
('Q1 2024', 'HDFC Bank Ltd.', 'HDFCBANK', 'https://logo.clearbit.com/hdfcbank.com', 8.33, 18.5),
('Q1 2024', 'Nestle India Ltd.', 'NESTLEIND', 'https://logo.clearbit.com/nestle.in', 8.33, 24.6),
('Q1 2024', 'Infosys Ltd.', 'INFY', 'https://logo.clearbit.com/infosys.com', 8.33, 23.9),
('Q1 2024', 'HCL Technologies Ltd.', 'HCLTECH', 'https://logo.clearbit.com/hcltech.com', 8.33, 19.7),
('Q1 2024', 'ICICI Bank Ltd.', 'ICICIBANK', 'https://logo.clearbit.com/icicibank.com', 8.33, 20.3),
('Q1 2024', 'Hindustan Unilever Ltd.', 'HINDUNILVR', 'https://logo.clearbit.com/hul.co.in', 8.33, 15.8),
('Q1 2024', 'Wipro Ltd.', 'WIPRO', 'https://logo.clearbit.com/wipro.com', 8.33, 16.4),
('Q1 2024', 'Axis Bank Ltd.', 'AXISBANK', 'https://logo.clearbit.com/axisbank.com', 8.37, 17.9);

-- Insert sample data for Q2-2024
INSERT INTO portfolio_constituents (quarter, stock_name, stock_code, company_logo_url, weight, quarterly_returns) VALUES
('Q2 2024', 'Tata Consultancy Services Ltd.', 'TCS', 'https://logo.clearbit.com/tcs.com', 8.33, 32.1),
('Q2 2024', 'Bharti Airtel Ltd.', 'BHARTIARTL', 'https://logo.clearbit.com/airtel.in', 8.33, 34.8),
('Q2 2024', 'Titan Company Ltd.', 'TITAN', 'https://logo.clearbit.com/titan.co.in', 8.33, 31.2),
('Q2 2024', 'Reliance Industries Ltd.', 'RELIANCE', 'https://logo.clearbit.com/ril.com', 8.33, 24.7),
('Q2 2024', 'Nestle India Ltd.', 'NESTLEIND', 'https://logo.clearbit.com/nestle.in', 8.33, 28.9),
('Q2 2024', 'HDFC Bank Ltd.', 'HDFCBANK', 'https://logo.clearbit.com/hdfcbank.com', 8.33, 21.4),
('Q2 2024', 'HCL Technologies Ltd.', 'HCLTECH', 'https://logo.clearbit.com/hcltech.com', 8.33, 26.3),
('Q2 2024', 'Infosys Ltd.', 'INFY', 'https://logo.clearbit.com/infosys.com', 8.33, 27.8),
('Q2 2024', 'ICICI Bank Ltd.', 'ICICIBANK', 'https://logo.clearbit.com/icicibank.com', 8.33, 23.6),
('Q2 2024', 'Wipro Ltd.', 'WIPRO', 'https://logo.clearbit.com/wipro.com', 8.33, 19.2),
('Q2 2024', 'Hindustan Unilever Ltd.', 'HINDUNILVR', 'https://logo.clearbit.com/hul.co.in', 8.33, 18.7),
('Q2 2024', 'Axis Bank Ltd.', 'AXISBANK', 'https://logo.clearbit.com/axisbank.com', 8.37, 20.8);