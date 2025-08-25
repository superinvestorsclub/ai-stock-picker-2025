import { useState, useEffect, useCallback } from 'react';
import { portfolioService, PortfolioConstituent, QuarterSummary, PortfolioSummary } from '../lib/portfolioService';
import { useAuth } from '../contexts/AuthContext';

interface UsePortfolioDataReturn {
  portfolioData: PortfolioConstituent[];
  portfolioSummary: PortfolioSummary[];
  quarters: QuarterSummary[];
  loading: boolean;
  error: string | null;
  selectedQuarter: string | null;
  setSelectedQuarter: (quarter: string) => void;
  refreshData: () => Promise<void>;
  addConstituent: (constituent: Omit<PortfolioConstituent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateConstituent: (id: number, updates: Partial<PortfolioConstituent>) => Promise<void>;
  deleteConstituent: (id: number) => Promise<void>;
  isDataStale: boolean;
}

export const usePortfolioData = (initialQuarter?: string): UsePortfolioDataReturn => {
  const [portfolioData, setPortfolioData] = useState<PortfolioConstituent[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary[]>([]);
  const [quarters, setQuarters] = useState<QuarterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(initialQuarter || null);
  const [isDataStale, setIsDataStale] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const { user, isInitialized, userProfile } = useAuth();

  // Data freshness check (5 minutes)
  const DATA_FRESHNESS_THRESHOLD = 2 * 60 * 1000; // Reduced to 2 minutes for better UX

  // Load quarters summary
  const loadQuarters = useCallback(async () => {
    try {
      console.log('Loading quarters for user:', user?.id);
      const quartersData = await portfolioService.getQuartersSummary(user?.id);
      setQuarters(quartersData);
      
      // Set default quarter if none selected
      if (!selectedQuarter && quartersData.length > 0) {
        setSelectedQuarter(quartersData[0].quarter);
      }
      
      setLastFetchTime(Date.now());
      setIsDataStale(false);
    } catch (err) {
      console.error('Error loading quarters:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quarters');
      setIsDataStale(true);
    }
  }, [selectedQuarter, user?.id]);

  // Load portfolio summary
  const loadPortfolioSummary = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Loading portfolio summary for user:', user.id);
      const summaryData = await portfolioService.getPortfolioSummary(user.id, selectedQuarter || undefined);
      setPortfolioSummary(summaryData);
    } catch (err) {
      console.error('Error loading portfolio summary:', err);
      // Don't set error for summary as it's not critical
    }
  }, [user?.id, selectedQuarter]);

  // Load portfolio data for selected quarter
  const loadPortfolioData = useCallback(async () => {
    if (!selectedQuarter) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading portfolio data for quarter:', selectedQuarter, 'user:', user?.id);
      
      const data = await portfolioService.getPortfolioByQuarter(selectedQuarter, user?.id);
      console.log('Loaded portfolio data:', data.length, 'items');
      setPortfolioData(data);
      
      setLastFetchTime(Date.now());
      setIsDataStale(false);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
      setIsDataStale(true);
    } finally {
      setLoading(false);
    }
  }, [selectedQuarter, user?.id]);

  // Check if data is stale and needs refresh
  const checkDataFreshness = useCallback(() => {
    const now = Date.now();
    const isStale = (now - lastFetchTime) > DATA_FRESHNESS_THRESHOLD;
    setIsDataStale(isStale);
    return isStale;
  }, [lastFetchTime]);
  // Refresh all data
  const refreshData = useCallback(async () => {
    console.log('Refreshing all data...');
    
    // Clear service cache first
    portfolioService.clearCache(user?.id || 'public');
    
    const promises = [loadQuarters(), loadPortfolioData()];
    if (user?.id) {
      promises.push(loadPortfolioSummary());
    }
    
    await Promise.all(promises);
  }, [loadQuarters, loadPortfolioData, loadPortfolioSummary, user?.id]);

  // Force refresh when user authentication changes
  const forceRefresh = useCallback(async () => {
    if (user && isInitialized) {
      console.log('User authenticated, forcing data refresh...');
      setLoading(true);
      setError(null);
      await refreshData();
    }
  }, [user, isInitialized, refreshData]);
  // CRUD operations
  const addConstituent = useCallback(async (constituent: Omit<PortfolioConstituent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Add user_id if authenticated
      const constituentWithUser = {
        ...constituent,
        user_id: user?.id
      };
      
      await portfolioService.addConstituent(constituentWithUser);
      // Data will be updated via real-time subscription
      setIsDataStale(false);
    } catch (err) {
      console.error('Error adding constituent:', err);
      setError(err instanceof Error ? err.message : 'Failed to add constituent');
      throw err;
    }
  }, [user?.id]);

  const updateConstituent = useCallback(async (id: number, updates: Partial<PortfolioConstituent>) => {
    try {
      await portfolioService.updateConstituent(id, updates);
      // Data will be updated via real-time subscription
      setIsDataStale(false);
    } catch (err) {
      console.error('Error updating constituent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update constituent');
      throw err;
    }
  }, []);

  const deleteConstituent = useCallback(async (id: number) => {
    try {
      await portfolioService.deleteConstituent(id);
      // Data will be updated via real-time subscription
      setIsDataStale(false);
    } catch (err) {
      console.error('Error deleting constituent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete constituent');
      throw err;
    }
  }, []);

  // Handle quarter selection change
  const handleQuarterChange = useCallback((quarter: string) => {
    setSelectedQuarter(quarter);
    setIsDataStale(true); // Mark as stale to trigger refresh
  }, []);

  // Initial data load when auth is initialized
  useEffect(() => {
    if (isInitialized) {
      console.log('Auth initialized, loading initial data...');
      loadQuarters();
    }
  }, [isInitialized, loadQuarters]);

  // Force refresh when user logs in
  useEffect(() => {
    if (user && isInitialized && portfolioData.length === 0) {
      console.log('User logged in, forcing data refresh...');
      forceRefresh();
    }
  }, [user, isInitialized, portfolioData.length, forceRefresh]);

  // Load portfolio data when quarter changes
  useEffect(() => {
    if (selectedQuarter && isInitialized) {
      Promise.all([
        loadPortfolioData(),
        user?.id ? loadPortfolioSummary() : Promise.resolve()
      ]);
    }
  }, [selectedQuarter, isInitialized, loadPortfolioData, loadPortfolioSummary, user?.id]);

  // Periodic data freshness check
  useEffect(() => {
    const interval = setInterval(() => {
      if (checkDataFreshness() && user) {
        console.log('Data is stale, refreshing...');
        refreshData();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkDataFreshness, refreshData, user]);
  // Set up real-time subscription
  useEffect(() => {
    if (!selectedQuarter) return;

    console.log('Setting up real-time subscription for quarter:', selectedQuarter, 'user:', user?.id);

    const unsubscribe = portfolioService.subscribeToUpdates(
      (updatedData) => {
        console.log('Received real-time update:', updatedData);
        setPortfolioData(updatedData);
        setError(null);
        setIsDataStale(false);
        setLastFetchTime(Date.now());
      },
      selectedQuarter,
      user?.id
    );

    return unsubscribe;
  }, [selectedQuarter, user?.id]);

  // Preload data when user logs in
  useEffect(() => {
    if (user?.id && isInitialized && portfolioData.length === 0) {
      console.log('User logged in, preloading data...');
      // Ensure user has portfolio data
      portfolioService.ensureUserPortfolioData(user.id).then(() => {
        refreshData();
      }).catch(error => {
        console.error('Error ensuring user portfolio data:', error);
      });
    }
  }, [user?.id, isInitialized, portfolioData.length, refreshData]);

  return {
    portfolioData,
    portfolioSummary,
    quarters,
    loading,
    error,
    selectedQuarter,
    setSelectedQuarter: handleQuarterChange,
    refreshData,
    addConstituent,
    updateConstituent,
    deleteConstituent,
    isDataStale
  };
};