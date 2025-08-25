import React, { useState } from 'react';
import { Search, Menu, X, User, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">PW</span>
            </div>
            <span className="text-xl font-bold">Passive Wealth</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="hover:text-blue-200 transition-colors">Top Stocks</a>
            <Link to="/momentum" className="hover:text-blue-200 transition-colors">Momentum Portfolio</Link>
            <a href="#" className="hover:text-blue-200 transition-colors">Pricing</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Market</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Portfolios</a>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center bg-white rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search stocks..."
              className="flex-1 text-gray-800 text-sm outline-none"
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button className="hidden md:flex items-center space-x-1 hover:text-blue-200 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            
            {!loading && (
              <>
                {user ? (
                  <UserMenu />
                ) : (
                  <>
                    <button 
                      onClick={() => setShowAuthModal(true)}
                      className="hidden md:flex items-center space-x-1 hover:text-blue-200 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm">Log in</span>
                    </button>
                    <button 
                      onClick={() => setShowAuthModal(true)}
                      className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </>
            )}
            
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-500">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="hover:text-blue-200 transition-colors">Top Stocks</a>
              <Link to="/momentum" className="hover:text-blue-200 transition-colors">Momentum Portfolio</Link>
              <a href="#" className="hover:text-blue-200 transition-colors">Pricing</a>
              <a href="#" className="hover:text-blue-200 transition-colors">Market</a>
              <a href="#" className="hover:text-blue-200 transition-colors">Portfolios</a>
              <div className="flex items-center bg-white rounded-lg px-3 py-2 mt-4">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  className="flex-1 text-gray-800 text-sm outline-none"
                />
              </div>
            </nav>
          </div>
        )}
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};

export default Header;