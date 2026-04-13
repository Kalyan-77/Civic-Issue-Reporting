import React, { useState, useEffect } from 'react';
import {
    Search,
    MapPin,
    Calendar,
    Tag,
    Filter,
    ChevronDown,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';
import { BASE_URL } from '../../../config';
import { useTranslation } from 'react-i18next';

export default function UserIssues() {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        location: '',
        state: '',
        area: '',
        status: 'All',
        category: 'All',
        priority: 'All',
        sortBy: 'newest'
    });

    useEffect(() => {
        fetchSessionAndIssues();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [issues, filters]);

    const fetchSessionAndIssues = async () => {
        try {
            // 1. Fetch Session
            const sessionRes = await fetch(`${BASE_URL}/auth/users/session`, { credentials: 'include' });
            const sessionData = await sessionRes.json();

            if (!sessionData.loggedIn) {
                navigate('/login');
                return;
            }

            // Fetch full user details to get accurate location
            const userId = sessionData.user._id || sessionData.user.id;
            const userRes = await fetch(`${BASE_URL}/auth/users/${userId}`, { credentials: 'include' });
            const userData = await userRes.json();

            let currentUser = sessionData.user;
            if (userData.success && userData.user) {
                currentUser = userData.user;
            }
            setUser(currentUser);

            // Set initial location filter if user has a location
            if (currentUser.location) {
                setFilters(prev => ({
                    ...prev,
                    location: currentUser.location.address || '',
                    state: currentUser.location.state || '',
                    area: currentUser.location.area || ''
                }));
            }

            // 2. Fetch All Issues
            const issuesRes = await fetch(`${BASE_URL}/issue/all`, { credentials: 'include' });
            if (issuesRes.ok) {
                const data = await issuesRes.json();
                const issuesList = Array.isArray(data) ? data : (data.issues || []);
                setIssues(issuesList);
                // Filter will optionally be applied by useEffect, but we can set filteredIssues here too to avoid flash
                // However, useEffect [issues, filters] will run after this update.
                // But since we just set filters with location, we rely on the effect.
            } else {
                console.error("Failed to fetch issues");
            }
        } catch (error) {
            console.error("Error loading issues:", error);
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
                issue.title?.toLowerCase().includes(term) ||
                issue.description?.toLowerCase().includes(term) ||
                issue.category?.toLowerCase().includes(term)
            );
        }

        // Location Filter (Strict or Partial Match)
        if (filters.state) {
            const filterState = filters.state.toLowerCase();
            result = result.filter(issue => {
                const issueState = issue.location?.state?.toLowerCase();
                const issueAddress = issue.location?.address?.toLowerCase() || '';

                // Match if explicit state matches OR if state is mentioned in address (fallback)
                return issueState === filterState || issueAddress.includes(filterState);
            });
        }
        if (filters.area) {
            const searchTerms = filters.area.toLowerCase().split(/\s+/).filter(Boolean);
            result = result.filter(issue => {
                const issueArea = issue.location?.area?.toLowerCase() || '';
                const issueAddress = issue.location?.address?.toLowerCase() || '';
                const issueState = issue.location?.state?.toLowerCase() || '';

                // Check if ANY search term is present in ANY location field
                return searchTerms.some(term =>
                    issueArea.includes(term) ||
                    issueAddress.includes(term) ||
                    issueState.includes(term)
                );
            });
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
            result = result.filter(issue => (issue.priority || 'Medium').toLowerCase() === filters.priority.toLowerCase());
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

    // --- Helpers ---
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
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
        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
        }`;

    const labelStyles = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50/50'} pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className={`rounded-3xl p-8 relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-white/10' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'}`}>
                    <div className="relative z-10">
                        <h1 className={`text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {filters.state ? t('community_issues.title_with_state', { state: filters.state }) : t('community_issues.title', 'Community Issues')}
                        </h1>
                        <p className={`text-lg max-w-2xl ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            {filters.state || filters.area
                                ? t('community_issues.showing_in', { location: [filters.area, filters.state].filter(Boolean).join(", ") })
                                : t('community_issues.subtitle', "Explore what's happening in your neighborhood. Stay informed about local issues and their status.")}
                        </p>
                    </div>
                    {/* Decorative Elements */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 ${isDark ? 'bg-blue-500' : 'bg-indigo-400'}`}></div>
                </div>

                {/* Filters Section */}
                <div className={`p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Filter className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {t('community_issues.filter_title', 'Filter Issues')}
                                </h2>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                    {t('community_issues.filter_desc', 'Find specific issues')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {/* Search */}
                        <div className="relative">
                            <label className={labelStyles}>{t('community_issues.search_label', 'Search')}</label>
                            <Search className="absolute left-4 top-[34px] w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={t('community_issues.search_placeholder', 'Search title...')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className={`${inputStyles} pl-10`}
                            />
                        </div>

                        {/* Area Filter */}
                        <div className="relative">
                            <label className={labelStyles}>{t('community_issues.area_label', 'Area')}</label>
                            <MapPin className="absolute left-4 top-[34px] w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={t('community_issues.area_placeholder', 'Filter by Area...')}
                                value={filters.area}
                                onChange={(e) => handleFilterChange('area', e.target.value)}
                                className={`${inputStyles} pl-10`}
                            />
                        </div>



                        {/* Dropdowns */}
                        <div className="relative">
                            <label className={labelStyles}>{t('community_issues.status_label', 'Status')}</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="All">{t('community_issues.all_status', 'All Status')}</option>
                                <option value="Pending">{t('common.pending', 'Pending')}</option>
                                <option value="In Progress">{t('common.in_progress', 'In Progress')}</option>
                                <option value="Resolved">{t('common.resolved', 'Resolved')}</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>

                        <div className="relative">
                            <label className={labelStyles}>{t('community_issues.category_label', 'Category')}</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="All">{t('community_issues.all_categories', 'All Categories')}</option>
                                <option value="Garbage">{t('report_issue.categories.garbage', 'Garbage')}</option>
                                <option value="Streetlight">{t('report_issue.categories.lights', 'Streetlight')}</option>
                                <option value="Pothole">{t('report_issue.categories.pothole', 'Pothole')}</option>
                                <option value="Water Leakage">{t('report_issue.categories.water', 'Water Leakage')}</option>
                                <option value="Other">{t('report_issue.categories.other', 'Other')}</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>

                        <div className="relative">
                            <label className={labelStyles}>{t('community_issues.priority_label', 'Priority')}</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="All">{t('community_issues.all_priorities', 'All Priorities')}</option>
                                <option value="High">{t('common.high', 'High')}</option>
                                <option value="Medium">{t('common.medium', 'Medium')}</option>
                                <option value="Low">{t('common.low', 'Low')}</option>
                            </select>
                            <ChevronDown className={`absolute right-4 top-[34px] w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>

                        <div className="relative">
                            <label className={labelStyles}>{t('community_issues.sort_label', 'Sort Order')}</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className={`${inputStyles} appearance-none cursor-pointer`}
                            >
                                <option value="newest">{t('community_issues.newest', 'Newest First')}</option>
                                <option value="oldest">{t('community_issues.oldest', 'Oldest First')}</option>
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
                                {t('community_issues.showing_count', { count: filteredIssues.length })}
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

                                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md ${getStatusStyle(issue.status)} bg-white/90`}>
                                                {t(`common.${issue.status.toLowerCase().replace(' ', '_')}`, issue.status)}
                                            </span>
                                            {issue.isReassignedToSuper && (
                                                <span className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md bg-red-600/90 text-white border-red-500/30 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {t('common.misrouted', 'Misrouted')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Bottom Overlay Info */}
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-md ${getPriorityColor(issue.priority)}`}>
                                                    {t(`common.${(issue.priority || 'Medium').toLowerCase()}`, issue.priority || 'Medium')}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/20">
                                                    <Tag className="w-3 h-3" />
                                                    {t(`report_issue.categories.${issue.category.toLowerCase().replace(' ', '_')}`, issue.category)}
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
                                                        {issue.location?.area || issue.area || t('community_issues.unknown_area', 'Unknown Area')}
                                                    </p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                                                        {issue.location?.address ? issue.location.address : t('community_issues.approx_location', 'Approximate Location')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center gap-3">
                                                <Calendar className={`w-5 h-5 shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                    {t('community_issues.reported_on', { date: formatDate(issue.createdAt), name: issue.createdBy?.name || t('community_issues.anonymous', 'Anonymous') })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="mt-8">
                                            <button
                                                onClick={() => navigate(`/citizen/issue/${issue._id}`)}
                                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${isDark
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                                                    }`}
                                            >
                                                {t('community_issues.view_details', 'View Details')}
                                            </button>
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
                            {t('community_issues.no_issues', 'No issues found')}
                        </h3>
                        <p className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {t('community_issues.no_issues_desc', "Try adjusting your filters to find what you're looking for.")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
