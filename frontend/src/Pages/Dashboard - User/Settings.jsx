import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../../config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';
import {
    Moon,
    Sun,
    Bell,
    Globe,
    Lock,
    Shield,
    User,
    Mail,
    Smartphone,
    Save,
    CheckCircle,
    AlertCircle,
    Trash2,
    Activity,
    RefreshCw,
    Search,
    X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        weeklyReports: true,
        language: i18n.language || 'en',
        activityLogRetention: 'manual',
        autoArchive: '30'
    });

    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${BASE_URL}/auth/users/session`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.loggedIn) {
                setUserData(data.user);
                if (data.user.settings) {
                    setSettings(prev => ({
                        ...prev,
                        activityLogRetention: data.user.settings.activityLogRetention || 'manual'
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const fetchNotifications = async (isPolling = false) => {
        if (!isPolling) setNotificationsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/notifications`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (!isPolling) showToast(t('settings.notifications.error_load', 'Failed to load notifications'), 'error');
        } finally {
            if (!isPolling) setNotificationsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch(`${BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                showToast(t('settings.notifications.all_read_success', 'All notifications marked as read'), 'success');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            showToast(t('settings.notifications.all_read_error', 'Failed to mark all as read'), 'error');
        }
    };

    const deleteNotification = async (id) => {
        try {
            const res = await fetch(`${BASE_URL}/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(prev => prev.filter(n => n._id !== id));
                showToast(t('settings.notifications.deleted_success', 'Notification deleted'), 'success');
            } else {
                showToast(data.message || 'Failed to delete notification', 'error');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast(t('settings.notifications.delete_error', 'Error deleting notification'), 'error');
        }
    };

    useEffect(() => {
        let interval;
        if (activeTab === 'notifications') {
            fetchNotifications(false); // Initial load with loading state
            // Poll every 5 seconds for live updates while on this tab
            interval = setInterval(() => fetchNotifications(true), 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab]);

    // Grouping notifications by date
    const getGroupedNotifications = () => {
        const groups = [];
        let currentLabel = null;
        let currentGroup = null;

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        notifications.forEach(notification => {
            const date = new Date(notification.createdAt);
            const dateString = date.toDateString();
            let label = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

            if (dateString === today) {
                label = t('settings.notifications.today', 'Today');
            } else if (dateString === yesterday) {
                label = t('settings.notifications.yesterday', 'Yesterday');
            }

            if (label !== currentLabel) {
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                currentLabel = label;
                currentGroup = { label: label, items: [] };
            }
            currentGroup.items.push(notification);
        });
        if (currentGroup) {
            groups.push(currentGroup);
        }
        return groups;
    };

    const notificationGroups = getGroupedNotifications();

    const handleSaveSettings = async () => {
        if (!userData) return;

        try {
            const res = await fetch(`${BASE_URL}/auth/users/${userData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: userData.name,
                    activityLogRetention: settings.activityLogRetention
                }),
                credentials: 'include'
            });

            const data = await res.json();
            if (data.success) {
                showToast(t('settings.activity.success_save', 'Settings saved successfully!'), 'success');
                setUserData(data.user);
            } else {
                showToast(data.message || 'Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast(t('settings.activity.error_save', 'Error saving settings'), 'error');
        }
    };

    const tabs = [
        { id: 'general', label: t('settings.tabs.general', 'General'), icon: User },
        { id: 'appearance', label: t('settings.tabs.appearance', 'Appearance'), icon: Sun },
        { id: 'notifications', label: t('settings.tabs.notifications', 'Notifications'), icon: Bell },
        { id: 'security', label: t('settings.tabs.security', 'Security'), icon: Shield },
        { id: 'activity', label: t('settings.tabs.activity', 'Activity Logs'), icon: Activity }
    ];

    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [activityFilter, setActivityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivities();
        }
    }, [activeTab]);

    const fetchActivities = async () => {
        setLoadingActivities(true);
        setSelectedActivities([]);
        try {
            const res = await fetch(`${BASE_URL}/activity/my-activity`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                setActivities(data.activities);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleDeleteActivities = async () => {
        if (!window.confirm(t('settings.activity.confirm_delete', 'Are you sure you want to delete {{count}} activities?', { count: selectedActivities.length }))) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${BASE_URL}/activity/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ activityIds: selectedActivities }),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                showToast(t('settings.activity.success_delete', 'Activities deleted successfully!'), 'success');
                fetchActivities();
                setSelectedActivities([]);
            } else {
                showToast(data.message || 'Failed to delete activities', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast(t('settings.activity.error_delete', 'Failed to delete activities'), 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedActivities.length === filteredActivities.length) {
            setSelectedActivities([]);
        } else {
            setSelectedActivities(filteredActivities.map(a => a._id));
        }
    };

    const toggleSelectActivity = (id) => {
        if (selectedActivities.includes(id)) {
            setSelectedActivities(selectedActivities.filter(a => a !== id));
        } else {
            setSelectedActivities([...selectedActivities, id]);
        }
    };

    const filteredActivities = activities.filter(act => {
        const matchesFilter = activityFilter === 'all' ||
            (activityFilter === 'system' && ['LOGIN', 'LOGOUT'].includes(act.action)) ||
            (activityFilter === 'issues' && ['CREATE_ISSUE', 'UPDATE_STATUS'].includes(act.action));

        const matchesSearch = searchTerm === '' ||
            act.action?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getActionColor = (action) => {
        if (['LOGIN', 'REGISTER'].includes(action)) return 'text-green-600 bg-green-100';
        if (['LOGOUT'].includes(action)) return 'text-red-600 bg-red-100';
        if (['CREATE_ISSUE', 'UPDATE_STATUS'].includes(action)) return 'text-blue-600 bg-blue-100';
        return 'text-gray-600 bg-gray-100';
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pt-20 p-6 transition-colors duration-200`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 mb-6 transition-colors duration-200`}>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.title', 'Settings')}</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{t('settings.subtitle', 'Manage your preferences and account settings')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <div className={`lg:col-span-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 h-fit transition-colors duration-200`}>
                        <nav className="space-y-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${activeTab === tab.id
                                            ? isDark
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : isDark
                                                ? 'text-gray-300 hover:bg-gray-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className={`lg:col-span-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 transition-colors duration-200`}>
                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('settings.general.title', 'General Settings')}</h2>
                                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{t('settings.general.subtitle', 'Manage your basic preferences')}</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Language Setting */}
                                    <div>
                                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                            <Globe className="w-4 h-4 inline mr-2" />
                                            {t('settings.language_label', 'Language')}
                                        </label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => {
                                                const newLang = e.target.value;
                                                setSettings({ ...settings, language: newLang });
                                                i18n.changeLanguage(newLang);
                                            }}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                                }`}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                            <option value="te">Telugu</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appearance Settings */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('settings.appearance.title', 'Appearance')}</h2>
                                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{t('settings.appearance.subtitle', 'Customize the look and feel of your dashboard')}</p>
                                </div>

                                {/* Theme Toggle */}
                                <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-6 transition-colors duration-200`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'} transition-colors duration-200`}>
                                                {isDark ? (
                                                    <Moon className="w-6 h-6 text-blue-400" />
                                                ) : (
                                                    <Sun className="w-6 h-6 text-yellow-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {isDark ? t('settings.appearance.dark_mode', 'Dark Mode') : t('settings.appearance.light_mode', 'Light Mode')}
                                                </h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {isDark ? t('settings.appearance.using_dark', 'Using dark theme') : t('settings.appearance.using_light', 'Using light theme')}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDark ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${isDark ? 'translate-x-12' : 'translate-x-1'
                                                    }`}
                                            >
                                                {isDark ? (
                                                    <Moon className="w-6 h-6 m-2 text-blue-600" />
                                                ) : (
                                                    <Sun className="w-6 h-6 m-2 text-yellow-500" />
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Settings */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('settings.notifications.title', 'Notification Preferences')}</h2>
                                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{t('settings.notifications.subtitle', 'Choose how you want to be notified')}</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Email Notifications */}
                                    <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg transition-colors duration-200`}>
                                        <div className="flex items-center space-x-3">
                                            <Mail className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                            <div>
                                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.email_title', 'Email Notifications')}</h4>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.notifications.email_desc', 'Receive email updates for your reported issues')}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNotifications}
                                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* Push Notifications */}
                                    <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg transition-colors duration-200`}>
                                        <div className="flex items-center space-x-3">
                                            <Smartphone className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                            <div>
                                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.push_title', 'Push Notifications')}</h4>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.notifications.push_desc', 'Get push notifications on your device')}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.pushNotifications}
                                                onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* Weekly Reports */}
                                    <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg transition-colors duration-200`}>
                                        <div className="flex items-center space-x-3">
                                            <Bell className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                            <div>
                                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.weekly_title', 'Weekly Summary')}</h4>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.notifications.weekly_desc', 'Receive weekly summary of nearby issues')}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.weeklyReports}
                                                onChange={(e) => setSettings({ ...settings, weeklyReports: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.history_title', 'Notification History')}</h2>
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                        >
                                            {t('settings.notifications.mark_all_read', 'Mark all as read')}
                                        </button>
                                    </div>

                                    <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg overflow-hidden`}>
                                        {notificationsLoading ? (
                                            <div className="p-12 text-center">
                                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('settings.notifications.loading', 'Loading notifications...')}</p>
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                                {notificationGroups.map((group) => (
                                                    <div key={group.label}>
                                                        {/* Date Header */}
                                                        <div className={`px-5 py-2 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 ${isDark ? 'bg-gray-800/95 text-gray-400 border-b border-gray-700' : 'bg-gray-50/95 text-gray-500 border-b border-gray-200'
                                                            }`}>
                                                            {group.label}
                                                        </div>

                                                        {group.items.map((notification) => (
                                                            <div key={notification._id} className={`p-5 transition-colors border-b last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-100'
                                                                } ${!notification.isRead ? (isDark ? 'bg-gray-600/30' : 'bg-blue-50/50') : ''}`}>
                                                                <div className="flex items-start gap-4">
                                                                    {/* Icon */}
                                                                    <div className={`p-3 rounded-full shrink-0 ${notification.type === 'STATUS_UPDATE'
                                                                        ? 'bg-green-100 text-green-600'
                                                                        : 'bg-blue-100 text-blue-600'
                                                                        }`}>
                                                                        <Bell className="w-6 h-6" />
                                                                    </div>

                                                                    {/* Content */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <h4 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                                                    {notification.type === 'STATUS_UPDATE' ? t('settings.notifications.status_update', 'Status Update') : t('settings.notifications.new_message', 'New Message')}
                                                                                </h4>
                                                                                {notification.sender && (
                                                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                                                                        {t('settings.notifications.from', { name: notification.sender?.name || t('settings.notifications.system', 'System') })}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>

                                                                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                                                                            {notification.message}
                                                                        </p>

                                                                        {notification.issueId && (
                                                                            <div className="mt-3">
                                                                                <Link
                                                                                    to={`/citizen/issue/${typeof notification.issueId === 'object' ? notification.issueId._id : notification.issueId}`}
                                                                                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                                                                                >
                                                                                    {t('settings.notifications.view_related', 'View related issue')}
                                                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                                    </svg>
                                                                                </Link>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                                        {!notification.isRead && (
                                                                            <span className="w-3 h-3 bg-blue-600 rounded-full" title="Unread"></span>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                deleteNotification(notification._id);
                                                                            }}
                                                                            className={`p-1.5 rounded-full transition-colors ${isDark
                                                                                ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                                                                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                                                }`}
                                                                            title={t('settings.notifications.delete', 'Delete notification')}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                    <Bell className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                                </div>
                                                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.notifications.no_notifications', 'No notifications')}</h3>
                                                <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('settings.notifications.all_caught_up', "You're all caught up! Check back later.")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('settings.security.title', 'Security Settings')}</h2>
                                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{t('settings.security.subtitle', 'Manage your account security')}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 transition-colors duration-200`}>
                                        <div className="flex items-center space-x-3">
                                            <Lock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                            <div className="flex-1">
                                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.security.password_title', 'Password')}</h4>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.security.password_desc', 'Reset your password')}</p>
                                            </div>
                                            <button
                                                onClick={() => navigate('/citizen/profile')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                {t('settings.security.go_profile', 'Go to Profile')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity Logs */}
                        {activeTab === 'activity' && (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.activity.title', 'My Activity Logs')}</h2>
                                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.activity.subtitle', 'Monitor your recent activities')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedActivities.length > 0 && (
                                                <button
                                                    onClick={handleDeleteActivities}
                                                    disabled={isDeleting}
                                                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {t('settings.activity.delete_btn', { count: selectedActivities.length })}
                                                </button>
                                            )}
                                            <button
                                                onClick={fetchActivities}
                                                className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                                title={t('settings.activity.refresh', 'Refresh Logs')}
                                            >
                                                <RefreshCw className={`w-5 h-5 ${loadingActivities ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Log Settings */}
                                <div className={`p-6 mb-6 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                                <RefreshCw className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings.activity.auto_delete_title', 'Auto-deletion Settings')}</h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.activity.auto_delete_desc', 'Automatically clear your activity history')}</p>
                                            </div>
                                        </div>
                                        <div className="min-w-[200px]">
                                            <select
                                                value={settings.activityLogRetention}
                                                onChange={(e) => setSettings({ ...settings, activityLogRetention: e.target.value })}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                                    }`}
                                            >
                                                <option value="7_days">{t('settings.activity.retention_7', 'After 7 days')}</option>
                                                <option value="1_month">{t('settings.activity.retention_30', 'After 1 month')}</option>
                                                <option value="manual">{t('settings.activity.retention_manual', 'Until manually deleted')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                        <input
                                            type="text"
                                            placeholder={t('settings.activity.search_placeholder', 'Search by action...')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={activityFilter}
                                            onChange={(e) => setActivityFilter(e.target.value)}
                                            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                                }`}
                                        >
                                            <option value="all">{t('settings.activity.filter_all', 'All Activities')}</option>
                                            <option value="system">{t('settings.activity.filter_system', 'System (Login/Logout)')}</option>
                                            <option value="issues">{t('settings.activity.filter_issues', 'Issues')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Logs Table */}
                                <div className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className={`${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'} text-xs uppercase tracking-wider`}>
                                                    <th className="px-6 py-3 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={filteredActivities.length > 0 && selectedActivities.length === filteredActivities.length}
                                                            onChange={toggleSelectAll}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-3 font-semibold">Action</th>
                                                    <th className="px-6 py-3 font-semibold">Details</th>
                                                    <th className="px-6 py-3 font-semibold">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                                {loadingActivities ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-8 text-center">
                                                            <div className="flex justify-center items-center gap-2">
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('settings.activity.loading_logs', 'Loading logs...')}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredActivities.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {t('settings.activity.no_activities', 'No activities found matching your filters.')}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredActivities.map((log) => (
                                                        <tr
                                                            key={log._id}
                                                            onClick={() => setSelectedActivity(log)}
                                                            className={`transition-colors cursor-pointer hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                                                        >
                                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedActivities.includes(log._id)}
                                                                    onChange={() => toggleSelectActivity(log._id)}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${isDark ? 'bg-opacity-20 border-opacity-20' : ''} ${getActionColor(log.action)}`}>
                                                                    {log.action.replace(/_/g, ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className={`text-sm max-w-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                    {log.details ? JSON.stringify(log.details).replace(/[{}"]/g, '').replace(/,/g, ', ') : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                    {new Date(log.createdAt).toLocaleString()}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end transition-colors duration-200`}>
                            <button
                                onClick={handleSaveSettings}
                                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                            >
                                <Save className="w-5 h-5" />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Details Modal */}
            {selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-lg rounded-xl shadow-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity Details</h3>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Action
                                </label>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${isDark ? 'bg-opacity-20 border-opacity-20' : ''} ${getActionColor(selectedActivity.action)}`}>
                                    {selectedActivity.action.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Time
                                    </label>
                                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {new Date(selectedActivity.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Details
                                </label>
                                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    {selectedActivity.details && typeof selectedActivity.details === 'object' ? (
                                        <div className="space-y-2">
                                            {Object.entries(selectedActivity.details).map(([key, value]) => (
                                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between text-sm py-1 border-b last:border-0 border-gray-200 dark:border-gray-700">
                                                    <span className={`font-medium capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                    </span>
                                                    <span className={`break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No additional details</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark
                                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-24 right-4 z-50 animate-slide-in">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            <style>{`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}</style>
        </div>
    );
}
