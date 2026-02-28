import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Loader2, MapPin, Calendar, Tag, Eye, Trash2, Search, Filter,
  AlertCircle, CheckCircle, XCircle, X, Download,
  BarChart3, TrendingUp, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, Printer, RefreshCw, User,
  Users, MessageSquare, Send, Shield, UserPlus
} from "lucide-react";
import { BASE_URL } from "../../../config";
import { useTheme } from "../../Context/ThemeContext";

export default function SuperIssues() {
  const { isDark } = useTheme();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const location = useLocation();
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [issueToAssign, setIssueToAssign] = useState(null);
  const [deptAdmins, setDeptAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  /* Removed duplicate loadingAdmins */

  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [issueToEscalate, setIssueToEscalate] = useState(null);
  const [escalationReason, setEscalationReason] = useState("");

  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
    Resolved: "bg-green-100 text-green-800 border-green-300"
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-700 border-gray-300",
    medium: "bg-orange-100 text-orange-700 border-orange-300",
    high: "bg-red-100 text-red-700 border-red-300"
  };

  const categoryIcons = {
    Garbage: "🗑️",
    Streetlight: "💡",
    Pothole: "🕳️",
    "Water Leakage": "💧",
    Other: "📋"
  };

  // Map categories to department names
  const categoryToDepartment = {
    Garbage: "Garbage",
    Streetlight: "Streetlight",
    Pothole: "Potholes",
    "Water Leakage": "Water Leakage",
    Other: "Other"
  };

  useEffect(() => {
    fetchAdminSession();
  }, []);

  useEffect(() => {
    if (admin) {
      fetchAllIssues();
    }
  }, [admin]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setFilterCategory(decodeURIComponent(categoryParam));
    }
  }, [location]);

  useEffect(() => {
    filterAndSortIssues();
  }, [issues, searchTerm, filterStatus, filterCategory, filterPriority, sortBy, dateRange, showEscalatedOnly]);

  useEffect(() => {
    if (showModal || showDeleteModal || showStatsModal || showCommentsModal || showAssignModal || showEscalateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModal, showDeleteModal, showStatsModal, showCommentsModal, showAssignModal, showEscalateModal]);

  const fetchAdminSession = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/users/session`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.loggedIn && data.user.role === "super_admin") {
        setAdmin(data.user);
      } else {
        setError("Unauthorized access. Super Admin privileges required.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Session fetch error:", err);
      setError("Failed to fetch admin session");
      setLoading(false);
    }
  };

  const fetchAllIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/issue/all`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch issues");

      const data = await res.json();
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

  const fetchDeptAdminsByCategory = async (category) => {
    setLoadingAdmins(true);
    try {
      const department = categoryToDepartment[category];
      const res = await fetch(`${BASE_URL}/auth/users/dept-admins/department/${department}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch department admins");

      const data = await res.json();
      setDeptAdmins(data.admins || []);
    } catch (err) {
      console.error("Error fetching dept admins:", err);
      showToast("Failed to load department admins", "error");
      setDeptAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const openAssignModal = (issue) => {
    setIssueToAssign(issue);
    setShowAssignModal(true);
    setSelectedAdmin("");
    fetchDeptAdminsByCategory(issue.category);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setIssueToAssign(null);
    setSelectedAdmin("");
    setDeptAdmins([]);
  };

  const handleAssignIssue = async () => {
    if (!selectedAdmin) {
      showToast("Please select an admin", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/issue/assign/${issueToAssign._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // This sends the session cookie
        body: JSON.stringify({
          adminId: selectedAdmin
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to assign issue");
      }

      const data = await res.json();

      // Update the issues list with the assigned issue
      setIssues(issues.map(issue =>
        issue._id === issueToAssign._id ? data.issue : issue
      ));

      showToast("Issue assigned successfully", "success");
      closeAssignModal();

      // Refresh issues to get updated data
      fetchAllIssues();
    } catch (err) {
      console.error("Error assigning issue:", err);
      showToast(err.message || "Failed to assign issue", "error");
    }
  };

  const openEscalateModal = (issue) => {
    setIssueToEscalate(issue);
    setShowEscalateModal(true);
    setEscalationReason(issue.escalationReason || "");
  };

  const closeEscalateModal = () => {
    setShowEscalateModal(false);
    setIssueToEscalate(null);
    setEscalationReason("");
  };

  const handleEscalateIssue = async () => {
    if (!escalationReason.trim()) {
      showToast("Please provide an escalation reason", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/issue/escalate/${issueToEscalate._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isEscalated: true,
          escalationReason: escalationReason.trim()
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to escalate issue");
      }

      const data = await res.json();

      // Update the issues list
      setIssues(issues.map(issue =>
        issue._id === issueToEscalate._id ? data.issue : issue
      ));

      showToast("Issue escalated successfully", "success");
      closeEscalateModal();
      fetchAllIssues();
    } catch (err) {
      console.error("Error escalating issue:", err);
      showToast(err.message || "Failed to escalate issue", "error");
    }
  };

  const handleDeescalateIssue = async (issueId) => {
    try {
      const res = await fetch(`${BASE_URL}/issue/escalate/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isEscalated: false,
          escalationReason: ""
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to de-escalate issue");
      }

      const data = await res.json();

      // Update the issues list
      setIssues(issues.map(issue =>
        issue._id === issueId ? data.issue : issue
      ));

      showToast("Issue de-escalated successfully", "success");
      fetchAllIssues();
    } catch (err) {
      console.error("Error de-escalating issue:", err);
      showToast(err.message || "Failed to de-escalate issue", "error");
    }
  };

  const fetchComments = async (issueId) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${BASE_URL}/issue/${issueId}/comments`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch comments");

      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
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
        headers: {
          "Content-Type": "application/json",
        },
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
      console.error("Error adding comment:", err);
      showToast("Failed to add comment", "error");
    }
  };

  const openCommentsModal = (issue) => {
    setSelectedIssue(issue);
    setShowCommentsModal(true);
    fetchComments(issue._id);
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedIssue(null);
    setComments([]);
    setNewComment("");
  };

  const filterAndSortIssues = () => {
    let filtered = [...issues];

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(issue => issue.status === filterStatus);
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(issue => issue.category === filterCategory);
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter(issue => issue.priority === filterPriority);
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

    if (showEscalatedOnly) {
      filtered = filtered.filter(issue => issue.isEscalated);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredIssues(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (issueId) => {
    try {
      const res = await fetch(`${BASE_URL}/issue/delete/${issueId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete issue");

      setIssues(issues.filter(issue => issue._id !== issueId));
      setShowDeleteModal(false);
      setIssueToDelete(null);
      showToast("Issue deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete issue", "error");
    }
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
        issue._id === issueId ? updatedIssue : issue
      ));

      showToast(`Status updated to ${newStatus}`, "success");
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const openDeleteModal = (issue) => {
    setIssueToDelete(issue);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setIssueToDelete(null);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const openModal = (issue) => {
    setSelectedIssue(issue);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIssue(null);
  };

  const exportToCSV = () => {
    const headers = ["Issue ID", "Title", "Category", "Description", "Status", "Priority", "Reported By", "Assigned To", "User Email", "Location", "Date"];
    const rows = filteredIssues.map((issue, index) => [
      `#${issue._id?.slice(-6).toUpperCase() || index}`,
      issue.title,
      issue.category,
      issue.description,
      issue.status,
      issue.priority,
      issue.createdBy?.name || "Unknown",
      issue.assignedTo?.name || "Unassigned",
      issue.createdBy?.email || "N/A",
      issue.location.address || `${issue.location.latitude}, ${issue.location.longitude}`,
      new Date(issue.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_issues_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast("Issues exported successfully", "success");
  };

  const printIssues = () => {
    const printWindow = window.open("", "_blank");
    const issuesHTML = filteredIssues.map((issue, index) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">#${issue._id?.slice(-6).toUpperCase() || index}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${issue.category}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${issue.title}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${issue.status}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${issue.priority}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${issue.createdBy?.name || "Unknown"}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${issue.assignedTo?.name || "Unassigned"}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(issue.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>All Issues Report - Super Admin</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4A5568; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
            td { padding: 8px; }
          </style>
        </head>
        <body>
          <h1>All Issues Report</h1>
          <p style="text-align: center; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Reported By</th>
                <th>Assigned To</th>
                <th>Reported Date</th>
              </tr>
            </thead>
            <tbody>
              ${issuesHTML}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStats = () => {
    return {
      total: issues.length,
      pending: issues.filter(i => i.status === "Pending").length,
      inProgress: issues.filter(i => i.status === "In Progress").length,
      resolved: issues.filter(i => i.status === "Resolved").length,
      critical: issues.filter(i => i.priority === "high").length,
      escalated: issues.filter(i => i.isEscalated === true).length,
      uniqueUsers: new Set(issues.map(i => i.createdBy?._id).filter(Boolean)).size
    };
  };

  const getCategoryStats = () => {
    const stats = {};
    issues.forEach(issue => {
      stats[issue.category] = (stats[issue.category] || 0) + 1;
    });
    return stats;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedIssues = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading all issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-lg max-w-md text-center`}>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Error</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const categoryStats = getCategoryStats();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pt-4 pb-12 transition-colors duration-200`}>
      <style>
        {`
          /* Hide scrollbar for Chrome, Safari and Opera */
          ::-webkit-scrollbar {
            display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          html {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Issue Management</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>All Reported Issues Across All Categories</p>
            </div>
            <button
              onClick={fetchAllIssues}
              className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg transition-all cursor-pointer`}
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-500 rounded-lg shadow-sm p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Issues</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-orange-500 rounded-lg shadow-sm p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Pending</p>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </div>

          <div className="bg-purple-500 rounded-lg shadow-sm p-6 text-white">
            <p className="text-sm opacity-90 mb-1">In Progress</p>
            <p className="text-3xl font-bold">{stats.inProgress}</p>
          </div>

          <div className="bg-red-500 rounded-lg shadow-sm p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Critical</p>
            <p className="text-3xl font-bold">{stats.critical}</p>
          </div>

          <div className="bg-amber-600 rounded-lg shadow-sm p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Escalated</p>
            <p className="text-3xl font-bold">{stats.escalated}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Filter by Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' : 'border-gray-300 bg-white focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
              >
                <option value="all">All Categories</option>
                <option value="Garbage">Garbage</option>
                <option value="Streetlight">Street Light Issue</option>
                <option value="Pothole">Road Issue</option>
                <option value="Water Leakage">Water Supply Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' : 'border-gray-300 bg-white focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Priority:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' : 'border-gray-300 bg-white focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Date:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' : 'border-gray-300 bg-white focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                placeholder="04/01/2024"
              />
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterCategory("all");
                setFilterPriority("all");
                setDateRange({ start: "", end: "" });
                setSortBy("newest");
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer font-medium"
            >
              Apply Filter
            </button>
          </div>
        </div>



        {/* Escalation Filter Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="escalatedOnly"
            checked={showEscalatedOnly}
            onChange={(e) => setShowEscalatedOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="escalatedOnly" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} cursor-pointer select-none`}>
            Show Escalated Issues Only
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredIssues.length)} of {filteredIssues.length} issues
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={printIssues}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Issues Table */}
        {filteredIssues.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center`}>
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>No issues found</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || filterStatus !== "all" || filterCategory !== "all" || filterPriority !== "all"
                ? "Try adjusting your filters"
                : "No issues have been reported yet"}
            </p>
          </div>
        ) : (
          <>
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border overflow-hidden mb-6`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Issue ID</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Category</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Description</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Status</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Priority</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Reported By</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Assigned To</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Reported Date</th>
                      <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {paginatedIssues.map((issue, index) => (
                      <tr key={issue._id} className={`${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>#{issue._id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{issue.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'} max-w-xs truncate`}>
                            <Link to={`/superadmin/issues/${issue._id}`} className="hover:underline">
                              {issue.title}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={issue.status}
                            onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${issue.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : issue.status === "In Progress"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-green-100 text-green-800 border-green-300"
                              }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColors[issue.priority]}`}>
                              {issue.priority === "high" ? "High" : issue.priority === "medium" ? "Medium" : "Low"}
                            </span>
                            {issue.isEscalated && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-600 text-white border-red-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Escalated
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{issue.createdBy?.name || "Unknown"}</div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{issue.createdBy?.email || "N/A"}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {issue.assignedTo ? (
                            <div className="text-sm">
                              <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{issue.assignedTo?.name || "Unknown"}</div>
                              <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{issue.assignedTo?.email || ""}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(issue)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              Assign
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                            {new Date(issue.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">

                            <button
                              onClick={() => openCommentsModal(issue)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-purple-400 hover:bg-gray-700' : 'text-purple-600 hover:bg-purple-50'}`}
                              title="Comments"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            {!issue.isEscalated ? (
                              <button
                                onClick={() => openEscalateModal(issue)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-orange-400 hover:bg-gray-700' : 'text-orange-600 hover:bg-orange-50'}`}
                                title="Escalate"
                              >
                                <AlertTriangle className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeescalateIssue(issue._id)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50'}`}
                                title="De-escalate"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => openDeleteModal(issue)}
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${currentPage === 1
                    ? `${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                    : `${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-2">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : `${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 py-2 text-gray-500">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${currentPage === totalPages
                          ? "bg-blue-600 text-white"
                          : `${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                          }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${currentPage === totalPages
                    ? `${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                    : `${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                    }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Issue Modal */}
      {
        showAssignModal && issueToAssign && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={closeAssignModal}
          >
            <div
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-6 h-6" />
                  Assign Issue
                </h2>
                <button
                  onClick={closeAssignModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Issue Details</h3>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{issueToAssign.title}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Category: <span className="font-medium">{issueToAssign.category}</span>
                  </p>
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Select Department Admin:
                  </label>
                  {loadingAdmins ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : deptAdmins.length === 0 ? (
                    <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p>No department admins available for {issueToAssign.category}</p>
                    </div>
                  ) : (
                    <select
                      value={selectedAdmin}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' : 'border-gray-300 bg-white focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                    >
                      <option value="">-- Select Admin --</option>
                      {deptAdmins.map(admin => (
                        <option key={admin._id} value={admin._id}>
                          {admin.name} ({admin.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeAssignModal}
                    className={`flex-1 px-4 py-2.5 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg font-medium transition-colors cursor-pointer`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignIssue}
                    disabled={!selectedAdmin || loadingAdmins}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${!selectedAdmin || loadingAdmins
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    Assign Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* View Details Modal */}
      {
        showModal && selectedIssue && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={closeModal}
          >
            <div
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>{`
              .bg-white::-webkit-scrollbar {
                display: none;
              }
            `}</style>

              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-white">Issue Details</h2>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {selectedIssue.image && (
                  <img
                    src={selectedIssue.image.startsWith('http') ? selectedIssue.image : `${BASE_URL}/uploads/${selectedIssue.image}`}
                    alt={selectedIssue.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Title</h3>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.title}</p>
                  </div>

                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Description</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedIssue.description}</p>
                  </div>

                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reported By</h3>
                    <div className={`flex items-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.createdBy?.name || "Unknown"}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedIssue.createdBy?.email || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Category</h3>
                      <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{categoryIcons[selectedIssue.category]} {selectedIssue.category}</p>
                    </div>

                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Priority</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${priorityColors[selectedIssue.priority]}`}>
                        {selectedIssue.priority.charAt(0).toUpperCase() + selectedIssue.priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Status</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[selectedIssue.status]}`}>
                      {selectedIssue.status}
                    </span>
                  </div>

                  {selectedIssue.isEscalated && (
                    <div className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>Escalated Issue</h3>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        <span className="font-semibold">Reason:</span> {selectedIssue.escalationReason}
                      </p>
                    </div>
                  )}

                  {selectedIssue.assignedTo && (
                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Assigned To</h3>
                      <div className={`flex items-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                        <Shield className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedIssue.assignedTo?.name || "Unknown"}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {selectedIssue.assignedTo?.email || "N/A"} • {selectedIssue.assignedTo?.department || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Location</h3>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'} flex items-start gap-2`}>
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      {selectedIssue.location.address || `Lat: ${selectedIssue.location.latitude}, Long: ${selectedIssue.location.longitude}`}
                    </p>
                  </div>

                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reported On</h3>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedIssue.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(selectedIssue.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Comments Modal */}
      {
        showCommentsModal && selectedIssue && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={closeCommentsModal}
          >
            <div
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Comments - {selectedIssue.title}
                </h2>
                <button
                  onClick={closeCommentsModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '60vh' }}>
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div key={index} className={`rounded-lg p-4 group transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {admin && ((comment.user?._id && admin._id && comment.user._id === admin._id) || (comment.user?.id && admin.id && comment.user.id === admin.id)) ? 'You' : (comment.user?.name || "Unknown User")}
                                </span>
                                {comment.user?.role && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                    {comment.user.role === 'dept_admin' ? 'Dept Admin' :
                                      comment.user.role === 'super_admin' ? 'Super Admin' :
                                        comment.user.role === 'citizen' ? 'Citizen' : comment.user.role}
                                  </span>
                                )}
                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
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
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{comment.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedIssue._id)}
                    placeholder="Add a comment..."
                    className={`flex-1 px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-purple-500' : 'border-gray-300 bg-white focus:ring-purple-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                  />
                  <button
                    onClick={() => handleAddComment(selectedIssue._id)}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Escalate Issue Modal */}
      {
        showEscalateModal && issueToEscalate && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={closeEscalateModal}
          >
            <div
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Escalate Issue
                </h2>
                <button
                  onClick={closeEscalateModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Issue Details</h3>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{issueToEscalate.title}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Category: <span className="font-medium">{issueToEscalate.category}</span>
                  </p>
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Escalation Reason: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Please provide a detailed reason for escalating this issue..."
                    rows="4"
                    className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-orange-500' : 'border-gray-300 bg-white focus:ring-orange-500'} rounded-lg focus:ring-2 focus:border-transparent resize-none`}
                  />
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    This issue will be marked as high priority and flagged for immediate attention.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeEscalateModal}
                    className={`flex-1 px-4 py-2.5 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg font-medium transition-colors cursor-pointer`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEscalateIssue}
                    disabled={!escalationReason.trim()}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${!escalationReason.trim()
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                  >
                    Escalate Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && issueToDelete && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={closeDeleteModal}
          >
            <div
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 ${isDark ? 'bg-red-900/50' : 'bg-red-100'} rounded-full`}>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>

                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-center mb-2`}>
                  Delete Issue?
                </h3>

                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-center mb-6`}>
                  Are you sure you want to delete "<strong>{issueToDelete.title}</strong>"? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className={`flex-1 px-4 py-2.5 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg font-medium transition-colors cursor-pointer`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(issueToDelete._id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Toast Notification */}
      {
        toast.show && (
          <div className="fixed top-24 right-4 z-50 animate-slide-in">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
              }`}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )
      }

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
    </div >
  );
}