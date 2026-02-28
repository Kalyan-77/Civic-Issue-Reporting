import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Loader2, MapPin, Calendar, CheckCircle,
    MessageSquare, Send, User, ChevronLeft,
    AlertTriangle, Shield, TrendingUp, MoreHorizontal,
    Flag, ArrowRight, CornerUpRight, ChevronDown, Share2, Map,
    X, Trash2
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';
import LeafletMap from '../../Components/LeafletMap';

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [user, setUser] = useState(null);
    const [addingComment, setAddingComment] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [profileImgError, setProfileImgError] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        setProfileImgError(false); // Reset profile image error state
        fetchUserSession();
        fetchIssueDetails();
        fetchComments();
    }, [id]);

    const fetchUserSession = async () => {
        try {
            const res = await fetch(`${BASE_URL}/auth/users/session`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (data.loggedIn) {
                setUser(data.user);
            }
        } catch (err) {
            console.error("Session fetch error:", err);
        }
    };

    const fetchIssueDetails = async () => {
        try {
            const res = await fetch(`${BASE_URL}/issue/${id}`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch issue details");
            const data = await res.json();
            setIssue(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`${BASE_URL}/issue/${id}/comments`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return;
        setAddingComment(true);
        try {
            const res = await fetch(`${BASE_URL}/issue/${id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    userId: user._id || user.id,
                    message: newComment.trim()
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
                setNewComment("");
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        } finally {
            setAddingComment(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const res = await fetch(`${BASE_URL}/issue/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setIssue(prev => ({ ...prev, status: newStatus }));
                setStatusDropdownOpen(false);
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const handleEscalate = async () => {
        alert("Escalation feature coming soon!");
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-500 text-white border-green-600';
            case 'In Progress': return 'bg-orange-400 text-white border-orange-500';
            default: return 'bg-yellow-400 text-yellow-900 border-yellow-500';
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500 text-white';
            case 'medium': return 'bg-orange-400 text-white';
            default: return 'bg-green-500 text-white';
        }
    };

    const handleUserClick = async (userId) => {
        try {
            const res = await fetch(`${BASE_URL}/auth/users/${userId}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedUser(data.user);
                setShowUserModal(true);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !issue) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <p className={isDark ? 'text-white' : 'text-gray-900'}>{error || "Issue not found"}</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} pt-6 pb-12 px-4 sm:px-6 lg:px-8 font-sans`}>
            <div className={`max-w-7xl mx-auto rounded-xl p-6 ${isDark ? 'bg-gray-800 shadow-2xl' : 'bg-gray-50'}`}>

                {/* Breadcrumbs & Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                        <Link to="#" onClick={() => navigate(-1)} className="hover:text-blue-600 font-medium">Issue Details</Link>
                        <span>/</span>
                        <span className="text-gray-400">Issue details</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Issue #{issue._id.slice(-5).toUpperCase()} - {issue.title}
                        </h1>
                        <div className="flex gap-3">
                            <button className={`px-4 py-2 rounded-lg border bg-white flex items-center gap-2 text-sm font-medium shadow-sm hover:bg-gray-50 transition ${isDark ? 'bg-gray-700 border-gray-600 text-black hover:bg-gray-600' : 'text-gray-700 border-gray-300'}`}>
                                <Map className="w-4 h-4" /> Map
                            </button>
                            <button className={`px-4 py-2 rounded-lg border bg-white flex items-center gap-2 text-sm font-medium shadow-sm hover:bg-gray-50 transition ${isDark ? 'bg-gray-700 border-gray-600 text-black hover:bg-gray-600' : 'text-gray-700 border-gray-300'}`}>
                                <MoreHorizontal className="w-4 h-4" /> More <ChevronDown className="w-3 h-3 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* User Profile Card */}
                        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0 ${isDark ? 'bg-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {issue.createdBy?.profilePicture && issue.createdBy.profilePicture !== 'default-profile.png' && !profileImgError ? (
                                        <img
                                            src={issue.createdBy.profilePicture.startsWith('http')
                                                ? issue.createdBy.profilePicture
                                                : `${BASE_URL}/uploads/${issue.createdBy.profilePicture}`}
                                            alt="Profile"
                                            className="w-full h-full rounded-lg object-cover"
                                            onError={() => setProfileImgError(true)}
                                        />
                                    ) : (
                                        issue.createdBy?.name?.charAt(0).toUpperCase() || <User />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        <button onClick={() => handleUserClick(issue.createdBy?._id)} className="hover:underline text-left">
                                            {issue.createdBy?.name || 'Anonymous'}
                                        </button>
                                    </h3>
                                    <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{issue.createdBy?.email}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{issue.createdBy?.mobile || '+1 555-123-4567'}</p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Reported on: {new Date(issue.createdAt).toLocaleDateString()} at {new Date(issue.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        {issue.image && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                    <img
                                        src={issue.image.startsWith('http')
                                            ? issue.image
                                            : `${BASE_URL}/uploads/${issue.image}`}
                                        alt="Current State"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 relative bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-gray-400" />
                                    <span className="absolute bottom-2 text-xs text-gray-500">Location Context</span>
                                </div>
                            </div>
                        )}

                        {/* Description Text */}
                        <div>
                            <p className={`text-gray-600 dark:text-gray-300 leading-relaxed text-sm`}>
                                {issue.description} This issue is causing significant inconvenience to the local residents and needs immediate attention from the relevant department.
                            </p>
                        </div>

                        {/* Description / Comments Input Section */}
                        <div>
                            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Description</h3>
                            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`flex items-center gap-2 p-2 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white`}>
                                            <input
                                                type="text"
                                                placeholder="Add a comment..."
                                                className="flex-1 bg-transparent outline-none text-sm"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                            />
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <button className="p-1 hover:text-blue-500"><CornerUpRight className="w-4 h-4" /></button>
                                                <button className="p-1 hover:text-blue-500"><Share2 className="w-4 h-4" /></button>
                                                <button
                                                    className="p-1 hover:text-blue-500 text-blue-600"
                                                    onClick={handleAddComment}
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments List (Left Column Style based on 'Description' header in screenshot) */}
                                <div className="mt-6 space-y-6 pl-12">
                                    {comments.map((comment, index) => (
                                        <div key={index} className="relative group p-2 rounded-lg transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {user && ((comment.user?._id && user._id && comment.user._id === user._id) || (comment.user?.id && user.id && comment.user.id === user.id)) ? 'You' : (comment.user?.name || 'User')}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${comment.user?.role?.includes('admin') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                                {comment.user?.role === 'dept_admin' ? 'Dept Admin' :
                                                                    comment.user?.role === 'super_admin' ? 'Super Admin' :
                                                                        comment.user?.role === 'citizen' ? 'Citizen' : 'User'}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        {user && ((comment.user?._id && user._id && comment.user._id === user._id) || (comment.user?.id && user.id && comment.user.id === user.id)) && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm('Delete this comment?')) {
                                                                        try {
                                                                            const res = await fetch(`${BASE_URL}/issue/${issue._id}/comment/${comment._id}`, {
                                                                                method: 'DELETE',
                                                                                credentials: 'include'
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                setComments(data.comments);
                                                                            }
                                                                        } catch (err) {
                                                                            console.error("Delete error:", err);
                                                                        }
                                                                    }
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all cursor-pointer p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                title="Delete comment"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{comment.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">

                        {/* Status Card */}
                        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 items-center">
                                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status:</span>
                                    <span className={`col-span-2 inline-flex w-fit px-3 py-1 text-xs font-bold rounded shadow-sm ${getStatusStyle(issue.status)}`}>
                                        <div className="flex items-center gap-1">
                                            {issue.status === 'Resolved' ? <CheckCircle className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                            {issue.status}
                                        </div>
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority:</span>
                                    <span className={`col-span-2 inline-flex w-fit px-3 py-1 text-xs font-bold rounded shadow-sm ${getPriorityStyle(issue.priority)}`}>
                                        {issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1) : 'Medium'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 items-start">
                                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category:</span>
                                    <span className={`col-span-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{issue.category}</span>
                                </div>
                                <div className="grid grid-cols-3 items-start">
                                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Address:</span>
                                    <span className={`col-span-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} break-words`}>
                                        {issue.location?.address || issue.location?.area || 'Location details not available'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Latitude:</span>
                                    <span className={`col-span-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{issue.location?.latitude?.toFixed(4)}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center">
                                    <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Longitude:</span>
                                    <span className={`col-span-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{issue.location?.longitude?.toFixed(4)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => handleStatusUpdate('Resolved')}
                                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-md font-semibold text-sm shadow flex items-center justify-center gap-2 transition"
                            >
                                <CheckCircle className="w-4 h-4" /> Mark Resolved
                            </button>
                            <button
                                onClick={handleEscalate}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-semibold text-sm shadow flex items-center justify-center gap-2 transition"
                            >
                                <AlertTriangle className="w-4 h-4" /> Escalate Issue
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                    className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-sm shadow flex items-center justify-center gap-2 transition"
                                >
                                    <TrendingUp className="w-4 h-4" /> Change Status <ChevronDown className="w-4 h-4 ml-1" />
                                </button>
                                {statusDropdownOpen && (
                                    <div className={`absolute top-full mt-1 left-0 w-full rounded-lg shadow-xl border z-20 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        {['Pending', 'In Progress', 'Resolved'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(status)}
                                                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-blue-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map & Comments Right Sidebar Block */}
                        <div className="space-y-6">
                            <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm relative z-0">
                                <LeafletMap
                                    initialLocation={{
                                        lat: issue.location?.latitude,
                                        lng: issue.location?.longitude
                                    }}
                                    readOnly={true}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Comments</h3>
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No comments in this thread.</p>
                                    ) : (
                                        comments.slice(0, 3).map((comment, index) => (
                                            <div key={index} className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDark ? 'bg-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {user && ((comment.user?._id && user._id && comment.user._id === user._id) || (comment.user?.id && user.id && comment.user.id === user.id)) ? 'You' : (comment.user?.name || 'User')}
                                                        </span>
                                                        <span className="text-xs text-gray-400">1 day ago</span>
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded text-white ${comment.user?.role?.includes('admin') ? 'bg-blue-600' : 'bg-gray-500'}`}>
                                                        {comment.user?.role === 'dept_admin' ? 'Dept Admin' :
                                                            comment.user?.role === 'super_admin' ? 'Super Admin' :
                                                                comment.user?.role === 'citizen' ? 'Citizen' : 'User'}
                                                    </span>
                                                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>
                                                        {comment.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                        {/* Header Background */}
                        <div className={`h-24 ${isDark ? 'bg-blue-900' : 'bg-blue-600'}`}></div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowUserModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="px-6 pb-6 relative">
                            {/* Profile Image */}
                            <div className={`-mt-12 mb-4 w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold shadow-lg ${isDark ? 'border-gray-800 bg-gray-700' : 'border-white bg-blue-100 text-blue-600'}`}>
                                {selectedUser.profilePicture && selectedUser.profilePicture !== 'default-profile.png' ? (
                                    <img
                                        src={selectedUser.profilePicture.startsWith('http')
                                            ? selectedUser.profilePicture
                                            : `${BASE_URL}/uploads/${selectedUser.profilePicture}`}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = selectedUser.name?.charAt(0).toUpperCase(); }}
                                    />
                                ) : (
                                    selectedUser.name?.charAt(0).toUpperCase() || <User />
                                )}
                            </div>

                            {/* User Info */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedUser.role === 'citizen' ? 'Citizen' : 'Admin'}</p>
                            </div>

                            <div className="space-y-4">
                                <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                                        <p className="font-medium text-sm break-all">{selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                        <Share2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mobile Number</p>
                                        <p className="font-medium text-sm">{selectedUser.mobile || "N/A"}</p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                                        <p className="font-medium text-sm">
                                            {typeof selectedUser.location === 'object'
                                                ? (selectedUser.location.address || `${selectedUser.location.area}, ${selectedUser.location.state}`)
                                                : (selectedUser.location || "Not Provided")}
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Issues Reported</p>
                                        <p className="font-bold text-lg">{selectedUser.issuesReported || 0}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueDetails;
