export interface Stock {
  symbol: string;
  company: string;
  price: number;
  aiScore: number;
  week1: number;
  month1: number;
  month3: number;
  month6: number;
  fundamental: number;
  technical: number;
  sentiment: number;
  valuation: number;
  industry: number;
  tradeRanking: string;
  marketCap?: string;
  volume?: string;
  logo?: string;
}

export interface BacktestRecord {
  id: string;
  symbol: string;
  company: string;
  buyDate: string;
  buyPrice: number;
  sellDate: string;
  sellPrice: number;
  returns: number;
  holdingPeriod: number;
  aiScoreAtBuy: number;
  logo?: string;
}