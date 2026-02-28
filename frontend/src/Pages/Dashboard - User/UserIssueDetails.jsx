import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    Tag,
    Share2,
    MoreVertical,
    Navigation,
    Edit,
    Trash2,
    X,
    Save,
    Loader2
} from 'lucide-react';
import { useTheme } from '../../Context/ThemeContext';
import { BASE_URL } from '../../../config';
import LeafletMap from '../../Components/LeafletMap';

export default function UserIssueDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);

    // Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    useEffect(() => {
        if (id) {
            fetchIssueDetails();
        }
    }, [id]);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchIssueDetails = async () => {
        try {
            const res = await fetch(`${BASE_URL}/issue/${id}`, {
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setIssue(data);
                setEditFormData({
                    title: data.title || '',
                    description: data.description || '',
                    category: data.category || 'Other',
                    priority: data.priority || 'Medium',
                    area: data.location?.area || '',
                    address: data.location?.address || '',
                    latitude: data.location?.latitude || '',
                    longitude: data.location?.longitude || ''
                });
            } else {
                console.error('Failed to fetch issue details');
            }
        } catch (error) {
            console.error('Error fetching issue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const submitEdit = async () => {
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

            const res = await fetch(`${BASE_URL}/issue/edit/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedIssue = await res.json();
                setIssue(updatedIssue.issue);
                setIsEditModalOpen(false);
                showNotification('Issue updated successfully!', 'success');
            } else {
                showNotification('Failed to update issue. Please try again.', 'error');
            }
        } catch (error) {
            console.error("Error updating issue:", error);
            showNotification('An error occurred. Check console for details.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitDelete = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/issue/delete/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                showNotification('Issue deleted successfully. Redirecting...', 'success');
                setTimeout(() => navigate('/citizen'), 1500);
            } else {
                showNotification('Failed to delete issue.', 'error');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error("Error deleting issue:", error);
            showNotification('Error deleting issue.', 'error');
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col items-center justify-center`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Issue Not Found</h2>
                <button
                    onClick={() => navigate('/citizen')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const steps = [
        { label: 'Reported', date: issue.createdAt, status: 'completed' },
        {
            label: 'In Progress',
            status: ['In Progress', 'Resolved'].includes(issue.status) ? 'completed' : 'pending',
            date: issue.status === 'In Progress' ? issue.updatedAt : null
        },
        {
            label: 'Resolved',
            status: issue.status === 'Resolved' ? 'completed' : 'pending',
            date: issue.resolvedAt
        }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openGoogleMaps = () => {
        if (issue.location?.latitude && issue.location?.longitude) {
            window.open(`https://www.google.com/maps?q=${issue.location.latitude},${issue.location.longitude}`, '_blank');
        }
    };

    // Custom Modal Components
    const Modal = ({ isOpen, onClose, title, children }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
                <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                        <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const EditModalContent = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Details */}
                <div className="space-y-4">
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Basic Details</h4>
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={editFormData.title}
                            onChange={handleEditChange}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Category</label>
                            <select
                                name="category"
                                value={editFormData.category}
                                onChange={handleEditChange}
                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
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
                            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Priority</label>
                            <select
                                name="priority"
                                value={editFormData.priority}
                                onChange={handleEditChange}
                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                    }`}
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Description</label>
                        <textarea
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditChange}
                            rows="4"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                        />
                    </div>
                </div>

                {/* Right Column: Location Details */}
                <div className="space-y-4">
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Location Details</h4>
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Area / Place Name</label>
                        <input
                            type="text"
                            name="area"
                            value={editFormData.area}
                            onChange={handleEditChange}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Full Address</label>
                        <textarea
                            name="address"
                            value={editFormData.address}
                            onChange={handleEditChange}
                            rows="3"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Latitude</label>
                            <input
                                type="text"
                                name="latitude"
                                value={editFormData.latitude}
                                onChange={handleEditChange}
                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Longitude</label>
                            <input
                                type="text"
                                name="longitude"
                                value={editFormData.longitude}
                                onChange={handleEditChange}
                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                                    }`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => setIsEditModalOpen(false)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    onClick={submitEdit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>
        </div>
    );

    const DeleteModalContent = () => (
        <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
            </div>
            <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Delete Issue?</h4>
            <p className={`mb-8 max-w-sm mx-auto ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                Are you sure you want to delete this issue? This action cannot be undone and will remove it permanently.
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    onClick={submitDelete}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    Delete Issue
                </button>
            </div>
        </div>
    );

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

            <div className="max-w-7xl mx-auto">

                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Issues</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Action Buttons for Edit/Delete (Only if Pending) */}
                        {issue.status === 'Pending' && (
                            <>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-blue-400' : 'hover:bg-white hover:shadow-sm text-blue-600'}`}
                                    title="Edit Issue"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-white hover:shadow-sm text-red-600'}`}
                                    title="Delete Issue"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        <button className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-white hover:shadow-sm text-slate-500'}`}>
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content (Image & Details) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Hero Image Card */}
                        <div className={`relative rounded-3xl overflow-hidden shadow-sm border group h-[400px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <img
                                src={issue.image ? (issue.image.startsWith('http') ? issue.image : `${BASE_URL}/uploads/${issue.image}`) : 'https://placehold.co/800x400?text=No+Image'}
                                alt={issue.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => { e.target.src = 'https://placehold.co/800x400?text=No+Image' }}
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
                                <div className="transform transition-transform duration-300 group-hover:translate-y-[-5px]">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${issue.status === 'Resolved'
                                            ? 'bg-green-500/20 border-green-400 text-green-300'
                                            : issue.status === 'In Progress'
                                                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                                                : 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                                            }`}>
                                            {issue.status}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${issue.priority === 'High'
                                            ? 'bg-red-500/20 border-red-400 text-red-300'
                                            : 'bg-gray-500/20 border-gray-400 text-gray-300'
                                            }`}>
                                            {issue.priority} Priority
                                        </span>
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md border border-white/20 text-white">
                                            <Tag className="w-3 h-3" />
                                            {issue.category}
                                        </span>
                                    </div>

                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                                        {issue.title}
                                    </h1>

                                    <div className="flex items-center gap-4 text-gray-300 text-sm">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(issue.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {issue.location?.area || 'Unknown Location'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Info */}
                        <div className={`p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Description
                            </h3>
                            <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                {issue.description}
                            </p>
                        </div>

                        {/* Comments Placeholder */}
                        <div className={`p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Updates & Comments
                            </h3>
                            {issue.comments && issue.comments.length > 0 ? (
                                <div className="space-y-4">
                                    {issue.comments.map((comment, i) => {
                                        const isAdmin = comment.user?.role?.includes('admin');
                                        const isSuper = comment.user?.role === 'super_admin';
                                        const isDept = comment.user?.role === 'dept_admin';

                                        return (
                                            <div key={i} className={`p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isDark
                                                ? (isSuper ? 'bg-red-900/10 border-red-800/50' : isDept ? 'bg-blue-900/10 border-blue-800/50' : 'bg-gray-700/40 border-gray-600')
                                                : (isSuper ? 'bg-red-50 border-red-100' : isDept ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100')
                                                }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isDark
                                                            ? (isSuper ? 'bg-red-500/20 text-red-400' : isDept ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-300')
                                                            : (isSuper ? 'bg-red-100 text-red-600' : isDept ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600')
                                                            }`}>
                                                            {comment.user?.name?.charAt(0) || (isAdmin ? 'A' : 'U')}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                {isDept ? 'Dept Admin' : isSuper ? 'Super Admin' : (comment.user?.name || 'User')}
                                                            </p>
                                                            <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                                {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isAdmin && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${isSuper
                                                            ? 'bg-red-500 text-white shadow-sm shadow-red-500/20'
                                                            : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                                                            }`}>
                                                            Official Response
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`text-sm leading-relaxed ${isAdmin ? 'pl-0' : 'pl-12'} ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                                    {comment.message}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`text-center py-8 rounded-xl border border-dashed ${isDark ? 'border-gray-700 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
                                    <p>No updates yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar (Timeline & Actions) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Progress Status */}
                        <div className={`p-6 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Status Timeline</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded bg-blue-300 text-white dark:bg-blue-900 dark:text-white`}>
                                    Tracking ID: #{issue._id.slice(-6).toUpperCase()}
                                </span>
                            </div>

                            <div className="relative pl-4 space-y-0">
                                {/* Vertical Line */}
                                <div className={`absolute left-[23px] top-6 bottom-6 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}></div>

                                {steps.map((step, index) => (
                                    <div key={index} className="relative flex gap-4 pb-8 last:pb-0 group">
                                        {/* Node */}
                                        <div className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full ring-4 transition-all duration-300 ${step.status === 'completed'
                                            ? isDark ? 'bg-green-500 ring-gray-800' : 'bg-green-600 ring-white'
                                            : step.status === 'active'
                                                ? isDark ? 'bg-blue-400 ring-gray-800' : 'bg-blue-400 ring-white'
                                                : isDark ? 'bg-gray-600 ring-gray-800' : 'bg-slate-300 ring-white'
                                            }`}>
                                            {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>

                                        {/* Text details */}
                                        <div className="-mt-1.5 flex-1">
                                            <p className={`text-sm font-bold ${step.status === 'completed' || step.status === 'active'
                                                ? isDark ? 'text-white' : 'text-slate-900'
                                                : isDark ? 'text-gray-500' : 'text-slate-400'
                                                }`}>
                                                {step.label}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                {step.date ? formatDate(step.date) : (step.status === 'completed' ? 'Date Recorded' : 'Pending...')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className={`p-6 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Location Details
                            </h3>

                            <div className={`mb-4 flex items-start gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-slate-50'}`}>
                                <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-white text-blue-600 shadow-sm'}`}>
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                                        {issue.location?.area || 'Area not specified'}
                                    </p>
                                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                        {issue.location?.address || 'Precise address not available'}
                                    </p>
                                </div>
                            </div>

                            <LeafletMap
                                initialLocation={{
                                    lat: issue.location?.latitude,
                                    lng: issue.location?.longitude
                                }}
                                readOnly={true}
                            />

                            <button
                                onClick={openGoogleMaps}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Navigation className="w-4 h-4" />
                                View Route on Google Maps
                            </button>
                        </div>

                        {/* Contact Support */}
                        <div className={`p-6 rounded-3xl shadow-sm border text-center ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'}`}>
                            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-500'}`}>
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Need Help?</h4>
                            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                If this issue is critical or taking too long, contact support.
                            </p>
                            <button
                                onClick={() => navigate('/citizen/contact')}
                                className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${isDark
                                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                    : 'border-slate-300 text-slate-600 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                Contact Support
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Issue Details"
            >
                <EditModalContent />
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
            >
                <DeleteModalContent />
            </Modal>
        </div>
    );
}
