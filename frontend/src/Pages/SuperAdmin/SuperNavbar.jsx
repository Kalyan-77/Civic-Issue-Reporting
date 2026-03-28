import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, User, LogOut, Settings, Bell, Search } from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';
import { io } from 'socket.io-client';

export default function SuperAdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imageError, setImageError] = useState(false);

  const searchMappings = [
    { name: 'Dashboard', keywords: ['dashboard', 'home', 'main', 'overview'], path: '/superadmin/' },
    { name: 'All Issues', keywords: ['issues', 'tickets', 'complaints', 'all issues', 'problems', 'critical', 'pending', 'resolved'], path: '/superadmin/issues' },
    { name: 'Admins Management', keywords: ['admins', 'administrators', 'staff', 'management', 'moderators'], path: '/superadmin/admins' },
    { name: 'User Management', keywords: ['users', 'citizens', 'people', 'members', 'accounts', 'banned', 'active'], path: '/superadmin/users' },
    { name: 'Categories', keywords: ['categories', 'types', 'tags', 'departments'], path: '/superadmin/categories' },
    { name: 'Analytics', keywords: ['analytics', 'statistics', 'report', 'data', 'charts', 'graphs', 'performance'], path: '/superadmin/analytics' },
    { name: 'Messages', keywords: ['messages', 'inquiries', 'citizen messages', 'contact', 'emails', 'support'], path: '/superadmin/messages' },
    { name: 'Settings', keywords: ['settings', 'config', 'configuration', 'theme', 'dark mode', 'light mode', 'language', 'notifications'], path: '/superadmin/settings' },
    { name: 'My Profile', keywords: ['profile', 'my account', 'personal'], path: '/superadmin/profile' },
    { name: 'Create Admin', keywords: ['create admin', 'add admin', 'new admin', 'invite'], path: '/superadmin/create-admin' }
  ];

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

  // Handle click outside profile dropdown and search suggestions


  // Update active tab based on current URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/issues')) setActiveTab('All Issues');
    else if (path.includes('/admins') || path.includes('/create-admin')) setActiveTab('Admins Management');
    else if (path.includes('/users')) setActiveTab('User Management');
    else if (path.includes('/categories')) setActiveTab('Categories');
    else if (path.includes('/analytics')) setActiveTab('Analytics');
    else if (path.includes('/messages')) setActiveTab('Messages');
    else if (path.includes('/settings')) setActiveTab('Settings');
    else if (path.includes('/profile')) setActiveTab('My Profile');
    else setActiveTab('Dashboard');
  }, [location.pathname]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = searchMappings.filter(item =>
        item.keywords.some(keyword => keyword.includes(query) || query.includes(keyword))
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return;

      const match = searchMappings.find(item =>
        item.keywords.some(keyword => keyword.includes(query) || query.includes(keyword))
      );

      navigate(match ? match.path : `/superadmin/issues?search=${query}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  /* Notifications Logic */
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socketError, setSocketError] = useState(null);

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

      if (notif.type === 'CONTACT_INQUIRY') {
        navigate('/superadmin/messages');
      } else if (notif.issueId) {
        navigate(`/superadmin/issues/${notif.issueId._id || notif.issueId}`);
      }
    } catch (err) {
      console.error('Failed to handle notification click', err);
    }
  };

  // Click outside handler including notifications
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (showNotifications && !e.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (isProfileOpen && !e.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (showSuggestions && !e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [isProfileOpen, showSuggestions, showNotifications]);

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

  const navigationTabs = [
    { name: 'Dashboard', href: '/superadmin/' },
    { name: 'All Issues', href: '/superadmin/issues' },
    { name: 'Admins Management', href: '/superadmin/admins' },
    { name: 'User Management', href: '/superadmin/users' },
    { name: 'Categories', href: '/superadmin/categories' },
    { name: 'Analytics', href: '/superadmin/analytics' },
    { name: 'Messages', href: '/superadmin/messages' },
    { name: 'Settings', href: '/superadmin/settings' }
  ];

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-800 to-blue-900'} shadow-lg transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
              <div className="w-48 h-6 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-10 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-800 to-blue-900'} transition-colors duration-200 relative z-[51]`}>
        {/* Top Bar */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-2 rounded-lg transition-colors duration-200`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {/* Search Bar - Optional */}
                <div className="hidden md:block relative search-container">
                  <div className={`flex items-center ${isDark ? 'bg-gray-700/50' : 'bg-white/10'} rounded-lg px-4 py-2 backdrop-blur-sm transition-colors duration-200`}>
                    <Search className="w-4 h-4 text-white/60 mr-2" />
                    <input
                      type="text"
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearch}
                      onFocus={() => {
                        if (searchQuery.trim()) setShowSuggestions(true);
                      }}
                      className="bg-transparent text-white placeholder-white/60 text-sm outline-none w-48"
                    />
                  </div>

                  {/* Search Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-xl border py-2 z-50 transition-colors duration-200`}>
                      {suggestions.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(item.path)}
                          className={`w-full text-left px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors flex items-center space-x-2`}
                        >
                          <Search className="w-3 h-3 text-gray-400" />
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative notification-container">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white/10'} rounded-lg transition-colors`}
                  >
                    <Bell className="w-5 h-5 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-xl border py-2 z-50 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar`}>
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-white'} z-10`}>
                        <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
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
                                ? isDark ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'
                                : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'
                                  }`}></div>
                                <div>
                                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} ${!notif.isRead ? 'font-semibold' : ''}`}>
                                    {notif.message}
                                  </p>
                                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                {user && (
                  <div className="relative profile-dropdown">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white/10'} transition-colors`}
                    >
                      <span className="text-white text-sm font-medium hidden md:block">
                        Hello, {user.name?.split(' ')[0] || 'Admin'}
                      </span>
                      <div className={`w-10 h-10 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg flex items-center justify-center overflow-hidden transition-colors duration-200 relative`}>
                        {user.profilePicture && !imageError ? (
                          <img
                            src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}/uploads/${user.profilePicture}`}
                            alt="Admin"
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <span className={`${isDark ? 'text-blue-400' : 'text-blue-800'} font-semibold text-sm transition-colors duration-200 flex items-center justify-center w-full h-full`}>
                            {user.name?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className={`absolute right-0 mt-2 w-56 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-xl border py-2 z-50 transition-colors duration-200`}>
                        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                          <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'} mt-1 capitalize`}>
                            {user.role?.replace('_', ' ') || 'Super Admin'}
                          </p>
                        </div>
                        <button
                          onClick={() => window.location.href = '/superadmin/profile'}
                          className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => window.location.href = '/superadmin/settings'}
                          className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} mt-2 pt-2`}>
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
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-800 to-blue-900'} sticky top-0 z-50 shadow-lg transition-colors duration-200`}>
        <div className={`${isDark ? 'bg-gray-900/50' : 'bg-blue-900/50'} backdrop-blur-sm transition-colors duration-200`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {navigationTabs.map((tab) => (
                <Link
                  key={tab.name}
                  to={tab.href}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.name
                    ? 'text-white border-b-3 border-white bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}