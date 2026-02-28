import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { BASE_URL } from '../../../config';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/users/session`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Clear local state
        setUser(null);
        setIsProfileOpen(false);
        setIsMenuOpen(false);

        // Add a small delay to ensure session is destroyed
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        console.error('Logout failed:', data.message);
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout. Please try again.');
    }
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'super_admin':
        return '/superadmin/';
      case 'dept_admin':
        return '/admin/';
      case 'citizen':
      default:
        return '/citizen/';
    }
  };

  // Get profile URL based on user role
  const getProfileUrl = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'super_admin':
        return '/superadmin/profile';
      case 'dept_admin':
        return '/admin/profile';
      case 'citizen':
      default:
        return '/citizen/profile';
    }
  };

  const navigateToDashboard = () => {
    window.location.href = getDashboardUrl();
  };

  const navigateToProfile = () => {
    window.location.href = getProfileUrl();
  };

  if (loading) {
    return (
      <nav className="fixed w-full top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-40 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-3 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <a href='/' className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CivicIssueReporter</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Building Better Communities</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
              How It Works
            </a>
            <a href="#categories" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
              Categories
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
              About Us
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
              Contact
            </a>
          </div>

          {/* Auth Section - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              // Logged in state
              <div className="flex items-center space-x-4">
                <button
                  onClick={navigateToDashboard}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown cursor-pointer">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ') || 'user'}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={navigateToProfile}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={navigateToDashboard}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </button>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Logged out state
              <>
                <button
                  className="px-5 py-2.5 text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors cursor-pointer"
                  onClick={() => window.location.href = '/login'}
                >
                  Sign In
                </button>
                <button
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  onClick={() => window.location.href = '/register'}
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
            {user && (
              <div className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-blue-600 capitalize">{user.role?.replace('_', ' ') || 'user'}</p>
                  </div>
                </div>
              </div>
            )}

            <a href="#features" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium">
              Features
            </a>
            <a href="#how-it-works" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium">
              How It Works
            </a>
            <a href="#categories" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium">
              Categories
            </a>
            <a href="#about" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium">
              About Us
            </a>
            <a href="#contact" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium">
              Contact
            </a>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  <button
                    onClick={navigateToDashboard}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={navigateToProfile}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => window.location.href = '/register'}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}