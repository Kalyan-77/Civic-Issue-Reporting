import { useState, useEffect } from 'react';
import {
  Trash2,
  Lightbulb,
  AlertTriangle,
  Droplets,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../Context/ThemeContext';

export default function SuperCategoriesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModal]);

  const categories = [
    { id: 'Garbage', name: 'Garbage', icon: Trash2, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
    { id: 'Streetlight', name: 'Streetlight', icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    { id: 'Pothole', name: 'Pothole', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
    { id: 'Water Leakage', name: 'Water Leakage', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { id: 'Other', name: 'Other', icon: ClipboardList, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }
  ];

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch(`${BASE_URL}/issue/all`, {
        credentials: 'include'
      });
      const issues = await response.json();
      setAllIssues(issues);
      calculateStats(issues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (issues) => {
    const stats = categories.map(cat => {
      const catIssues = issues.filter(i => i.category === cat.id);
      return {
        ...cat,
        total: catIssues.length,
        pending: catIssues.filter(i => i.status === 'Pending').length,
        inProgress: catIssues.filter(i => i.status === 'In Progress').length,
        resolved: catIssues.filter(i => i.status === 'Resolved').length,
        highPriority: catIssues.filter(i => i.priority === 'high').length
      };
    });
    setCategoryStats(stats);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return isDark ? 'bg-yellow-900/40 text-yellow-200 border-yellow-700/50' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return isDark ? 'bg-blue-900/40 text-blue-200 border-blue-700/50' : 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved': return isDark ? 'bg-green-900/40 text-green-200 border-green-700/50' : 'bg-green-100 text-green-800 border-green-200';
      default: return isDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Categories Overview</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Monitor issues across different administrative categories</p>
          </div>
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300 bg-gray-700 border-gray-600' : 'text-gray-500 bg-gray-50 border-gray-200'} px-4 py-2 rounded-lg border`}>
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryStats.map((cat) => (
            <div
              key={cat.id}
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 group`}
            >
              {/* Card Header */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${cat.bg} ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.total}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium tracking-wide`}>Total Issues</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-4`}>{cat.name}</h3>
              </div>

              {/* Stats Grid */}
              <div className={`grid grid-cols-3 border-b ${isDark ? 'border-gray-700 divide-gray-700 bg-gray-900/30' : 'border-gray-50 divide-gray-50 bg-gray-50/50'} divide-x`}>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.pending}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Loader2 className="w-4 h-4" />
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.inProgress}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>In Progress</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.resolved}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resolved</p>
                </div>
              </div>

              {/* Action Footer */}
              <div className={`p-4 ${isDark ? 'bg-gray-700/30' : 'bg-gray-50/30'}`}>
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'} rounded-lg transition-colors`}
                >
                  View Details
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              High Priority Attention Needed
            </h3>
            <div className="space-y-4">
              {categoryStats.filter(c => c.highPriority > 0).map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="bg-red-500/20 text-red-100 px-3 py-1 rounded-full text-sm border border-red-500/30">
                    {cat.highPriority} Critical
                  </span>
                </div>
              ))}
              {categoryStats.filter(c => c.highPriority > 0).length === 0 && (
                <p className="text-white/80 italic">No critical issues pending across categories.</p>
              )}
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/superadmin/issues')}
                className={`p-4 text-left rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} border transition-colors group`}
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>All Issues</h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage all reported issues</p>
              </button>

              <button
                onClick={() => navigate('/superadmin/analytics')}
                className={`p-4 text-left rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} border transition-colors group`}
              >
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>View detailed reports</p>
              </button>
            </div>
          </div>
        </div>

        {/* Category Details Modal */}
        {showModal && selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200`}>
              {/* Modal Header */}
              {/* Modal Header */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50/50'} flex items-center justify-between rounded-t-2xl`}>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                    {selectedCategory} Issues
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200 font-medium">
                      {allIssues.filter(i => i.category === selectedCategory).length} Total
                    </span>
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Viewing all reported issues in this category</p>
                </div>
                <button
                  onClick={closeModal}
                  className={`p-2 ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'} rounded-full transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {allIssues.filter(i => i.category === selectedCategory).length > 0 ? (
                  <div className={`overflow-x-auto border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
                    <table className="w-full text-sm text-left">
                      <thead className={`${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-600 border-gray-200'} font-medium border-b`}>
                        <tr>
                          <th className="px-4 py-3">Issue ID</th>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {allIssues
                          .filter(i => i.category === selectedCategory)
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((issue, idx) => (
                            <tr key={issue._id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                              <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                #{issue._id.slice(-5)}
                              </td>
                              <td className="px-4 py-3">
                                <div className={`max-w-[200px] truncate font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{issue.title}</div>
                                <div className={`max-w-[200px] truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{issue.description}</div>
                              </td>
                              <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {issue.location?.area || 'Unknown'}
                              </td>
                              <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                                {new Date(issue.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${issue.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                    issue.priority === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      'bg-green-50 text-green-700 border-green-200'}`}>
                                  {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                                  {issue.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className={`w-16 h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
                      <ClipboardList className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>No issues found</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 max-w-sm`}>
                      There are currently no reported issues in the {selectedCategory} category.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50/50'} rounded-b-2xl flex justify-between items-center`}>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Sorted by newest first
                </span>
                <button
                  onClick={() => navigate(`/superadmin/issues?category=${encodeURIComponent(selectedCategory)}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  Manage Issues
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon component needed for the summary
function BarChart2({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function Loader2({ className }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

