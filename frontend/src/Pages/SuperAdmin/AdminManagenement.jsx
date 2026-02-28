import { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Edit,
  Key,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  FileText
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';

export default function AdminManagement() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Statistics
  const [stats, setStats] = useState({
    potholes: 0,
    streetlight: 0,
    waterSupply: 0,
    garbage: 0
  });

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  // Issues Modal
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [selectedAdminIssues, setSelectedAdminIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [selectedAdminName, setSelectedAdminName] = useState('');

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (showIssuesModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showIssuesModal, showDeleteModal]);

  // Categories matching your backend
  const categories = [
    'All Categories',
    'Potholes',
    'Streetlight',
    'Water Leakage',
    'Garbage',
    'Other'
  ];

  // Fetch all department admins
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/auth/users/dept-admins`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setAdmins(data.admins || []);
        setFilteredAdmins(data.admins || []);
        calculateStats(data.admins || []);
      } else {
        setError(data.message || 'Failed to fetch admins');
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (adminList) => {
    const stats = {
      potholes: 0,
      streetlight: 0,
      waterSupply: 0,
      garbage: 0
    };

    adminList.forEach(admin => {
      if (admin.department === 'Potholes') stats.potholes++;
      else if (admin.department === 'Streetlight') stats.streetlight++;
      else if (admin.department === 'Water Leakage') stats.waterSupply++;
      else if (admin.department === 'Garbage') stats.garbage++;
    });

    setStats(stats);
  };

  // Filter admins
  useEffect(() => {
    let filtered = admins;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(admin => admin.department === selectedCategory);
    }

    setFilteredAdmins(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, selectedCategory, admins]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle delete admin
  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      const response = await fetch(`${BASE_URL}/auth/users/${adminToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Admin deleted successfully');
        fetchAdmins();
        setShowDeleteModal(false);
        setAdminToDelete(null);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete admin');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError('Failed to delete admin');
      setShowDeleteModal(false);
    }
  };

  // Handle reset password (you'll need to implement this endpoint)
  const handleResetPassword = async (adminId) => {
    // Implement password reset functionality
    console.log('Reset password for admin:', adminId);
    alert('Password reset functionality - implement backend endpoint');
  };

  // Handle activate/deactivate (you can add a status field to your User model)
  const handleToggleStatus = async (admin) => {
    // Implement activate/deactivate functionality
    console.log('Toggle status for admin:', admin);
    alert('Activate/Deactivate functionality - add status field to User model');
  };

  // Fetch and show admin issues
  const handleViewIssues = async (admin) => {
    setSelectedAdminName(admin.name);
    setIssuesLoading(true);
    setShowIssuesModal(true);
    setSelectedAdminIssues([]);

    try {
      const response = await fetch(`${BASE_URL}/issue/admin/${admin._id}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedAdminIssues(data.issues || []);
      } else if (response.status === 404) {
        setSelectedAdminIssues([]);
      } else {
        // Don't show error for 404 (no issues)
        console.warn('Failed to fetch issues:', data.message);
      }
    } catch (err) {
      console.error('Error fetching admin issues:', err);
      // specific error handling if needed
    } finally {
      setIssuesLoading(false);
    }
  };

  // Get status badge style
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get category color
  const getCategoryColor = (department) => {
    switch (department) {
      case 'Potholes':
        return 'bg-blue-500 text-white';
      case 'Streetlight':
        return 'bg-yellow-500 text-white';
      case 'Water Leakage':
        return 'bg-teal-500 text-white';
      case 'Garbage':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get category icon
  const getCategoryIcon = (department) => {
    switch (department) {
      case 'Potholes':
        return '🛣️';
      case 'Streetlight':
        return '💡';
      case 'Water Leakage':
        return '💧';
      case 'Garbage':
        return '🗑️';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Management</h1>
          <button
            onClick={() => navigate('/superadmin/create-admin')}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create New Admin</span>
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">{success}</p>
            </div>
            <button onClick={() => setSuccess('')}>
              <X className="w-5 h-5 text-green-600 hover:text-green-800" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')}>
              <X className="w-5 h-5 text-red-600 hover:text-red-800" />
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Road Issues Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Road Issues</p>
                <p className="text-xs text-blue-200">Admins: {stats.potholes}</p>
              </div>
              <div className="text-5xl font-bold">{stats.potholes}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-4xl mr-3">🛣️</span>
            </div>
          </div>

          {/* Street Light Card */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Street Light</p>
                <p className="text-xs text-yellow-200">Admins: {stats.streetlight}</p>
              </div>
              <div className="text-5xl font-bold">{stats.streetlight}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-4xl mr-3">💡</span>
            </div>
          </div>

          {/* Water Supply Card */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Water Supply</p>
                <p className="text-xs text-teal-200">Admins: {stats.waterSupply}</p>
              </div>
              <div className="text-5xl font-bold">{stats.waterSupply}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-4xl mr-3">💧</span>
            </div>
          </div>

          {/* Garbage Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Garbage</p>
                <p className="text-xs text-orange-200">Admins: {stats.garbage}</p>
              </div>
              <div className="text-5xl font-bold">{stats.garbage}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-4xl mr-3">🗑️</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6 transition-colors duration-200`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-3">
              <label className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium whitespace-nowrap`}>
                Filter by Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[180px]`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap">
              Filter
            </button>
          </div>
        </div>

        {/* Admin Table */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-200`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                    Admin Name
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                    Email
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                    Category
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                    Location
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                    Mobile
                  </th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {currentAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mb-3 text-gray-400" />
                        <p className="text-lg font-medium">No admins found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentAdmins.map((admin) => (
                    <tr key={admin._id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{admin.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{admin.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(admin.department)}`}>
                          <span className="mr-1">{getCategoryIcon(admin.department)}</span>
                          {admin.department}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {typeof admin.location === 'object'
                          ? [admin.location?.address, admin.location?.area, admin.location?.state].filter(Boolean).join(', ') || 'N/A'
                          : admin.location || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{admin.mobile}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => navigate(`/superadmin/edit-admin/${admin._id}`)}
                            className={`px-3 py-1.5 ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} rounded-md transition-colors text-sm font-medium`}
                            title="Edit Admin"
                          >
                            Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setAdminToDelete(admin);
                              setShowDeleteModal(true);
                            }}
                            className={`px-3 py-1.5 ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} rounded-md transition-colors text-sm font-medium`}
                            title="Delete Admin"
                          >
                            Delete
                          </button>

                          {/* View Issues Button */}
                          <button
                            onClick={() => handleViewIssues(admin)}
                            className={`px-3 py-1.5 ${isDark ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'} rounded-md transition-colors text-sm font-medium flex items-center gap-1`}
                            title="View Assigned Issues"
                          >
                            <Eye className="w-3 h-3" />
                            Issues
                          </button>

                          {/* Reset Password Button */}
                          {/* <button
                            onClick={() => handleResetPassword(admin._id)}
                            className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium whitespace-nowrap"
                            title="Reset Password"
                          >
                            Reset Password
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`${isDark ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'} px-6 py-4`}>
              <div className="flex items-center justify-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${currentPage === 1
                    ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                    : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                    } transition-colors`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Previous</span>
                </button>

                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;

                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                {/* Next Button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${currentPage === totalPages
                    ? `${isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                    : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'} border`
                    } transition-colors`}
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-center mb-2`}>
              Delete Admin
            </h3>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-center mb-6`}>
              Are you sure you want to delete <strong>{adminToDelete?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAdminToDelete(null);
                }}
                className={`flex-1 px-4 py-2.5 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg font-medium transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issues Modal */}
      {showIssuesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                  <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Assigned Issues
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Admin: <span className="font-medium">{selectedAdminName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIssuesModal(false)}
                className={`p-2 rounded-full hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {issuesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading issues...</p>
                </div>
              ) : selectedAdminIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <CheckCircle className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <h4 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Assigned Issues</h4>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    This admin currently has no issues assigned to them.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`grid grid-cols-12 gap-4 pb-2 border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'} text-xs font-semibold uppercase tracking-wider px-2`}>
                    <div className="col-span-5">Issue Details</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-3 text-right">Location</div>
                  </div>

                  {selectedAdminIssues.map((issue) => (
                    <div
                      key={issue._id}
                      className={`grid grid-cols-12 gap-4 p-4 rounded-lg border transition-all ${isDark
                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                        : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                        }`}
                    >
                      <div className="col-span-5">
                        <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{issue.title}</h4>
                        <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{issue.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(issue.category)}`}>
                            {issue.category}
                          </span>
                          {issue.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                              issue.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {issue.priority} Priority
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="col-span-3 text-right">
                        <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {issue.location?.area || issue.location?.address ? (
                            <div className="flex items-center justify-end gap-1">
                              <span>📍</span>
                              <span className="truncate max-w-[150px]" title={issue.location.address}>
                                {issue.location.area || 'Unknown Area'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No Location</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
              <button
                onClick={() => setShowIssuesModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark
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
    </div>
  );
}