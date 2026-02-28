import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Search,
    MapPin,
    Calendar,
    Tag,
    Eye,
    Edit,
    Trash2,
    Filter,
    X,
    ChevronDown,
    Save,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';
import { BASE_URL } from '../../../config';

export default function Dashboard() {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [selectedIssues, setSelectedIssues] = useState([]);

    // Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentIssue, setCurrentIssue] = useState(null);

    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: '',
        area: '',
        address: '',
        latitude: '',
        longitude: ''
    });

    // Consolidated Filter State
    const [filters, setFilters] = useState({
        search: '',
        status: 'All',
        category: 'All',
        priority: 'All',
        sortBy: 'newest',
        fromDate: '',
        toDate: ''
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [issues, filters]);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchUserData = async () => {
        try {
            const sessionRes = await fetch(`${BASE_URL}/auth/users/session`, {
                credentials: 'include'
            });
            const sessionData = await sessionRes.json();

            if (sessionData.loggedIn) {
                setUser(sessionData.user);
                const userId = sessionData.user._id || sessionData.user.id;

                const issuesRes = await fetch(`${BASE_URL}/issue/user/${userId}`, {
                    credentials: 'include'
                });

                if (issuesRes.ok) {
                    const userIssues = await issuesRes.json();
                    const issuesList = Array.isArray(userIssues) ? userIssues : (userIssues.issues || []);
                    setIssues(issuesList);
                }
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...issues];

        // Search
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(term) ||
                issue.description.toLowerCase().includes(term) ||
                issue.category.toLowerCase().includes(term)
            );
        }

        // Status
        if (filters.status !== 'All') {
            result = result.filter(issue => issue.status === filters.status);
        }

        // Category
        if (filters.category !== 'All') {
            result = result.filter(issue => issue.category === filters.category);
        }

        // Priority
        if (filters.priority !== 'All') {
            result = result.filter(issue => issue.priority.toLowerCase() === filters.priority.toLowerCase());
        }

        // Date Range
        if (filters.fromDate) {
            const from = new Date(filters.fromDate);
            from.setHours(0, 0, 0, 0);
            result = result.filter(issue => new Date(issue.createdAt) >= from);
        }
        if (filters.toDate) {
            const to = new Date(filters.toDate);
            to.setHours(23, 59, 59, 999);
            result = result.filter(issue => new Date(issue.createdAt) <= to);
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            if (filters.sortBy === 'newest') return dateB - dateA;
            if (filters.sortBy === 'oldest') return dateA - dateB;
            return 0;
        });

        setFilteredIssues(result);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIssues(filteredIssues.map(i => i._id));
        } else {
            setSelectedIssues([]);
        }
    };

    const handleSelectIssue = (id) => {
        if (selectedIssues.includes(id)) {
            setSelectedIssues(selectedIssues.filter(i => i !== id));
        } else {
            setSelectedIssues([...selectedIssues, id]);
        }
    };

    // --- Action Handlers ---

    const handleEditClick = (issue) => {
        setCurrentIssue(issue);
        setEditFormData({
            title: issue.title || '',
            description: issue.description || '',
            category: issue.category || 'Other',
            priority: issue.priority || 'Medium',
            area: issue.location?.area || '',
            address: issue.location?.address || '',
            latitude: issue.location?.latitude || '',
            longitude: issue.location?.longitude || ''
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (issue) => {
        setCurrentIssue(issue);
        setIsDeleteModalOpen(true);
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const submitEdit = async () => {
        if (!currentIssue) return;
        setIsSubmitting(true);
        try {
            const payload = {
                title: editFormData.title,
                description: editFormData.description,
                category: editFormData.category,
                priority: editFormData.priority,
                location: {
                    area: editFormData.area,
                    address: editFormData.address,
                    latitude: editFormData.latitude,
                    longitude: editFormData.longitude
                }
            };

            const res = await fetch(`${BASE_URL}/issue/edit/${currentIssue._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedData = await res.json();
                const updatedIssue = updatedData.issue;

                // Update local state
                setIssues(prevIssues => prevIssues.map(i => i._id === updatedIssue._id ? updatedIssue : i));

                setIsEditModalOpen(false);
                showNotification('Issue updated successfully!', 'success');
            } else {
                showNotification('Failed to update issue.', 'error');
            }
        } catch (error) {
            console.error("Error updating issue:", error);
            showNotification('An error occurred.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitDelete = async () => {
        if (!currentIssue) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/issue/delete/${currentIssue._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setIssues(prevIssues => prevIssues.filter(i => i._id !== currentIssue._id));
                setIsDeleteModalOpen(false);
                showNotification('Issue deleted successfully.', 'success');
            } else {
                showNotification('Failed to delete issue.', 'error');
            }
        } catch (error) {
            console.error("Error deleting issue:", error);
            showNotification('Error deleting issue.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UI Helpers ---

    const stats = {
        total: issues.length,
        pending: issues.filter(i => i.status === 'Pending').length,
        inProgress: issues.filter(i => i.status === 'In Progress').length,
        resolved: issues.filter(i => i.status === 'Resolved').length
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500 text-white shadow-red-500/30';
            case 'medium': return 'bg-orange-500 text-white shadow-orange-500/30';
            case 'low': return 'bg-green-500 text-white shadow-green-500/30';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30 dark:text-yellow-400';
            case 'In Progress': return 'bg-blue-400/20 text-blue-600 border-blue-400/30 dark:text-blue-400';
            case 'Resolved': return 'bg-green-400/20 text-green-600 border-green-400/30 dark:text-green-400';
            default: return 'bg-gray-400/20 text-gray-600 border-gray-400/30';
        }
    };

    // --- Render ---

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const inputStyles = `w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark
        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
        }`;

    const labelStyles = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50/50'} pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative`}>

            {/* Notifications Toast */}
            {notification.show && (
                <div className={`fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-right duration-300 ${notification.type === 'success'
                    ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100'
                    : 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-10">

                {/* Hero / Header Section */}
                <div className={`rounded-3xl p-8 relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'}`}>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className={`text-4xl font-extrabold flex items-center gap-2 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Hello, {user?.name?.split(' ')[0]}! 👋
                            </h1>
                            <p className={`text-lg max-w-xl ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                Welcome back to your community hub. Track, manage, and report issues to keep your neighborhood safe and clean.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/citizen/report')}
                            className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
                            <span>Report Issue</span>
                        </button>
                    </div>
                    {/* Decorative Elements */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 ${isDark ? 'bg-blue-500' : 'bg-indigo-400'}`}></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Reports"
                        value={stats.total}
                        icon={LayoutDashboard}
                        color="blue"
                        isDark={isDark}
                    />
                    <StatCard
                        title="Pending Review"
                        value={stats.pending}
                        icon={Clock}
                        color="orange"
                        isDark={isDark}
                    />
                    <StatCard
                        title="In Progress"
                        value={stats.inProgress}
                        icon={AlertCircle}
                        color="indigo"
                        isDark={isDark}
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.resolved}
                        icon={CheckCircle2}
                        color="green"
                        isDark={isDark}
                    />
                </div>

                {/* Filters Section */}
                <div className={`p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Filter className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Filter Issues
                                </h2>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                    Narrow down your search results
                                </p>
                            </div>
                        </div>

                        {selectedIssues.length > 0 && (
                            <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
                                <span className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                                    {selectedIssues.length} Selected
                                </span>
                                <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                        checked={filteredIssues.length > 0 && selectedIssues.length === filteredIssues.length}
                                        onChange={handleSelectAll}
                                        disabled={filteredIssues.length === 0}
                                    />
                                    <span className="text-sm font-medium hover:underline">Select All</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {/* Search */}
                        <div className="lg:col-span-1 relative">
                            <label className={labelStyles}>Search</label>
                            <Search className="absolute left-4 top-[34px] w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className={`${inputStyles} pl-10`}
                            />
                        </div>

                        {/* Dropdowns */}
                        <div className="relative">
                            <label className={labelStyles}>Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>

                        <div className="relative">
                            <label className={labelStyles}>Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="All">All Categories</option>
                                <option value="Garbage">Garbage</option>
                                <option value="Streetlight">Streetlight</option>
                                <option value="Pothole">Pothole</option>
                                <option value="Water Leakage">Water Leakage</option>
                                <option value="Other">Other</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>

                        <div className="relative">
                            <label className={labelStyles}>Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="All">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>

                        <div className="relative">
                            <label className={labelStyles}>Sort Order</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                {filteredIssues.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between">
                            <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                Showing {filteredIssues.length} Issues
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredIssues.map((issue) => (
                                <div
                                    key={issue._id}
                                    className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
                                        }`}
                                >
                                    {/* Image Area */}
                                    <div className="relative h-60 w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                                        <img
                                            src={issue.image ? (issue.image.startsWith('http') ? issue.image : `${BASE_URL}/uploads/${issue.image}`) : 'https://placehold.co/600x400?text=No+Image'}
                                            alt={issue.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=No+Image' }}
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                                        {/* Top Actions */}
                                        <div className="absolute top-4 left-4">
                                            <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md p-1.5 rounded-lg shadow-sm cursor-pointer hover:bg-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={selectedIssues.includes(issue._id)}
                                                    onChange={() => handleSelectIssue(issue._id)}
                                                />
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md ${getStatusStyle(issue.status)} bg-white/90`}>
                                                {issue.status}
                                            </span>
                                        </div>

                                        {/* Bottom Overlay Info */}
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-md ${getPriorityColor(issue.priority)}`}>
                                                    {issue.priority}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/20">
                                                    <Tag className="w-3 h-3" />
                                                    {issue.category}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold truncate shadow-black drop-shadow-md">
                                                {issue.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6">
                                        <p className={`text-sm mb-6 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                            {issue.description}
                                        </p>

                                        <div className="space-y-4">
                                            {/* Location */}
                                            <div className="flex items-start gap-3">
                                                <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                                                <div>
                                                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                                                        {issue.location?.area || issue.area || 'Unknown Area'}
                                                    </p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                                                        {issue.location?.address ? issue.location.address : 'Approximate Location'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center gap-3">
                                                <Calendar className={`w-5 h-5 shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                    Reported on {formatDate(issue.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="grid grid-cols-12 gap-3 mt-8">
                                            <button
                                                onClick={() => navigate(`/citizen/issue/${issue._id}`)}
                                                className={`col-span-12 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${isDark
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                                                    }`}
                                            >
                                                View Details
                                            </button>

                                            {issue.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditClick(issue)}
                                                        className={`col-span-6 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border transition-colors ${isDark
                                                            ? 'border-gray-700 hover:bg-gray-700 text-gray-300'
                                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                                            }`}>
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(issue)}
                                                        className={`col-span-6 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border transition-colors ${isDark
                                                            ? 'border-red-900/50 hover:bg-red-900/30 text-red-400'
                                                            : 'border-red-100 hover:bg-red-50 text-red-500'
                                                            }`}>
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={`text-center py-20 rounded-3xl border border-dashed ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
                        }`}>
                        <div className={`mx-auto w-20 h-20 mb-6 rounded-full flex items-center justify-center shadow-inner ${isDark ? 'bg-gray-800 text-gray-400 shadow-black/20' : 'bg-slate-50 text-slate-400 shadow-slate-200'
                            }`}>
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            No issues found
                        </h3>
                        <p className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {filters.search || filters.status !== 'All'
                                ? "We couldn't find any issues matching your filters."
                                : "You haven't reported any issues to the community yet."}
                        </p>
                        {!filters.search && filters.status === 'All' && (
                            <button
                                onClick={() => navigate('/citizen/report')}
                                className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1"
                            >
                                Start Reporting
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900 ring-1 ring-white/10' : 'bg-white'}`}>
                        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit Issue</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Basic Details</h4>
                                    <div>
                                        <label className={labelStyles}>Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={editFormData.title}
                                            onChange={handleEditChange}
                                            className={inputStyles}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelStyles}>Category</label>
                                            <select
                                                name="category"
                                                value={editFormData.category}
                                                onChange={handleEditChange}
                                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                                    }`}
                                            >
                                                <option value="Garbage">Garbage</option>
                                                <option value="Streetlight">Streetlight</option>
                                                <option value="Pothole">Pothole</option>
                                                <option value="Water Leakage">Water Leakage</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelStyles}>Priority</label>
                                            <select
                                                name="priority"
                                                value={editFormData.priority}
                                                onChange={handleEditChange}
                                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                                    }`}
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyles}>Description</label>
                                        <textarea
                                            name="description"
                                            value={editFormData.description}
                                            onChange={handleEditChange}
                                            rows="4"
                                            className={`${inputStyles} resize-none`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Location Details</h4>
                                    <div>
                                        <label className={labelStyles}>Area / Place Name</label>
                                        <input
                                            type="text"
                                            name="area"
                                            value={editFormData.area}
                                            onChange={handleEditChange}
                                            className={inputStyles}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyles}>Full Address</label>
                                        <textarea
                                            name="address"
                                            value={editFormData.address}
                                            onChange={handleEditChange}
                                            rows="3"
                                            className={`${inputStyles} resize-none`}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelStyles}>Latitude</label>
                                            <input
                                                type="text"
                                                name="latitude"
                                                value={editFormData.latitude}
                                                onChange={handleEditChange}
                                                className={inputStyles}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelStyles}>Longitude</label>
                                            <input
                                                type="text"
                                                name="longitude"
                                                value={editFormData.longitude}
                                                onChange={handleEditChange}
                                                className={inputStyles}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className={`px-6 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitEdit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl transform transition-all scale-100 ${isDark ? 'bg-gray-900 ring-1 ring-white/10' : 'bg-white'}`}>
                        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Confirm Deletion</h3>
                            <button onClick={() => setIsDeleteModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h4 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Delete Issue?</h4>
                            <p className={`mb-8 max-w-sm mx-auto text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                Are you sure you want to delete this issue? This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className={`px-6 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitDelete}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xl shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    Delete Issue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stats Card Component
function StatCard({ title, value, icon: Icon, color, isDark }) {
    const colorMap = {
        blue: {
            light: 'bg-blue-50 text-blue-600',
            dark: 'bg-blue-500/10 text-blue-400',
        },
        orange: {
            light: 'bg-orange-50 text-orange-600',
            dark: 'bg-orange-500/10 text-orange-400',
        },
        indigo: {
            light: 'bg-indigo-50 text-indigo-600',
            dark: 'bg-indigo-500/10 text-indigo-400',
        },
        green: {
            light: 'bg-green-50 text-green-600',
            dark: 'bg-green-500/10 text-green-400',
        }
    };

    const themeConfig = colorMap[color];

    return (
        <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} border shadow-sm`}>
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${isDark ? themeConfig.dark : themeConfig.light}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div className="mt-4">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{title}</h3>
                <p className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
            </div>
        </div>
    );
}
