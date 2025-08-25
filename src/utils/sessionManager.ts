/**
 * Session Management Utilities
 * Handles user session state, location tracking, and authentication flow
 */

export interface SessionState {
  lastLocation: string | null;
  timestamp: number;
  userId?: string;
}

class SessionManager {
  private static instance: SessionManager;
  private readonly STORAGE_KEY = 'passiveWealth_session';
  private readonly LOCATION_KEY = 'passiveWealth_lastLocation';
  private readonly CACHE_KEY = 'passiveWealth_cache';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Store user's current location for session restoration
   */
  storeLocation(path: string): void {
    try {
      if (typeof window === 'undefined') return;
      
      // Don't store auth callback or root paths
      if (path === '/auth/callback' || path === '/' || path.startsWith('/auth/')) return;
      
      const sessionState: SessionState = {
        lastLocation: path,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.LOCATION_KEY, JSON.stringify(sessionState));
      console.log('Stored location:', path);
    } catch (error) {
      console.error('Error storing location:', error);
    }
  }

  /**
   * Retrieve stored location for session restoration
   */
  getStoredLocation(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const stored = localStorage.getItem(this.LOCATION_KEY);
      if (!stored) return null;
      
      const sessionState: SessionState = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() - sessionState.timestamp > this.SESSION_TIMEOUT) {
        this.clearStoredLocation();
        return null;
      }
      
      return sessionState.lastLocation;
    } catch (error) {
      console.error('Error retrieving stored location:', error);
      return null;
    }
  }

  /**
   * Clear stored location
   */
  clearStoredLocation(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.LOCATION_KEY);
      console.log('Cleared stored location');
    } catch (error) {
      console.error('Error clearing stored location:', error);
    }
  }

  /**
   * Store session metadata
   */
  storeSessionMetadata(userId: string, metadata: Record<string, any> = {}): void {
    try {
      if (typeof window === 'undefined') return;
      
      const sessionData = {
        userId,
        metadata: {
          ...metadata,
          lastActivity: Date.now(),
          userAgent: navigator.userAgent.substring(0, 100) // Store partial UA for session validation
        },
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error storing session metadata:', error);
    }
  }

  /**
   * Retrieve session metadata
   */
  getSessionMetadata(): { userId: string; metadata: Record<string, any> } | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const sessionData = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() - sessionData.timestamp > this.SESSION_TIMEOUT) {
        this.clearSessionMetadata();
        return null;
      }
      
      return {
        userId: sessionData.userId,
        metadata: sessionData.metadata
      };
    } catch (error) {
      console.error('Error retrieving session metadata:', error);
      return null;
    }
  }

  /**
   * Clear session metadata
   */
  clearSessionMetadata(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing session metadata:', error);
    }
  }

  /**
   * Clear all session data
   */
  clearAll(): void {
    this.clearStoredLocation();
    this.clearSessionMetadata();
    this.clearCachedData();
  }

  /**
   * Clear cached data
   */
  clearCachedData(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cached data:', error);
    }
  }

  /**
   * Get cached data
   */
  getCachedData(): Record<string, any> {
    try {
      if (typeof window === 'undefined') return {};
      
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return {};
      
      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > this.CACHE_TIMEOUT) {
        this.clearCachedData();
        return {};
      }
      
      return cacheData.data || {};
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return {};
    }
  }

  /**
   * Check if current path should be stored for restoration
   */
  shouldStorePath(path: string): boolean {
    const excludedPaths = [
      '/auth/callback',
      '/',
      '/login',
      '/signup',
      '/auth'
    ];
    
    const excludedPatterns = [
      /^\/auth\//,
      /^\/\?/,  // Query params on root
      /^\/$/    // Exact root
    ];
    
    return !excludedPaths.includes(path) && 
           !excludedPatterns.some(pattern => pattern.test(path));
  }

  /**
   * Get default redirect path after login
   */
  getDefaultRedirectPath(): string {
    return '/momentum';
  }

  /**
   * Determine redirect path after successful authentication
   */
  getRedirectPath(): string {
    const storedLocation = this.getStoredLocation();
    const defaultPath = this.getDefaultRedirectPath();
    
    // Validate stored location
    if (storedLocation && this.shouldStorePath(storedLocation)) {
      return storedLocation;
    }
    
    return defaultPath;
  }

  /**
   * Optimize session restoration with cached data
   */
  getOptimizedSessionData(): {
    hasValidSession: boolean;
    cachedData: Record<string, any>;
    lastActivity: number | null;
  } {
    const sessionMetadata = this.getSessionMetadata();
    const cachedData = this.getCachedData();
    
    return {
      hasValidSession: !!sessionMetadata,
      cachedData,
      lastActivity: sessionMetadata?.metadata?.lastActivity || null
    };
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    const sessionMetadata = this.getSessionMetadata();
    if (sessionMetadata) {
      this.storeSessionMetadata(sessionMetadata.userId, {
        ...sessionMetadata.metadata,
        lastActivity: Date.now()
      });
    }
  }
}

export const sessionManager = SessionManager.getInstance();