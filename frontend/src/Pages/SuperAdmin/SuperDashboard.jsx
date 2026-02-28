import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Users,
  UserPlus,
  Shield,
  ChevronRight,
  History,
  Activity
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

export default function SuperAdminDashboard() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    criticalIssues: 0
  });

  const [recentIssues, setRecentIssues] = useState([]);
  const [categoryStats, setCategoryStats] = useState({
    roadIssues: 0,
    streetLightIssues: 0,
    waterSupplyIssues: 0,
    garbageIssues: 0
  });

  const [systemStats, setSystemStats] = useState({
    avgResolutionTime: 4.5,
    issuesThisWeek: 85,
    blockedUsers: 5,
    totalAdmins: 0
  });

  const [messages, setMessages] = useState([]);
  const [todayActivities, setTodayActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all issues
      const issuesResponse = await fetch(`${BASE_URL}/issue/all`, {
        credentials: 'include'
      });
      const allIssues = await issuesResponse.json();

      // Calculate statistics
      calculateStats(allIssues);

      // Get recent issues (last 5)
      const sortedIssues = allIssues
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentIssues(sortedIssues);

      // Fetch admin count
      const adminsResponse = await fetch(`${BASE_URL}/auth/users/dept-admins`, {
        credentials: 'include'
      });
      const admins = await adminsResponse.json();

      const contactsRes = await fetch(`${BASE_URL}/contact`, { credentials: 'include' });
      const contactsData = await contactsRes.json();
      if (contactsData.success) {
        setMessages(contactsData.contacts);
      }

      setSystemStats(prev => ({
        ...prev,
        totalAdmins: admins.length || 0
      }));

      // Fetch Today's Activities
      const activityRes = await fetch(`${BASE_URL}/activity/today`, {
        credentials: 'include'
      });
      const activityData = await activityRes.json();
      if (activityData.success) {
        setTodayActivities(activityData.activities);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (issues) => {
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'Pending').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const critical = issues.filter(i => i.priority === 'high').length;

    // Category counts
    const roadIssues = issues.filter(i => i.category === 'Road Issues').length;
    const streetLightIssues = issues.filter(i => i.category === 'Street Light Issues').length;
    const waterSupplyIssues = issues.filter(i => i.category === 'Water Supply Issues').length;
    const garbageIssues = issues.filter(i => i.category === 'Garbage Issues').length;

    setStats({
      totalIssues: total,
      pendingIssues: pending,
      inProgressIssues: inProgress,
      resolvedIssues: resolved,
      criticalIssues: critical
    });

    setCategoryStats({
      roadIssues,
      streetLightIssues,
      waterSupplyIssues,
      garbageIssues
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-orange-500 text-white';
      case 'In Progress': return 'bg-yellow-500 text-white';
      case 'Resolved': return 'bg-green-500 text-white';
      case 'Critical': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toISOString().split('T')[0];
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-6 transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-32 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}></div>
              ))}
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}></div>
              <div className={`h-96 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Issues */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            <div className="bg-blue-500 text-white p-4 flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <h3 className="font-semibold">Total Issues</h3>
            </div>
            <div className="p-6 text-center">
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.totalIssues.toLocaleString()}</p>
            </div>
          </div>

          {/* Pending Issues */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            <div className="bg-orange-500 text-white p-4 flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <h3 className="font-semibold">Pending Issues</h3>
            </div>
            <div className="p-6 text-center">
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.pendingIssues}</p>
            </div>
          </div>

          {/* In Progress */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            <div className="bg-yellow-500 text-white p-4 flex items-center space-x-3">
              <Wrench className="w-6 h-6" />
              <h3 className="font-semibold">In Progress</h3>
            </div>
            <div className="p-6 text-center">
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.inProgressIssues}</p>
            </div>
          </div>

          {/* Resolved Issues */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            <div className="bg-green-500 text-white p-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <h3 className="font-semibold">Resolved Issues</h3>
            </div>
            <div className="p-6 text-center">
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.resolvedIssues.toLocaleString()}</p>
            </div>
          </div>

          {/* Critical Issues */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            <div className="bg-red-500 text-white p-4 flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-semibold">Critical Issues</h3>
            </div>
            <div className="p-6 text-center">
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.criticalIssues}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Issues - Left Side */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow transition-colors duration-200`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Recent Issues</h2>
              <a
                href="/superadmin/issues"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>ID</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Category</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Reported On</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {recentIssues.map((issue) => (
                    <tr key={issue._id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {issue._id.slice(-5)}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {issue.title || issue.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatDate(issue.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Management - Right Side */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow transition-colors duration-200`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Admin Management</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-3 gap-6">
                {/* Create New Admin */}
                <a
                  href="/superadmin/create-admin"
                  className={`block p-6 ${isDark ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200'} border-2 rounded-lg hover:shadow-lg transition-all cursor-pointer group text-center`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Create New Admin</h3>
                  </div>
                </a>

                {/* Manage Admins */}
                <a
                  href="/superadmin/admins"
                  className={`block p-6 ${isDark ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200'} border-2 rounded-lg hover:shadow-lg transition-all cursor-pointer group text-center`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Manage Admins</h3>
                  </div>
                </a>

                {/* Escalated Issues */}
                <a
                  href="/superadmin/escalated"
                  className={`block p-6 ${isDark ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200'} border-2 rounded-lg hover:shadow-lg transition-all cursor-pointer group text-center`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Escalated Issues</h3>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity Log */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow transition-colors duration-200`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <History className="w-5 h-5" />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>My Today's Activity</h2>
            </div>
          </div>

          <div className="relative space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar p-6">
            {/* Timeline vertical line */}
            <div className={`absolute left-[123px] top-6 bottom-6 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}></div>

            {todayActivities.length > 0 ? (
              todayActivities.map((log) => {
                const isCreate = log.action.includes('CREATE');
                const isDelete = log.action.includes('DELETE');
                const isUpdate = log.action.includes('UPDATE');

                return (
                  <div key={log._id} className="grid grid-cols-[70px_10px_1fr] gap-6 items-start relative">
                    {/* 1. Time on Left */}
                    <div className="text-right pt-0.5">
                      <time className={`text-[11px] font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'} whitespace-nowrap block`}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>

                    {/* 2. Marker in Middle */}
                    <div className="relative flex justify-center pt-1.5 z-10">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 ${isDark ? 'border-gray-800' : 'bg-white'} ${isCreate ? 'bg-green-500' :
                        isDelete ? 'bg-red-500' :
                          isUpdate ? 'bg-blue-500' :
                            'bg-gray-400'
                        }`}></div>
                    </div>

                    {/* 3. Action and details on the right */}
                    <div className="min-w-0 pb-1">
                      <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        <span className="font-bold">{log.action.replace(/_/g, ' ')}</span>
                        {log.details && (
                          <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {Object.values(log.details).join(' • ').toLowerCase().includes('resolved') || Object.values(log.details).join(' • ').toLowerCase().includes('pending') ? `to ${Object.values(log.details).join(' • ')}` : Object.values(log.details).join(' • ')}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] ${isDark ? 'text-gray-500 font-medium' : 'text-gray-400 font-semibold'}`}>
                          By {log.user?.name || 'Authorized System'} • {log.user?.role || 'op'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm italic">No activity recorded today</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid - Category Overview and System Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Overview - Left Side */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow transition-colors duration-200`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Category Overview</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-4 gap-6">
                {/* Road Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Road Issues</h3>
                </div>

                {/* Street Light Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Street Light Issues</h3>
                </div>

                {/* Water Supply Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Water Supply Issues</h3>
                </div>

                {/* Garbage Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm`}>Garbage Issues</h3>
                </div>
              </div>
            </div>
          </div>

          {/* System Statistics - Right Side */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow transition-colors duration-200`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>System Statistics</h2>
            </div>
            <div className="p-8">
              {/* Category Icons Grid - 2x2 */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Road Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} text-xs`}>Road Issues</h3>
                </div>

                {/* Street Light Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} text-xs`}>Street Light Issues</h3>
                </div>

                {/* Water Supply Issues */}
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} text-xs`}>Water Supply Issues</h3>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className={`grid grid-cols-3 gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Avg Resolution Time */}
                <div className={`text-center p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg transition-colors`}>
                  <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Avg. Resolution Time</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{systemStats.avgResolutionTime} <span className="text-sm font-normal">hrs</span></p>
                </div>

                {/* Issues This Week */}
                <div className={`text-center p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg transition-colors`}>
                  <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Issues This Week</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{systemStats.issuesThisWeek}</p>
                </div>

                {/* Blocked Users */}
                <div className={`text-center p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg transition-colors`}>
                  <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Blocked Users</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{systemStats.blockedUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Citizen Messages Section */}
        <div className={`rounded-lg shadow transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Citizen Messages</h2>
          </div>
          <div className={`p-6 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg._id} className={`p-5 rounded-lg border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{msg.name}</h4>
                        <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{msg.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={`mb-3 pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{msg.subject}</p>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>{msg.message}</p>

                    <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-end">
                      <button className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                        Reply via Email
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`col-span-full text-center py-12 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No messages available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}