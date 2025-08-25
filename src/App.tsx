import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StockTable from './components/StockTable';
import Footer from './components/Footer';
import BacktestHistory from './components/BacktestHistory';
import MomentumPortfolio from './components/MomentumPortfolio';
import PortfolioAdmin from './components/PortfolioAdmin';
import { supabase } from './lib/supabase';
import { mockStockData } from './data/mockData';

// Component to handle OAuth callback
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreSession } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...');
        
        // Wait a moment for the auth state to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Restore session to ensure all auth state is properly set
        await restoreSession();
        
        // Get the stored location or default to momentum page
        const lastLocation = localStorage.getItem('lastUserLocation');
        const redirectTo = lastLocation && lastLocation !== '/auth/callback' ? lastLocation : '/momentum';
        
        console.log('Redirecting to:', redirectTo);
        navigate(redirectTo, { replace: true });

      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, location, restoreSession]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

function HomePage() {
  const [stocks, setStocks] = useState(mockStockData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />
      <main className="container mx-auto px-4 py-8">
        <StockTable stocks={stocks} loading={loading} />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/backtest" element={<BacktestHistory />} />
          <Route path="/momentum" element={<MomentumPortfolio />} />
          <Route path="/admin" element={<PortfolioAdmin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;