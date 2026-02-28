import React, { useState, useEffect } from 'react';
import {
  Search, Download, Edit, Eye, Ban, UserCheck, X, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Trash2, Save, Users, UserX, Calendar, Activity
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

const UserManagement = () => {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    location: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newUsersThisMonth: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/auth/users/users`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Filter only citizens (exclude admins) and map status
        const citizenUsers = data.users
          .filter(user => user.role !== 'dept_admin' && user.role !== 'super_admin')
          .map(user => ({
            ...user,
            status: user.isBlocked ? 'Blocked' : (user.status || 'Active'),
            blockReason: user.blockReason || ''
          }));
        setUsers(citizenUsers);
        calculateStats(citizenUsers);
      } else {
        showToast(data.message || 'Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData) => {
    const total = userData.length;
    // status might be undefined or lowercase
    const active = userData.filter(u => (u.status || 'Active').toLowerCase() === 'active').length;
    const blocked = userData.filter(u => (u.status || '').toLowerCase() === 'blocked').length;

    // Calculate new users this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsers = userData.filter(u => new Date(u.createdAt) >= startOfMonth).length;

    setStats({
      totalUsers: total,
      activeUsers: active,
      blockedUsers: blocked,
      newUsersThisMonth: newUsers
    });
  };

  const getShortId = (id) => {
    return id ? id.slice(-6).toUpperCase() : 'N/A';
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user._id && user._id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // Normalize status for filtering
    const userStatus = (user.status || 'Active').toLowerCase(); // default to active if missing
    const filterStatusLower = filterStatus === 'All Statuses' ? 'all' : filterStatus.toLowerCase();

    const matchesStatus = filterStatusLower === 'all' || userStatus === filterStatusLower;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handlers
  const handleView = (userId) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile || '',
      location: typeof user.location === 'object' ? (user.location.address || '') : (user.location || '')
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const openBlockModal = (user) => {
    setSelectedUser(user);
    setShowBlockModal(true);
  };

  const closeBlockModal = () => {
    setShowBlockModal(false);
    setSelectedUser(null);
    setBlockReason('');
  };

  const openUnblockModal = (user) => {
    setSelectedUser(user);
    setShowUnblockModal(true);
  };

  const closeUnblockModal = () => {
    setShowUnblockModal(false);
    setSelectedUser(null);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/auth/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showToast('User updated successfully', 'success');
        fetchUsers();
        closeEditModal();
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (error) {
      showToast('Error updating user', 'error');
    }
  };

  const handleBlock = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/${selectedUser._id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason }),
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showToast('User blocked successfully', 'success');
        fetchUsers();
        closeBlockModal();
      } else {
        showToast(data.message || 'Block failed', 'error');
      }
    } catch (error) {
      showToast('Error blocking user', 'error');
    }
  };

  const handleUnblock = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/${selectedUser._id}/unblock`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showToast('User unblocked successfully', 'success');
        fetchUsers();
        closeUnblockModal();
      } else {
        showToast(data.message || 'Unblock failed', 'error');
      }
    } catch (error) {
      showToast('Error unblocking user', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/${selectedUser._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showToast('User deleted successfully', 'success');
        fetchUsers();
        closeDeleteModal();
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (error) {
      showToast('Error deleting user', 'error');
    }
  };

  // Helper to format location object or string
  const formatLocation = (location) => {
    if (!location) return 'Location not provided';
    if (typeof location === 'object') {
      const parts = [location.address, location.area, location.state].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Location not provided';
    }
    return location;
  };

  const exportToCSV = () => {
    // Basic CSV export
    const headers = ['User ID', 'Name', 'Email', 'Mobile', 'Location', 'Status', 'Joined Date'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => [
        u._id,
        `"${u.name}"`,
        u.email,
        u.mobile,
        `"${formatLocation(u.location)}"`,
        u.status,
        new Date(u.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Title and Export Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>User Management</h2>
          <button
            onClick={exportToCSV}
            disabled={filteredUsers.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Users */}
          <div className="bg-blue-600 text-white rounded-lg p-6 flex items-center justify-between transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-green-600 text-white rounded-lg p-6 flex items-center justify-between transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Blocked Users */}
          <div className="bg-red-600 text-white rounded-lg p-6 flex items-center justify-between transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <UserX className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">Blocked Users</p>
                <p className="text-3xl font-bold">{stats.blockedUsers}</p>
              </div>
            </div>
          </div>

          {/* New Users This Month */}
          <div className="bg-purple-600 text-white rounded-lg p-6 flex items-center justify-between transition-transform hover:scale-105 duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">New This Month</p>
                <p className="text-3xl font-bold">{stats.newUsersThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mb-4 flex flex-wrap items-center gap-4 transition-colors duration-200`}>
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center transition-colors duration-200`}>
            <AlertCircle className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>No users found</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || filterStatus !== 'All Statuses'
                ? 'Try adjusting your filters'
                : 'No citizen users available'}
            </p>
          </div>
        ) : (
          <>
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border overflow-hidden transition-colors duration-200`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b transition-colors duration-200`}>
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      </th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>User ID</th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Issues Reported</th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'} transition-colors duration-200`}>
                    {paginatedUsers.map((user) => (
                      <tr key={user._id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-blue-600 font-semibold">#{getShortId(user._id)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{user.name}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>

                        <td className={`px-6 py-4 text-center font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{user.issuesReported}</td>
                        <td className="px-6 py-4">
                          <span className={`px-4 py-1 rounded-full text-sm font-medium ${(user.status || 'active').toLowerCase() === 'active'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                            }`}>
                            {user.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(user._id)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              title="View Details"
                            >
                              View
                            </button>
                            <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                              title="Edit User"
                            >
                              Edit
                            </button>
                            <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                            {(user.status || 'active').toLowerCase() === 'active' ? (
                              <button
                                onClick={() => openBlockModal(user)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                title="Block User"
                              >
                                Block
                              </button>
                            ) : (
                              <button
                                onClick={() => openUnblockModal(user)}
                                className="text-teal-600 hover:text-teal-800 font-medium text-sm"
                                title="Unblock User"
                              >
                                Unblock
                              </button>
                            )}
                            <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} font-medium text-sm`}
                              title="Delete User"
                            >
                              Delete
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
              <div className={`${isDark ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'} px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${currentPage === 1
                      ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                      : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                      } transition-colors`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="hidden sm:flex space-x-2">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className={`px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${currentPage === totalPages
                      ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                      : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                      } transition-colors`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View User Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200`} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-blue-100 flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">Citizen</span>
                    #{getShortId(selectedUser._id)}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Email Address</label>
                  <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.email}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Phone Number</label>
                  <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.mobile || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Location</label>
                  <div className={`p-3 rounded-lg flex items-start gap-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Search className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatLocation(selectedUser.location)}</p>
                  </div>
                </div>
                {selectedUser.status === 'Blocked' && selectedUser.blockReason && (
                  <div className="col-span-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Block Reason</label>
                    <div className={`p-3 rounded-lg border flex items-start gap-3 ${isDark ? 'bg-red-900/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                      <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <p>{selectedUser.blockReason}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-sm font-medium ${selectedUser.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Issues Reported</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.issuesReported || 0}</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Joined</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last Active</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bg-gray-50/5 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-end`}>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'}`}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-lg shadow-2xl`}>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit User</h3>
                <button type="button" onClick={closeEditModal} className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mobile</label>
                  <input
                    type="tel"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  />
                </div>
              </div>
              <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md shadow-xl`}>
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Block User?</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Are you sure you want to block <strong>{selectedUser.name}</strong>? They will not be able to login or report issues.
              </p>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 text-left ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reason for Blocking</label>
                <select
                  value={['Spam or abuse', 'Fraudulent activity', 'Violation of terms', 'Inappropriate content', 'Multiple violations', 'Security concerns'].includes(blockReason) ? blockReason : 'Other'}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 mb-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="" disabled>Select a reason</option>
                  <option value="Spam or abuse">Spam or abuse</option>
                  <option value="Fraudulent activity">Fraudulent activity</option>
                  <option value="Violation of terms">Violation of terms</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Multiple violations">Multiple violations</option>
                  <option value="Security concerns">Security concerns</option>
                  <option value="Other">Other (Specify below)</option>
                </select>

                {(!['Spam or abuse', 'Fraudulent activity', 'Violation of terms', 'Inappropriate content', 'Multiple violations', 'Security concerns', ''].includes(blockReason) || blockReason === 'Other') && (
                  <textarea
                    value={blockReason === 'Other' ? '' : blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-400'}`}
                    rows={3}
                    autoFocus
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeBlockModal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unblock User Modal */}
      {showUnblockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md shadow-xl`}>
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
                <UserCheck className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Unblock User?</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Are you sure you want to unblock <strong>{selectedUser.name}</strong>? They will regain access to the platform.
              </p>

              {selectedUser.blockReason && (
                <div className={`mb-6 p-4 rounded-lg text-left border ${isDark ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>Originally Blocked For</p>
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{selectedUser.blockReason}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeUnblockModal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnblock}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
                >
                  Unblock User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md shadow-xl`}>
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete User?</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
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
              <UserCheck className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;