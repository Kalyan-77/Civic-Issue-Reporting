import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Home, Settings, Bell, BarChart2, HelpCircle, Phone, FileText, Users, MessageSquare } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';
import { io } from 'socket.io-client';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/notifications?limit=5&filter=today`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      // console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const socket = io(BASE_URL, {
        withCredentials: true,
        auth: { userId: user._id || user.id }
      });

      const handleSocketError = (err) => {
        console.error('Socket connection error:', err);
        setSocketError(err?.message || 'Failed to connect to notifications service');
        fetchNotifications();
      };

      socket.on('connect', () => {
        setSocketError(null);
        socket.emit('join_user_room', user._id || user.id);
      });

      socket.on('connect_error', handleSocketError);
      socket.on('connect_timeout', handleSocketError);
      socket.on('error', handleSocketError);

      socket.on('new_notification', () => {
        fetchNotifications();
      });

      return () => {
        socket.off('connect');
        socket.off('connect_error', handleSocketError);
        socket.off('connect_timeout', handleSocketError);
        socket.off('error', handleSocketError);
        socket.off('new_notification');
        socket.disconnect();
      };
    }
  }, [user]);

  // Handle click outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isNotificationsOpen && !event.target.closest('.notification-dropdown')) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const handleMarkAsRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await fetch(`${BASE_URL}/notifications/${notification._id}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
        // Update local state
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setIsNotificationsOpen(false);

      // Navigate based on type
      if (notification.issueId) {
        // If it's an object with _id or just ID string
        const issueId = typeof notification.issueId === 'object' ? notification.issueId._id : notification.issueId;
        navigate(`${getBasePath()}/issue/${issueId}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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
          navigate('/login');
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

  // Get base path based on user role
  const getBasePath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'dept_admin':
        return '/admin';
      case 'citizen':
      default:
        return '/citizen';
    }
  };

  const navigateToDashboard = () => {
    navigate(getBasePath() + '/');
  };

  const navigateToProfile = () => {
    navigate(getBasePath() + '/profile');
  };

  // Get profile picture URL
  const getProfilePictureUrl = () => {
    if (!user?.profilePicture || user.profilePicture === 'default-profile.png') {
      return null;
    }
    if (user.profilePicture.startsWith('http')) {
      return user.profilePicture;
    }
    return `${BASE_URL}/uploads/${user.profilePicture}`;
  };

  // Profile Avatar Component
  const ProfileAvatar = ({ size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    const profilePicUrl = getProfilePictureUrl();

    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base'
    };

    if (profilePicUrl && !imageError) {
      return (
        <img
          src={profilePicUrl}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 ${isDark ? 'border-gray-600 ring-2 ring-gray-800' : 'border-white ring-2 ring-gray-100'} shadow-md ${className}`}
          onError={() => setImageError(true)}
        />
      );
    }

    // Fallback to initials
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ${className}`}>
        <span className="text-white font-bold tracking-wider">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
    );
  };

  // Get navigation links based on role
  const getNavLinks = () => {
    const basePath = getBasePath();

    if (user?.role === 'dept_admin') {
      return [
        { href: `${basePath}/`, label: 'Dashboard', icon: LayoutDashboard },
        { href: `${basePath}/analysis`, label: 'Analytics', icon: BarChart2 },
        { href: `${basePath}/help`, label: 'Help', icon: HelpCircle },
        { href: `${basePath}/contact`, label: 'Contact', icon: Phone },
      ];
    } else {
      // citizen or default
      return [
        { href: `${basePath}/`, label: 'Dashboard', icon: LayoutDashboard },
        { href: `${basePath}/report`, label: 'Report Issue', icon: FileText },
        { href: `${basePath}/issues`, label: 'Community Issues', icon: Users },
        { href: `${basePath}/contact`, label: 'Contact', icon: Phone }
      ];
    }
  };

  if (loading) {
    return (
      <nav className={`fixed w-full top-0 z-50 shadow-sm ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              <div className="space-y-2">
                <div className={`w-32 h-4 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navLinks = getNavLinks();

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled
      ? isDark ? 'bg-gray-900/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg'
      : isDark ? 'bg-transparent' : 'bg-transparent'
      }`}>
      {/* Background gradient for un-scrolled state if needed, or just keep transparent */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${isScrolled ? 'opacity-0' : 'opacity-100'} ${isDark ? 'bg-gradient-to-b from-gray-900 to-transparent' : 'bg-gradient-to-b from-white/80 to-transparent'} pointer-events-none -z-10`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to='/' className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Civic<span className="text-blue-600">Issue</span>
              </h1>
              <p className={`text-[10px] font-medium tracking-wider hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Building Better Communities</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/40 dark:border-white/5 shadow-sm">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-bounce-subtle' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth Section - Desktop */}
          <div className="hidden lg:flex items-center space-x-5">
            {user ? (
              // Logged in state
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/')}
                  className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm transition-all duration-300 rounded-full cursor-pointer transform hover:scale-105 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>

                {/* Notification Icon */}
                <div className="relative notification-dropdown">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 group ${isDark
                      ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                      : 'hover:bg-white text-gray-600 hover:text-gray-900 hover:shadow-md'
                      }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse ring-2 ring-red-500/30"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationsOpen && (
                    <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-xl border py-2 backdrop-blur-xl transform transition-all duration-300 origin-top-right animate-in fade-in slide-in-from-top-2 ${isDark
                      ? 'bg-gray-900/95 border-gray-700 shadow-black/50'
                      : 'bg-white/95 border-gray-100 shadow-xl shadow-blue-900/5'
                      }`}>
                      <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <button
                              key={notification._id}
                              onClick={() => handleMarkAsRead(notification)}
                              className={`w-full text-left px-4 py-3 flex items-start space-x-3 transition-colors ${!notification.isRead
                                ? isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-blue-50/50 hover:bg-blue-50'
                                : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                                }`}
                            >
                              <div className={`p-2 rounded-full shrink-0 ${notification.type === 'STATUS_UPDATE'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-blue-100 text-blue-600'
                                }`}>
                                {notification.type === 'STATUS_UPDATE' ? <FileText className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {notification.message}
                                </p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications today</p>
                          </div>
                        )}
                      </div>

                      <div className={`border-t mt-1 pt-1 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <button
                          onClick={() => {
                            if (user?.role === 'dept_admin') {
                              // Admin might have a different settings page or we assume consistent route
                              // But usually settings is safe for all
                              navigate(`/admin/settings?tab=notifications`); // Assuming params handling
                            } else {
                              navigate(`/citizen/settings?tab=notifications`);
                            }
                            setIsNotificationsOpen(false);
                          }}
                          className={`w-full text-center py-2 text-xs font-medium transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`w-px h-6 mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center space-x-3 pl-1 pr-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer border transform hover:scale-105 ${isDark
                      ? 'border-transparent hover:border-gray-600 hover:bg-gray-800'
                      : 'border-transparent hover:border-gray-200 hover:bg-white hover:shadow-md'
                      } ${isProfileOpen ? isDark ? 'bg-gray-800 border-gray-600' : 'bg-white shadow-md border-gray-200' : ''}`}
                  >
                    <ProfileAvatar size="md" />
                    <div className="text-left hidden xl:block">
                      <p className={`text-sm font-semibold leading-none mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                      <p className={`text-[10px] uppercase tracking-wide font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.role?.replace('_', ' ') || 'user'}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-xl border py-2 backdrop-blur-xl transform transition-all duration-300 origin-top-right animate-in fade-in slide-in-from-top-2 ${isDark
                      ? 'bg-gray-900/95 border-gray-700 shadow-black/50'
                      : 'bg-white/95 border-gray-100 shadow-xl shadow-blue-900/5'
                      }`}>

                      <div className={`px-5 py-4 border-b mb-2 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <div className="flex items-center space-x-3">
                          <ProfileAvatar size="md" />
                          <div className="overflow-hidden">
                            <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h4>
                            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-2 space-y-1">
                        <button
                          onClick={navigateToProfile}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={navigateToDashboard}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => navigate(`${getBasePath()}/settings`)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                      </div>

                      <div className={`border-t mt-2 pt-2 px-2 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                            }`}
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
              <div className="flex items-center gap-3">
                <button
                  className={`px-6 py-2.5 font-bold text-sm transition-colors rounded-full ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
                <button
                  className="px-7 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button - shows notification on mobile too */}
          <div className="flex items-center space-x-4 lg:hidden">
            {user && (
              <button className={`relative p-2 rounded-full ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
              </button>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-xl transition-colors ${isMenuOpen
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                : isDark ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-900'
                }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`lg:hidden border-t py-6 space-y-4 animate-in slide-in-from-top-5 duration-300 ${isDark ? 'border-gray-800 bg-gray-900/95 backdrop-blur-xl' : 'border-gray-100 bg-white/95 backdrop-blur-xl'
            } absolute left-0 right-0 shadow-lg px-4 h-screen`}>
            {user && (
              <div className={`px-5 py-5 rounded-3xl mb-6 flex items-center space-x-4 ${isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
                <ProfileAvatar size="lg" />
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                  <p className="text-xs text-blue-600 font-bold uppercase mt-1 tracking-wide">{user.role?.replace('_', ' ') || 'user'}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-5 py-4 rounded-2xl text-base font-bold transition-all ${location.pathname === link.href
                      ? isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className={`pt-6 border-t mt-6 space-y-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {user ? (
                <>
                  <button
                    onClick={() => { navigateToProfile(); setIsMenuOpen(false); }}
                    className={`w-full flex items-center justify-start space-x-4 px-5 py-4 font-bold text-base rounded-2xl ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => { navigate(`${getBasePath()}/settings`); setIsMenuOpen(false); }}
                    className={`w-full flex items-center justify-start space-x-4 px-5 py-4 font-bold text-base rounded-2xl ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-start space-x-4 px-5 py-4 font-bold text-base rounded-2xl ${isDark ? 'bg-red-900/20 text-red-300 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full px-4 py-4 font-bold text-sm rounded-2xl transition-colors ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full px-4 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}