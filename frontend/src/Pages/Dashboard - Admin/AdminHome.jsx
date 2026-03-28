import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Filter,
  ArrowUpRight,
  MoreVertical,
  Activity,
  Search,
  X,
  History
} from 'lucide-react';

import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    escalated: 0
  });

  const [todayStats, setTodayStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [performance, setPerformance] = useState({
    resolutionRate: 0,
    avgTime: '0h'
  });
  const [todayActivities, setTodayActivities] = useState([]);

  const [allIssues, setAllIssues] = useState([]);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('critical');

  // Fetch User Session & Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch(`${BASE_URL}/auth/users/session`, {
          credentials: 'include'
        });
        const sessionData = await sessionRes.json();

        if (sessionData.loggedIn && (sessionData.user.role === 'dept_admin' || sessionData.user.role === 'super_admin')) {
          const currentUser = sessionData.user;
          setUser(currentUser);

          let issuesData;
          if (currentUser.role === 'dept_admin') {
            // Fetch ONLY this admin's assigned issues
            const issuesRes = await fetch(`${BASE_URL}/issue/admin/${currentUser._id || currentUser.id}`, {
              credentials: 'include'
            });

            if (!issuesRes.ok) {
              console.error('Failed to fetch admin issues', issuesRes.status);
              issuesData = [];
            } else {
              const json = await issuesRes.json();
              issuesData = json.issues || [];
            }
          } else {
            // Super admin sees everything
            const issuesRes = await fetch(`${BASE_URL}/issue/all`, {
              credentials: 'include'
            });

            if (!issuesRes.ok) {
              console.error('Failed to fetch all issues', issuesRes.status);
              issuesData = [];
            } else {
              const json = await issuesRes.json();
              issuesData = json.issues || [];
            }
          }

          const activityRes = await fetch(`${BASE_URL}/activity/today`, {
            credentials: 'include'
          });
          const activityData = await activityRes.json();
          if (activityData.success) {
            setTodayActivities(activityData.activities);
          }

          // No department filtering needed — data is already scoped
          processData(issuesData, null);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalizeStr = (str) => str?.toLowerCase().replace(/s$/, '').trim();

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const processData = (issues, _department) => {
    // issues are already scoped to this admin (or all for super admin) — no further filtering needed
    const relevantIssues = issues;

    const total = relevantIssues.length;
    const pending = relevantIssues.filter(i => i.status === 'Pending').length;
    const inProgress = relevantIssues.filter(i => i.status === 'In Progress').length;
    const resolved = relevantIssues.filter(i => i.status === 'Resolved').length;
    const critical = relevantIssues.filter(i => i.priority === 'high').length;
    const escalated = relevantIssues.filter(i => i.isEscalated).length;

    const totalToday = relevantIssues.filter(i => isToday(i.createdAt)).length;
    const pendingToday = relevantIssues.filter(i => i.status === 'Pending' && isToday(i.createdAt)).length;
    const inProgressToday = relevantIssues.filter(i => i.status === 'In Progress' && isToday(i.updatedAt)).length;
    const resolvedToday = relevantIssues.filter(i => i.status === 'Resolved' && isToday(i.updatedAt)).length;
    const escalatedToday = relevantIssues.filter(i => i.isEscalated && isToday(i.updatedAt)).length;

    setStats({ total, pending, inProgress, resolved, critical, escalated });
    setTodayStats({ total: totalToday, pending: pendingToday, inProgress: inProgressToday, resolved: resolvedToday, escalated: escalatedToday });
    setAllIssues(relevantIssues);

    setRecentIssues(relevantIssues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

    const resolvedWithTime = relevantIssues.filter(i => i.status === 'Resolved' && i.resolvedAt);
    let avgResolutionTime = '0h';

    if (resolvedWithTime.length > 0) {
      const totalDuration = resolvedWithTime.reduce((acc, issue) => {
        const created = new Date(issue.createdAt);
        const resolved = new Date(issue.resolvedAt);
        return acc + (resolved - created);
      }, 0);

      const avgMs = totalDuration / resolvedWithTime.length;
      const avgHours = avgMs / (1000 * 60 * 60);

      if (avgHours >= 24) {
        avgResolutionTime = `${(avgHours / 24).toFixed(1)}d`;
      } else {
        avgResolutionTime = `${avgHours.toFixed(1)}h`;
      }
    }

    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    setPerformance({ resolutionRate: rate, avgTime: avgResolutionTime });
  };

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50/50'} pt-20 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Directory Dashboard
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Managing <span className="font-semibold text-blue-500">{user?.role === 'dept_admin' ? user.department : 'All'}</span> {user?.role === 'dept_admin' ? 'Department' : 'Departments (Super Admin)'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-white'} transition-colors`}>
              <Calendar className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            </button>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
              <Filter className="w-4 h-4" />
              <span>Filter View</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Reports"
            value={stats.total}
            icon={LayoutDashboard}
            trend={`+${todayStats.total} Today`}
            color="blue"
            isDark={isDark}
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={Clock}
            trend={`+${todayStats.pending} Today`}
            color="orange"
            isDark={isDark}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Activity}
            trend={`+${todayStats.inProgress} Today`}
            color="indigo"
            isDark={isDark}
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            trend={`+${todayStats.resolved} Today`}
            color="green"
            isDark={isDark}
          />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">

          {/* Left Column: Recent Issues & Activity Feed */}
          <div className="col-span-1 2xl:col-span-2 space-y-8">
            <div className={`h-fit rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'} border shadow-sm overflow-hidden`}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Issues</h2>
                <button
                  onClick={() => navigate('/admin/issues')}
                  className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1`}
                >
                  View All <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`text-xs uppercase font-semibold ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-slate-50 text-slate-500'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left">Issue</th>
                      <th className="px-6 py-4 text-left">Area</th>
                      <th className="px-6 py-4 text-left">Reported By</th>
                      <th className="px-6 py-4 text-left">Reported On</th>
                      <th className="px-6 py-4 text-left">Priority</th>
                      <th className="px-6 py-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-slate-100'}`}>
                    {recentIssues.length > 0 ? (
                      recentIssues.map((issue) => (
                        <tr key={issue._id} className={`group ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-slate-50'} transition-colors`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-slate-100'} group-hover:scale-110 transition-transform`}>
                                <AlertCircle className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-slate-500'}`} />
                              </div>
                              <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'} line-clamp-1`}>{issue.title}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>#{issue._id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            {issue.location?.area || 'N/A'}
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            {issue.createdBy?.name || 'Anonymous'}
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                              {issue.priority ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1).toLowerCase() : 'Normal'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          No recent issues found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operational Activity Log */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'} border shadow-sm`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Today Operational Activity</h3>
                </div>
              </div>

              <div className="relative space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 pb-4">
                {/* Timeline vertical line */}
                <div className={`absolute left-[99px] top-0 bottom-4 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-slate-100'} rounded-full`}></div>

                {todayActivities.length > 0 ? (
                  todayActivities.map((log) => {
                    const isCreate = log.action.includes('CREATE');
                    const isDelete = log.action.includes('DELETE');
                    const isUpdate = log.action.includes('UPDATE');

                    return (
                      <div key={log._id} className="grid grid-cols-[70px_10px_1fr] gap-6 items-start relative">
                        {/* 1. Time on Left */}
                        <div className="text-right pt-0.5">
                          <time className={`text-[11px] font-semibold ${isDark ? 'text-gray-500' : 'text-slate-400'} whitespace-nowrap`}>
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
                          <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                            <span className="font-bold">{log.action.replace(/_/g, ' ')}</span>
                            {log.details && (
                              <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                {Object.values(log.details).join(' • ').toLowerCase().includes('resolved') || Object.values(log.details).join(' • ').toLowerCase().includes('pending') ? `to ${Object.values(log.details).join(' • ')}` : Object.values(log.details).join(' • ')}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] ${isDark ? 'text-gray-500 font-medium' : 'text-slate-400 font-semibold'}`}>
                              By {log.user?.name || 'Authorized System'} • {log.user?.role || 'op'}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className={`text-center py-12 ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No activity recorded today</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Critical Attention Card */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-red-900/40 to-gray-800 border-red-900/50' : 'bg-gradient-to-br from-red-50 to-white border-red-100'} border shadow-sm`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-red-400' : 'text-red-700'}`}>Critical Attention</h3>
                  <p className={`text-sm ${isDark ? 'text-red-200/60' : 'text-red-600/80'}`}>Issues requiring immediate action</p>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.critical}</span>
                    <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-600'} mb-1`}>High Priority</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.escalated}</span>
                    <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'} mb-1`}>Escalated</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCriticalModal(true)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${isDark
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200'
                    }`}>
                  View Critical Issues
                </button>
              </div>
            </div>

            {/* Performance Pulse */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'} border shadow-sm`}>
              <h3 className={`font-bold text-lg mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Performance Pulse</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Resolution Rate</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{performance.resolutionRate}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-slate-100'}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${performance.resolutionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} mb-1`}>Avg. Response</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{performance.avgTime}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} mb-1`}>Team Active</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>8</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues Modal */}
      {showCriticalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-6xl h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`p-6 border-b shrink-0 ${isDark ? 'border-gray-700' : 'border-slate-100'} flex justify-between items-center`}>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Critical Attention Required</h2>
                <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Reviewing High Priority and Escalated issues</p>
              </div>
              <button
                onClick={() => setShowCriticalModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Tab Navigation */}
            <div className={`px-6 pt-4 border-b ${isDark ? 'border-gray-700' : 'border-slate-100'} flex gap-6`}>
              <button
                onClick={() => setActiveModalTab('critical')}
                className={`pb-3 text-sm font-semibold transition-colors relative ${activeModalTab === 'critical'
                  ? (isDark ? 'text-red-400' : 'text-red-600')
                  : (isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
                  }`}
              >
                Critical Issues ({stats.critical})
                {activeModalTab === 'critical' && (
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? 'bg-red-500' : 'bg-red-600'}`}></div>
                )}
              </button>
              <button
                onClick={() => setActiveModalTab('escalated')}
                className={`pb-3 text-sm font-semibold transition-colors relative ${activeModalTab === 'escalated'
                  ? (isDark ? 'text-orange-400' : 'text-orange-600')
                  : (isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
                  }`}
              >
                Escalated Issues ({stats.escalated})
                {activeModalTab === 'escalated' && (
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 ${isDark ? 'bg-orange-500' : 'bg-orange-600'}`}></div>
                )}
              </button>
            </div>
            {/* Modal Content - Tabs */}
            <div className={`flex-1 min-h-0 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              {activeModalTab === 'critical' && (
                <div className="h-full flex flex-col">
                  <div className={`p-4 border-b ${isDark ? 'bg-red-900/20 border-gray-700' : 'bg-red-50 border-red-100'} flex items-center gap-3`}>
                    <div className={`p-2 rounded-full ${isDark ? 'bg-red-900/30' : 'bg-white'}`}>
                      <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-800'}`}>High Priority Issues</h3>
                      <p className={`text-xs ${isDark ? 'text-red-300/70' : 'text-red-600/80'}`}>Requiring immediate attention</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {allIssues.filter(i => i.priority?.toLowerCase() === 'high').length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allIssues.filter(i => i.priority?.toLowerCase() === 'high').map(issue => (
                          <IssueCardCompact key={issue._id} issue={issue} isDark={isDark} type="critical" />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <CheckCircle2 className={`w-12 h-12 ${isDark ? 'text-green-500' : 'text-green-600'}`} />
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>All Clear!</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No critical issues found at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeModalTab === 'escalated' && (
                <div className="h-full flex flex-col">
                  <div className={`p-4 border-b ${isDark ? 'bg-orange-900/20 border-gray-700' : 'bg-orange-50 border-orange-100'} flex items-center gap-3`}>
                    <div className={`p-2 rounded-full ${isDark ? 'bg-orange-900/30' : 'bg-white'}`}>
                      <TrendingUp className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-800'}`}>Escalated Issues</h3>
                      <p className={`text-xs ${isDark ? 'text-orange-300/70' : 'text-orange-600/80'}`}>Issues flagged for higher level review</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {allIssues.filter(i => i.isEscalated).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allIssues.filter(i => i.isEscalated).map(issue => (
                          <IssueCardCompact key={issue._id} issue={issue} isDark={isDark} type="escalated" />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <CheckCircle2 className={`w-12 h-12 ${isDark ? 'text-green-500' : 'text-green-600'}`} />
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>All Clear!</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No escalated issues found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueCardCompact({ issue, isDark, type }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700';
      case 'In Progress': return isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
      case 'Resolved': return isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700';
      default: return isDark ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className={`p-5 rounded-xl border transition-all hover:shadow-lg group ${isDark
      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
      : 'bg-white border-slate-200 hover:border-blue-300'
      }`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'
          }`}>
          #{issue._id.slice(-6)}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
          {issue.status}
        </span>
      </div>
      <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'} line-clamp-1`}>
        {issue.title}
      </h4>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} mb-3 line-clamp-2`}>
        {issue.description}
      </p>

      {type === 'escalated' && issue.escalationReason && (
        <div className={`text-xs p-2 rounded mb-3 ${isDark ? 'bg-orange-900/20 text-orange-300' : 'bg-orange-50 text-orange-700'
          }`}>
          <span className="font-bold">Reason:</span> {issue.escalationReason}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
        <span>•</span>
        <span>{issue.location?.area || 'N/A'}</span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, isDark }) {
  const colorMap = {
    blue: {
      light: 'bg-blue-50 text-blue-600',
      dark: 'bg-blue-900/20 text-blue-400',
    },
    orange: {
      light: 'bg-orange-50 text-orange-600',
      dark: 'bg-orange-900/20 text-orange-400',
    },
    indigo: {
      light: 'bg-indigo-50 text-indigo-600',
      dark: 'bg-indigo-900/20 text-indigo-400',
    },
    green: {
      light: 'bg-green-50 text-green-600',
      dark: 'bg-green-900/20 text-green-400',
    }
  };

  const themeConfig = colorMap[color];

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'} border shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${isDark ? themeConfig.dark : themeConfig.light}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.startsWith('+')
          ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
          : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
          }`}>
          {trend}
        </span>
      </div>
      <div className="mt-4">
        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{title}</h3>
        <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      </div>
    </div>
  );
}
