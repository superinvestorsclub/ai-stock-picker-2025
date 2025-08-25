import React, { useState } from 'react';
import { X, Chrome, Lock, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // Don't close modal immediately - let auth callback handle it
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
      // Show error message to user
      alert('Sign in failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Unlock Premium Content
          </h2>
          <p className="text-gray-600">
            Sign in to access the complete momentum portfolio with all 12 stocks and detailed analytics
          </p>
        </div>

        {/* Premium Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Complete portfolio holdings (12 stocks)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Detailed quarterly performance data</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Historical backtest results</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Chrome className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default AuthModal;