import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Target, Lock, Star, RefreshCw, AlertCircle } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import AuthModal from './AuthModal';

const MomentumPortfolio: React.FC = () => {
  const { 
    portfolioData, 
    portfolioSummary,
    quarters, 
    loading, 
    error, 
    selectedQuarter, 
    setSelectedQuarter, 
    refreshData,
    isDataStale 
  } = usePortfolioData();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeframes = [
    { key: '1M' as const, label: '1 Month' },
    { key: '3M' as const, label: '3 Months' },
    { key: '6M' as const, label: '6 Months' },
    { key: '1Y' as const, label: '1 Year' },
  ];

  // Show limited data for non-authenticated users
  const displayData = user ? portfolioData : portfolioData.slice(0, 4);
  const isLimitedView = !user && portfolioData.length > 4;

  // Calculate portfolio metrics
  const totalWeight = portfolioData.reduce((sum, stock) => sum + stock.weight, 0);
  const avgReturns = portfolioData.length > 0 
    ? portfolioData.reduce((sum, stock) => sum + stock.quarterly_returns, 0) / portfolioData.length 
    : 0;
  const totalStocks = portfolioData.length;

  // Sort stocks by returns for top/bottom performers
  const sortedByReturns = [...portfolioData].sort((a, b) => b.quarterly_returns - a.quarterly_returns);
  const topPerformers = sortedByReturns.slice(0, 5);
  const bottomPerformers = sortedByReturns.slice(-5).reverse();

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('Manual refresh triggered by user');
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced loading state with better UX
  if (loading || authLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-10 bg-green-700 rounded w-64 mx-auto mb-4"></div>
                <div className="h-6 bg-green-700 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6">
                <div className="animate-pulse flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Portfolio Table Skeleton */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium">
                  {authLoading ? 'Authenticating...' : 'Loading portfolio data...'}
                </p>
                <p className="text-sm mt-2">
                  {user ? 'Fetching your personalized portfolio...' : 'Preparing portfolio data...'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Momentum Portfolio</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              AI-curated portfolio of high-momentum stocks with quarterly rebalancing
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stocks</p>
                <p className="text-2xl font-bold text-blue-600">{totalStocks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Returns</p>
                <p className="text-2xl font-bold text-green-600">{avgReturns.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Weight</p>
                <p className="text-2xl font-bold text-purple-600">{totalWeight.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Quarter</p>
                <p className="text-2xl font-bold text-orange-600">{selectedQuarter || 'Q4 2024'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quarter Selector */}
        {quarters.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Portfolio History</h2>
                <p className="text-gray-600">Select a quarter to view historical portfolio composition</p>
                {isDataStale && (
                  <div className="flex items-center space-x-2 mt-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Data may be outdated</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 flex-wrap gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                
                <label className="text-sm font-medium text-gray-700">Quarter:</label>
                <select
                  value={selectedQuarter || ''}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {quarters.map((quarter) => (
                    <option key={quarter.quarter} value={quarter.quarter}>
                      {quarter.quarter} ({quarter.total_stocks} stocks, {quarter.avg_returns.toFixed(1)}% avg return)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Holdings */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Portfolio Holdings</h2>
                <p className="text-gray-600">
                  {selectedQuarter ? `Holdings for ${selectedQuarter}` : 'Current portfolio composition'}
                  {portfolioData.length > 0 && user && (
                    <span className="ml-2 text-sm text-green-600">
                      • Real-time data active
                    </span>
                  )}
                  {!user && (
                    <span className="ml-2 text-sm text-orange-600">
                      • Limited preview (sign in for full access)
                    </span>
                  )}
                </p>
              </div>
              
              {isLimitedView && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm font-medium">Limited View</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Data Status */}
          {user && (
            <div className="px-6 py-3 bg-green-50 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    Real-time updates enabled
                  </span>
                  {portfolioSummary.length > 0 && (
                    <span className="text-xs text-green-600">
                      • {portfolioSummary.length} quarters tracked
                    </span>
                  )}
                </div>
                <div className="text-xs text-green-600">
                  Connected • Last sync: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quarterly Returns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((stock, index) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {stock.company_logo_url ? (
                            <img 
                              src={stock.company_logo_url} 
                              alt={`${stock.stock_code} logo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center" style={{ display: stock.company_logo_url ? 'none' : 'flex' }}>
                            <span className="text-green-600 font-semibold text-sm">
                              {stock.stock_code.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stock.stock_code}</div>
                          <div className="text-sm text-gray-500">{stock.stock_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stock.weight.toFixed(2)}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(stock.weight * 4, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        stock.quarterly_returns >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.quarterly_returns >= 0 ? '+' : ''}{stock.quarterly_returns.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {stock.quarterly_returns >= 15 ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">Strong</span>
                          </div>
                        ) : stock.quarterly_returns >= 5 ? (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">Good</span>
                          </div>
                        ) : stock.quarterly_returns >= 0 ? (
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <span className="text-xs font-medium">Neutral</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-red-600">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-xs font-medium">Weak</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Limited View Overlay */}
          {isLimitedView && (
            <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Lock className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">
                    Unlock Complete Portfolio
                  </h3>
                </div>
                <p className="text-orange-700 mb-4">
                  Sign in to view all {portfolioData.length} stocks with real-time updates and detailed analytics
                </p>
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">Complete holdings list</span>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-600">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Real-time performance tracking</span>
                  </div>
                </div>
                <button
                  onClick={handleAuthRequired}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Sign In to View All Holdings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Performers Section */}
        {user && topPerformers.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                Top Performers
              </h3>
              <div className="space-y-3">
                {topPerformers.slice(0, 5).map((stock, index) => (
                  <div key={stock.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-700">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{stock.stock_code}</p>
                        <p className="text-sm text-gray-600">{stock.weight.toFixed(1)}% weight</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{stock.quarterly_returns.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                Needs Attention
              </h3>
              <div className="space-y-3">
                {bottomPerformers.slice(0, 5).map((stock, index) => (
                  <div key={stock.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-red-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{stock.stock_code}</p>
                        <p className="text-sm text-gray-600">{stock.weight.toFixed(1)}% weight</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {stock.quarterly_returns.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2 text-red-600">Error Loading Portfolio Data</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Retrying...' : 'Retry'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && portfolioData.length === 0 && isInitialized && user && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">
                Setting Up Your Portfolio
              </p>
              <p className="text-sm mb-4">
                We're preparing your personalized portfolio data. This may take a moment.
              </p>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Setting up...' : 'Initialize Portfolio'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Sign In Required State */}
        {!loading && !error && !user && isInitialized && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Sign In for Full Portfolio Access
              </h3>
              <p className="text-gray-600 mb-6">
                Get personalized portfolio tracking, real-time updates, and detailed analytics
              </p>
              <button
                onClick={handleAuthRequired}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Sign In Now
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default MomentumPortfolio;