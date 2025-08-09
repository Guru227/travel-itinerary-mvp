import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, User, LogOut, Menu, X, ChevronDown, Settings } from 'lucide-react';
import { AuthService } from '../lib/auth';
import { User as UserType } from '../types';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
  };

  const handleAuth = (authenticatedUser: UserType) => {
    setUser(authenticatedUser);
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    AuthService.signOut();
    setUser(null);
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const handleProfileUpdate = (updatedUser: UserType) => {
    setUser(updatedUser);
    setShowProfileModal(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { path: '/', label: 'Features' },
    { path: '/community', label: 'Community' },
    { path: '/chat', label: 'Planner' }, // Changed from "Plan" to "Planner"
  ];

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.nickname || user.email.split('@')[0];
  };

  return (
    <>
      {/* Global Navigation Bar - Centered layout with no gaps */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-poppins font-bold text-xl text-secondary">
                Nomad's Compass
              </span>
            </Link>

            {/* Centered Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-lato font-semibold transition-colors ${
                    isActive(link.path)
                      ? 'text-primary border-b-2 border-primary pb-1'
                      : 'text-gray-600 hover:text-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Unified User Menu - Right side */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-lato text-sm text-gray-700">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-lato text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm font-lato text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block font-lato font-semibold transition-colors ${
                      isActive(link.path)
                        ? 'text-primary'
                        : 'text-gray-600 hover:text-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* Mobile User Section */}
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-lato text-sm text-gray-700">
                          {getUserDisplayName()}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 text-sm font-lato text-gray-600 hover:text-secondary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-sm font-lato text-gray-600 hover:text-secondary transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-poppins font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Close dropdown when clicking outside */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserDropdown(false)}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal
          isOpen={showProfileModal}
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default Navbar;