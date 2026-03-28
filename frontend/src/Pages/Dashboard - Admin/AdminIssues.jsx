import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Loader2, MapPin, Search, Filter,
    AlertCircle, CheckCircle, Clock,
    ChevronLeft, ChevronRight, RefreshCw,
    MessageSquare, Send, Calendar,
    User, Mail, Phone, XCircle, Trash2, X
} from "lucide-react";
import { BASE_URL } from "../../../config";
import { useTheme } from "../../Context/ThemeContext";

export default function AdminIssues() {
    const { isDark } = useTheme();
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [admin, setAdmin] = useState(null);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [reassignModal, setReassignModal] = useState({ show: false, issueId: null });
    const [reassignReason, setReassignReason] = useState("");

    // Fetch admin session and issues on mount
    useEffect(() => {
        fetchAdminSession();
    }, []);

    useEffect(() => {
        if (admin) {
            fetchAllIssues();
        }
    }, [admin]);

    // Apply filters whenever dependencies change
    useEffect(() => {
        filterIssues();
    }, [issues, searchTerm, filterStatus, filterPriority, dateRange]);

    const fetchAdminSession = async () => {
        try {
            const res = await fetch(`${BASE_URL}/auth/users/session`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (data.loggedIn && (data.user.role === "dept_admin" || data.user.role === "super_admin")) {
                setAdmin(data.user);
            } else {
                setError("Unauthorized access. Admin privileges required.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Session fetch error:", err);
            setError("Failed to fetch admin session");
            setLoading(false);
        }
    };

    const normalizeStr = (str) => str?.toLowerCase().replace(/s$/, '').trim();

    const fetchAllIssues = async () => {
        setLoading(true);
        try {
            let data;
            if (admin.role === 'dept_admin') {
                // Fetch ONLY issues assigned to this specific admin
                const res = await fetch(`${BASE_URL}/issue/admin/${admin._id || admin.id}`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => null);
                    const message = errJson?.message || 'Failed to fetch issues';
                    throw new Error(message);
                }

                const json = await res.json();
                // Endpoint returns { success, issues } or 404 when no issues
                data = Array.isArray(json) ? json : json.issues || [];
            } else {
                // Super admin sees all issues
                const res = await fetch(`${BASE_URL}/issue/all`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    console.error('Failed to fetch issues:', res.status);
                    data = [];
                } else {
                    const json = await res.json();
                    data = Array.isArray(json) ? json : json.issues || [];
                }
            }

            // Normalize priority
            const issuesWithPriority = data.map(issue => ({
                ...issue,
                priority: issue.priority || 'medium'
            }));

            setIssues(issuesWithPriority);
            setFilteredIssues(issuesWithPriority);
            setError("");
        } catch (err) {
            console.error("Error fetching issues:", err);
            setError("Failed to load issues");
        } finally {
            setLoading(false);
        }
    };

    const filterIssues = () => {
        let filtered = [...issues];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title?.toLowerCase().includes(term) ||
                issue.description?.toLowerCase().includes(term) ||
                issue.createdBy?.name?.toLowerCase().includes(term) ||
                issue._id?.toLowerCase().includes(term)
            );
        }

        if (filterStatus !== "all") {
            if (filterStatus === "Escalated") {
                filtered = filtered.filter(issue => issue.isEscalated);
            } else {
                filtered = filtered.filter(issue => issue.status === filterStatus);
            }
        }

        if (filterPriority !== "all") {
            filtered = filtered.filter(issue =>
                (issue.priority || 'medium').toLowerCase() === filterPriority.toLowerCase()
            );
        }

        if (dateRange.start) {
            filtered = filtered.filter(issue =>
                new Date(issue.createdAt) >= new Date(dateRange.start)
            );
        }
        if (dateRange.end) {
            filtered = filtered.filter(issue =>
                new Date(issue.createdAt) <= new Date(dateRange.end)
            );
        }

        // Sort by newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredIssues(filtered);
        setCurrentPage(1);
    };

    const handleStatusUpdate = async (issueId, newStatus) => {
        try {
            const res = await fetch(`${BASE_URL}/issue/update/${issueId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            const response = await res.json();
            const updatedIssue = response.issue || response;

            setIssues(issues.map(issue =>
                issue._id === issueId ? { ...issue, status: newStatus } : issue
            ));

            if (selectedIssue && selectedIssue._id === issueId) {
                setSelectedIssue({ ...selectedIssue, status: newStatus });
            }

            showToast(`Status updated to ${newStatus}`, "success");
        } catch (err) {
            console.error("Update status error:", err);
            showToast("Failed to update status", "error");
        }
    };

    const fetchComments = async (issueId) => {
        setLoadingComments(true);
        try {
            const res = await fetch(`${BASE_URL}/issue/${issueId}/comments`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch comments");
            const data = await res.json();
            setComments(data.comments || []);
        } catch (err) {
            console.error(err);
            showToast("Failed to load comments", "error");
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (issueId) => {
        if (!newComment.trim()) {
            showToast("Please enter a comment", "error");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/issue/${issueId}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    userId: admin._id || admin.id,
                    message: newComment.trim()
                }),
            });

            if (!res.ok) throw new Error("Failed to add comment");

            const data = await res.json();
            setComments(data.comments || []);
            setNewComment("");
            showToast("Comment added successfully", "success");
        } catch (err) {
            showToast("Failed to add comment", "error");
        }
    };

    const openCommentsModal = (issue) => {
        setSelectedIssue(issue);
        setShowCommentsModal(true);
        fetchComments(issue._id);
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    const handleAccept = async (issueId) => {
        try {
            await handleStatusUpdate(issueId, 'In Progress');
            showToast("Issue accepted and moved to In Progress", "success");
        } catch (error) {
            console.error(error);
        }
    };

    const handleReassign = (issueId) => {
        setReassignModal({ show: true, issueId });
        setReassignReason("");
    };

    const submitReassign = async () => {
        if (!reassignReason.trim()) {
            showToast("Please provide a reason for reassignment", "error");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/issue/reassign/${reassignModal.issueId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ reason: reassignReason })
            });

            if (!res.ok) throw new Error("Failed to reassign issue");

            // Update local state
            setIssues(issues.filter(issue => issue._id !== reassignModal.issueId));
            setFilteredIssues(filteredIssues.filter(issue => issue._id !== reassignModal.issueId));

            showToast("Issue reassigned to Super Admin", "success");
            setReassignModal({ show: false, issueId: null });
        } catch (err) {
            console.error("Reassign error:", err);
            showToast("Failed to reassign issue", "error");
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentIssues = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-white bg-red-600 dark:bg-red-700';
            case 'medium': return 'text-white bg-orange-500 dark:bg-orange-600';
            case 'low': return 'text-white bg-green-600 dark:bg-green-700';
            default: return 'text-white bg-gray-500 dark:bg-gray-600';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-white bg-red-500 dark:bg-red-600';
            case 'In Progress': return 'text-white bg-yellow-500 dark:bg-yellow-600';
            case 'Resolved': return 'text-white bg-green-600 dark:bg-green-700';
            default: return 'text-white bg-gray-500 dark:bg-gray-600';
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pt-20 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200`}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Issue Management</h1>
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Managing {filteredIssues.length} issues {admin?.role === 'dept_admin' ? `for ${admin.department}` : '(Super Admin View)'}
                        </p>
                    </div>
                    <button
                        onClick={fetchAllIssues}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Filter Bar */}
                <div className={`p-4 rounded-xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search issues..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                                    }`}
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`px-4 py-2 rounded-lg border outline-none cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                                }`}
                        >
                            <option value="all">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Escalated">Escalated</option>
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className={`px-4 py-2 rounded-lg border outline-none cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                                }`}
                        >
                            <option value="all">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className={`px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                                }`}
                        />
                    </div>
                </div>

                {/* Issues List */}
                <div className="space-y-4">
                    {currentIssues.length > 0 ? (
                        currentIssues.map((issue) => (
                            <div
                                key={issue._id}
                                className={`p-6 rounded-xl shadow-sm border transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Image */}
                                    <div className="lg:w-48 flex-shrink-0">
                                        {issue.image ? (
                                            <img
                                                src={issue.image.startsWith('http') ? issue.image : `${BASE_URL}/uploads/${issue.image}`}
                                                alt="Issue"
                                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                                onClick={() => { setSelectedIssue(issue); setShowModal(true); }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/150?text=No+Image";
                                                }}
                                            />
                                        ) : (
                                            <div className={`w-full h-32 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <span className="text-gray-400 text-sm">No Image</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                                                        {issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1) : 'Medium'}
                                                    </span>
                                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        #{issue._id.slice(-6)}
                                                    </span>
                                                </div>
                                                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    <Link to={`/admin/issues/${issue._id}`} className="hover:underline hover:text-blue-500">
                                                        {issue.title}
                                                    </Link>
                                                </h3>
                                                {issue.isEscalated && (
                                                    <div className="flex items-center gap-1 mt-1 text-red-500">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span className="text-xs font-bold uppercase">Escalated</span>
                                                    </div>
                                                )}
                                            </div>

                                            {issue.status === 'Pending' && admin?.role === 'dept_admin' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccept(issue._id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition shadow-sm"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReassign(issue._id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition shadow-sm"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reassign
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={issue.status}
                                                    onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                                                    className={`text-xs font-medium px-3 py-1.5 rounded-full outline-none cursor-pointer border-0 ${getStatusColor(issue.status)}`}
                                                >
                                                    <option className="text-gray-900 bg-white" value="Pending">Pending</option>
                                                    <option className="text-gray-900 bg-white" value="In Progress">In Progress</option>
                                                    <option className="text-gray-900 bg-white" value="Resolved">Resolved</option>
                                                </select>
                                            )}
                                        </div>

                                        {issue.isEscalated && (
                                            <div className={`text-xs p-2 rounded border ${isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                <span className="font-semibold">Escalation Reason:</span> {issue.escalationReason}
                                            </div>
                                        )}

                                        <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {issue.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{issue.location.area || issue.location.address || 'Unknown Location'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Reported By:
                                                <button
                                                    onClick={() => { setSelectedUser(issue.createdBy); setShowUserModal(true); }}
                                                    className={`ml-1 font-medium hover:underline focus:outline-none ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                                                >
                                                    {issue.createdBy?.name || 'Anonymous'}
                                                </button>
                                            </span>
                                            <button
                                                onClick={() => { openCommentsModal(issue); }}
                                                className={`text-sm flex items-center gap-1.5 font-medium ml-auto ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                Comments
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No issues found matching your filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 disabled:opacity-50' : 'bg-white disabled:opacity-50'} border shadow-sm`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className={`px-4 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 disabled:opacity-50' : 'bg-white disabled:opacity-50'} border shadow-sm`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

            </div>

            {/* Details Modal */}
            {showModal && selectedIssue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.title}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <span className="sr-only">Close</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {selectedIssue.image && (
                                <img
                                    src={selectedIssue.image.startsWith('http') ? selectedIssue.image : `${BASE_URL}/uploads/${selectedIssue.image}`}
                                    alt="Details"
                                    className="w-full h-64 object-cover rounded-xl"
                                />
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</p>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.category}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reported By</p>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.createdBy?.name || 'Anonymous'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.createdBy?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Contact</p>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.createdBy?.mobile || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.address || selectedIssue.area || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</p>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedIssue.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                                <p className={`p-4 rounded-lg bg-gray-50 dark:bg-gray-900 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {selectedIssue.description}
                                </p>
                            </div>

                            {selectedIssue.isEscalated && (
                                <div>
                                    <p className={`text-sm mb-1 font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>Escalation Details</p>
                                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                                        <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                                            <span className="font-bold">Reason:</span> {selectedIssue.escalationReason}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal */}
            {showCommentsModal && selectedIssue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-lg rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Comments</h3>
                            <button onClick={() => setShowCommentsModal(false)} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="max-h-60 overflow-y-auto space-y-3">
                                {loadingComments ? (
                                    <div className="flex justify-center py-4"><Loader2 className="animate-spin w-6 h-6 text-blue-500" /></div>
                                ) : comments.length > 0 ? (
                                    comments.map((comment, index) => (
                                        <div key={index} className="flex gap-3 group p-1.5 rounded-lg transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDark ? 'bg-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {comment.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                                            {admin && ((comment.user?._id && admin._id && comment.user._id === admin._id) || (comment.user?.id && admin.id && comment.user.id === admin.id)) ? 'You' : (comment.user?.name || 'User')}
                                                        </span>
                                                        {comment.user?.role && (comment.user.role.includes('admin')) && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                                                {comment.user.role === 'dept_admin' ? 'Dept Admin' :
                                                                    comment.user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </span>
                                                        {admin && ((comment.user?._id && admin._id && comment.user._id === admin._id) || (comment.user?.id && admin.id && comment.user.id === admin.id)) && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm('Delete this comment?')) {
                                                                        try {
                                                                            const res = await fetch(`${BASE_URL}/issue/${selectedIssue._id}/comment/${comment._id}`, {
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
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-0.5`}>{comment.message}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 text-sm">No comments yet.</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type a comment..."
                                    className={`flex-1 px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedIssue._id)}
                                />
                                <button
                                    onClick={() => handleAddComment(selectedIssue._id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>User Details</h3>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col items-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-blue-100'}`}>
                                    {selectedUser.profilePicture ? (
                                        <img
                                            src={selectedUser.profilePicture.startsWith('http') ? selectedUser.profilePicture : `${BASE_URL}/uploads/${selectedUser.profilePicture}`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                    ) : (
                                        <User className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                    )}
                                </div>
                                <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.name || 'Anonymous'}</h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Citizen</p>
                            </div>

                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg flex items-center gap-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <Mail className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg flex items-center gap-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <Phone className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</p>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.mobile || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg flex items-center gap-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <MapPin className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {typeof selectedUser.location === 'object'
                                                ? (selectedUser.location.address || `${selectedUser.location.area}, ${selectedUser.location.state}`)
                                                : (selectedUser.location || 'N/A')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reassign Modal */}
            {reassignModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-6 border-b dark:border-gray-700">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Reassign to Super Admin</h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Please provide a reason for reassigning this issue.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={reassignReason}
                                onChange={(e) => setReassignReason(e.target.value)}
                                placeholder="Enter reason here..."
                                rows="4"
                                className={`w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setReassignModal({ show: false, issueId: null })}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReassign}
                                    className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition"
                                >
                                    Confirm Reassign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast.show && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white animate-fade-in ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}
