import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Home, Bell, Settings, FileText, BarChart2, Video, Phone, Mail } from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';
import { io } from 'socket.io-client';

export default function Navbar() {
  const { isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

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
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socketError, setSocketError] = useState(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
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
        // Fallback: refresh notifications periodically
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

  const markAllAsRead = async () => {
    try {
      await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include'
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await fetch(`${BASE_URL}/notifications/${notif._id}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
        fetchNotifications();
      }

      setShowNotifications(false);

      // Navigate based on type
      if (notif.type === 'CONTACT_INQUIRY') {
        navigate('/admin/messages');
      } else if (notif.issueId) {
        navigate(`/admin/issues/${notif.issueId._id || notif.issueId}`);
      }
    } catch (err) {
      console.error('Failed to handle notification click', err);
    }
  };

  // Handle click outside profile dropdown and notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (showNotifications && !event.target.closest('.relative')) { // Assuming the notify bell container is relative
        // This might close if we click inside it, need to be careful.
        // Better to check if we clicked outside the notification area.
        // But the dropdown is inside the relative container.
        // Let's refine the check below.
      }
    };

    // Better click outside handler
    const handleGlobalClick = (e) => {
      if (showNotifications && !e.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (isProfileOpen && !e.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [isProfileOpen, showNotifications]);

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
        setUser(null);
        setIsProfileOpen(false);
        setIsMenuOpen(false);
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

  // Get base path based on user role
  const getBasePath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'super_admin':
        return '/superadmin';
      case 'dept_admin':
        return '/admin';
      case 'citizen':
      default:
        return '/citizen';
    }
  };

  const getNavLinks = () => {
    const basePath = getBasePath();

    if (user?.role === 'dept_admin') {
      return [
        { href: `${basePath}/`, label: 'Dashboard', icon: LayoutDashboard },
        { href: `${basePath}/issues`, label: 'Issues', icon: FileText },
        { href: `${basePath}/analysis`, label: 'My Performance', icon: BarChart2 },
        { href: `${basePath}/help`, label: 'Help & Support', icon: Video },
        { href: `${basePath}/messages`, label: 'Inquiries', icon: Mail }
      ];
    } else {
      return [
        { href: `${basePath}/`, label: 'Dashboard', icon: LayoutDashboard },
        { href: `${basePath}/report`, label: 'Report Issue', icon: FileText },
        { href: '#', label: 'Nearby Issues', icon: Home },
        { href: `${basePath}/contact`, label: 'Contact', icon: Phone }
      ];
    }
  };

  const isActive = (path) => {
    if (path === '#' || path === '/') return false;
    // Specific check for home/dashboard to avoid matching everything
    if (path.endsWith('/') && location.pathname !== path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (loading) {
    return (
      <nav className={`fixed w-full top-0 z-50 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${isDark ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg animate-pulse`}></div>
              <div className="space-y-2">
                <div className={`w-32 h-4 ${isDark ? 'bg-gray-800' : 'bg-slate-100'} rounded animate-pulse`}></div>
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
      ? isDark
        ? 'bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-800'
        : 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50'
      : isDark
        ? 'bg-gray-900 border-b border-gray-800'
        : 'bg-white border-b border-slate-100'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Left Side: Logo & Navigation */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/20 group-hover:shadow-slate-500/30 transition-all duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight leading-none group-hover:text-blue-500 transition-colors`}>CivicIssueReporter</h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} font-medium tracking-wide hidden sm:block mt-1`}>Building Better Communities</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link, idx) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={idx}
                    to={link.href}
                    className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${active
                      ? isDark
                        ? 'text-blue-400 bg-blue-900/30'
                        : 'text-blue-700 bg-blue-50'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    {link.icon && <link.icon className={`w-4 h-4 ${active
                      ? 'text-blue-500'
                      : isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side: Auth & Mobile Toggle */}
          <div className="flex items-center">
            {/* Auth Section - Desktop */}
            <div className="hidden lg:flex items-center pl-6 space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/')}
                    className={`p-2 ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'} rounded-lg transition-all duration-200`}
                    title="Home"
                  >
                    <Home className="w-5 h-5" />
                  </button>

                  {/* Notification Bell */}
                  <div className="relative notification-container">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`relative p-2 ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'} rounded-lg transition-all duration-200 group`}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white ring-1 ring-white animate-pulse"></span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'} rounded-xl shadow-xl border py-2 z-50 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar`}>
                        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-slate-100'} flex justify-between items-center sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-white'} z-10`}>
                          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium`}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="py-2">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`px-4 py-3 hover:bg-opacity-50 cursor-pointer transition-colors ${!notif.isRead
                                  ? isDark ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'bg-blue-50/50 hover:bg-blue-50'
                                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                                  }`}
                              >
                                <div className="flex gap-3">
                                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'
                                    }`}></div>
                                  <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-slate-800'} ${!notif.isRead ? 'font-semibold' : ''}`}>
                                      {notif.message}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                      {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No notifications</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative profile-dropdown">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center space-x-3 pl-2 pr-3 py-1.5 rounded-full border transition-all duration-200 ${isProfileOpen
                        ? isDark
                          ? 'border-blue-800 bg-blue-900/20 shadow-sm ring-2 ring-blue-900/50'
                          : 'border-blue-200 bg-blue-50/50 shadow-sm ring-2 ring-blue-100'
                        : isDark
                          ? 'border-transparent hover:bg-gray-800'
                          : 'border-transparent hover:bg-slate-50'
                        }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-md shadow-slate-200 text-white font-semibold text-sm border-2 border-white overflow-hidden">
                        {user.profilePicture && !imageError ? (
                          <img
                            src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}/uploads/${user.profilePicture}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          user.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="text-left hidden xl:block">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} leading-none`}>{user.name?.split(' ')[0]}</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'} font-medium uppercase tracking-wider mt-0.5`}>{user.role?.replace('_', ' ') || 'User'}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-400'} transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className={`absolute right-0 mt-2 w-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'} rounded-lg shadow-xl border py-2 z-50 animate-in fade-in zoom-in-95 duration-100`}>
                        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-slate-100'}`}>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{user.email}</p>
                          <p className="text-xs text-blue-500 mt-1 capitalize">
                            {user.role?.replace('_', ' ') || 'Admin'}
                          </p>
                        </div>

                        <button
                          onClick={() => { navigate(getBasePath() + '/profile'); setIsProfileOpen(false); }}
                          className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-slate-700 hover:bg-slate-50'} transition-colors`}
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => { navigate('/admin/settings'); setIsProfileOpen(false); }}
                          className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-slate-700 hover:bg-slate-50'} transition-colors`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>

                        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-slate-100'} mt-2 pt-2`}>
                          <button
                            onClick={handleLogout}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} transition-colors`}
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
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className={`px-5 py-2.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-blue-600'} font-medium text-sm transition-colors`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2.5 bg-slate-800 text-white font-medium text-sm rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-800/20 transition-all hover:shadow-slate-800/30 hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-slate-600 hover:bg-slate-100'} rounded-lg transition-colors`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`lg:hidden absolute top-20 left-0 w-full ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100'} border-b shadow-xl animate-in slide-in-from-top-2`}>
            <div className="p-4 space-y-4">
              {user && (
                <div className={`flex items-center space-x-4 p-4 ${isDark ? 'bg-gray-800' : 'bg-slate-50'} rounded-xl`}>
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white overflow-hidden">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}/uploads/${user.profilePicture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{user.email}</p>
                    <p className="text-xs text-blue-500 font-medium capitalize mt-1">{user.role?.replace('_', ' ') || 'User'}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {navLinks.map((link, idx) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={idx}
                      to={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center space-x-3 ${active
                        ? isDark
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-blue-50 text-blue-700'
                        : isDark
                          ? 'text-gray-300 hover:bg-gray-800'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {link.icon && <link.icon className={`w-5 h-5 ${active ? 'text-blue-500' : isDark ? 'text-gray-500' : 'text-slate-400'}`} />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'} space-y-2`}>
                {user ? (
                  <>
                    <button
                      onClick={() => { navigate(getBasePath() + '/profile'); setIsMenuOpen(false); }}
                      className={`w-full flex items-center justify-start space-x-3 px-4 py-3 ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-700 hover:bg-slate-50'} font-medium text-sm rounded-xl`}
                    >
                      <User className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => { navigate('/admin/settings'); setIsMenuOpen(false); }}
                      className={`w-full flex items-center justify-start space-x-3 px-4 py-3 ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-700 hover:bg-slate-50'} font-medium text-sm rounded-xl`}
                    >
                      <Settings className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center justify-start space-x-3 px-4 py-3 ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} font-medium text-sm rounded-xl`}
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-center px-4 py-3 ${isDark ? 'text-gray-300 hover:bg-gray-800 border-gray-700' : 'text-slate-700 hover:bg-slate-50 border-slate-200'} font-medium text-sm rounded-xl border`}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 bg-slate-800 text-white font-medium text-sm rounded-xl shadow-lg shadow-slate-800/20"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}