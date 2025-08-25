import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  error: string | null;
  retryCount: number;
}

/**
 * Hook to manage real-time connection status and health
 */
export const useRealtimeConnection = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    lastConnected: null,
    error: null,
    retryCount: 0
  });

  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'degraded' | 'disconnected'>('disconnected');

  const checkConnection = useCallback(async () => {
    if (!user) {
      setStatus(prev => ({ ...prev, isConnected: false, error: 'Not authenticated' }));
      setConnectionHealth('disconnected');
      return false;
    }

    try {
      setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

      // Test database connection with a simple query
      const { data, error } = await supabase
        .from('portfolio_constituents')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      setStatus(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        lastConnected: new Date(),
        error: null,
        retryCount: 0
      }));
      
      setConnectionHealth('healthy');
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        retryCount: prev.retryCount + 1
      }));
      
      setConnectionHealth('disconnected');
      return false;
    }
  }, [user]);

  const reconnect = useCallback(async () => {
    console.log('Attempting to reconnect...');
    return await checkConnection();
  }, [checkConnection]);

  // Initial connection check
  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user, checkConnection]);

  // Periodic health check
  useEffect(() => {
    if (!user) return;

    const healthCheckInterval = setInterval(async () => {
      const isHealthy = await checkConnection();
      
      if (!isHealthy && status.retryCount < 3) {
        // Auto-retry with exponential backoff
        setTimeout(() => {
          reconnect();
        }, Math.pow(2, status.retryCount) * 1000);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [user, checkConnection, reconnect, status.retryCount]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      if (user) {
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: 'Network connection lost'
      }));
      setConnectionHealth('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, reconnect]);

  return {
    status,
    connectionHealth,
    checkConnection,
    reconnect,
    isHealthy: status.isConnected && !status.error,
    canRetry: status.retryCount < 5
  };
};