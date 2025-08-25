import React, { useState } from 'react';
import { TrendingUp, Calendar, DollarSign, Clock, Target, Activity, ChevronDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { BacktestRecord } from '../types/Stock';
import { mockBacktestData } from '../data/mockData';
import Header from './Header';
import Footer from './Footer';

const BacktestHistory = () => {
  const [backtestData] = useState<BacktestRecord[]>(mockBacktestData);
  const [sortField, setSortField] = useState<keyof BacktestRecord>('returns');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleSort = (field: keyof BacktestRecord) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedData = [...backtestData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return sortDirection === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const avgReturns = backtestData.reduce((sum, record) => sum + record.returns, 0) / backtestData.length;
  const totalTrades = 54;
  const winningTrades = backtestData.filter(record => record.returns > 0).length;
  const winRate = 81;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getReturnColor = (returns: number) => {
    if (returns >= 0) return 'text-green-400';
    return 'text-red-400';
  };

  const getReturnIcon = (returns: number) => {
    if (returns >= 0) return <ArrowUp className="w-4 h-4" />;
    return <ArrowDown className="w-4 h-4" />;
  };

  const formatHoldingPeriod = (days: number) => {
    if (days >= 30) {
      const months = Math.round(days / 30);
      return `${months} Month${months > 1 ? 's' : ''}`;
    }
    return `${days} Days`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Exited Calls</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Historical performance of Passive Wealth AI stock recommendations over the past 6 months
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Returns</p>
                <p className="text-2xl font-bold text-green-600">{avgReturns.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-blue-600">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-orange-600">{totalTrades}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Holding Period</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(backtestData.reduce((sum, record) => sum + record.holdingPeriod, 0) / backtestData.length)} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Historical Stock Recommendations
              </h2>
              <p className="text-gray-600">
                Detailed performance of AI-recommended stocks over the past 6 months
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value as keyof BacktestRecord)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="returns">Returns</option>
                  <option value="buyDate">Buy Date</option>
                  <option value="sellDate">Sell Date</option>
                  <option value="holdingPeriod">Holding Period</option>
                  <option value="aiScoreAtBuy">AI Score</option>
                </select>
              </div>
              
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span className="text-sm">{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedData.map((record) => (
            <div
              key={record.id}
              className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                border: '1px solid transparent',
                backgroundClip: 'padding-box',
              }}
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
              <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900"></div>
              
              {/* Card Content */}
              <div className="relative z-10">
                {/* Header with Stock Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-700 flex items-center justify-center">
                      {record.logo ? (
                        <img 
                          src={record.logo} 
                          alt={`${record.symbol} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center" style={{ display: record.logo ? 'none' : 'flex' }}>
                        <span className="text-white font-bold text-sm">
                          {record.symbol.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{record.symbol}</h3>
                      <p className="text-gray-400 text-sm">{record.company.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                  </div>
                  
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Buy Price */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    ₹{record.buyPrice.toFixed(0)}
                  </div>
                  <div className="text-gray-400 text-sm">Recommended Price</div>
                </div>

                {/* Returns */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
                  <div className="text-gray-400 text-sm">% Return</div>
                  <div className={`flex items-center space-x-1 ${getReturnColor(record.returns)}`}>
                    {getReturnIcon(record.returns)}
                    <span className="font-bold text-lg">
                      {record.returns >= 0 ? '+' : ''}{record.returns.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gray-400 text-sm">Duration</div>
                  <div className="text-white font-medium">
                    {formatHoldingPeriod(record.holdingPeriod)}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Date of recommendation</span>
                    <span className="text-white text-sm">{formatDate(record.buyDate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Sell Price</span>
                    <span className="text-white text-sm">₹{record.sellPrice.toFixed(0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Sell Date</span>
                    <span className="text-white text-sm">{formatDate(record.sellDate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">AI Score at Buy</span>
                    <div className="px-2 py-1 bg-blue-600 rounded-full">
                      <span className="text-white text-xs font-bold">{record.aiScoreAtBuy.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BacktestHistory;