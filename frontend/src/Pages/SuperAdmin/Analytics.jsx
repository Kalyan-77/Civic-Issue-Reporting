import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import {
  FileText, Clock, Settings, CheckCircle, AlertTriangle, Download, Calendar, MoreHorizontal
} from 'lucide-react';

import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

const Analytics = () => {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalIssues: 0, pendingIssues: 0, inProgressIssues: 0, resolvedIssues: 0, criticalIssues: 0, escalatedIssues: 0
  });
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [adminPerf, setAdminPerf] = useState([]);

  // Mock data for unimplemented endpoints
  const [avgResolutionByCat, setAvgResolutionByCat] = useState([
    { name: 'Overall', time: 3.9 },
    { name: 'Road', time: 5.2 },
    { name: 'Street Light', time: 4.1 },
    { name: 'Water', time: 3.8 },
    { name: 'Garbage', time: 3.8 }, // Duplicate value to match image somewhat
    { name: 'Traffic', time: 4.5 },
  ]);

  const [escalations, setEscalations] = useState({
    total: 0,
    byCategory: [],
    reasons: []
  });

  const [trendData, setTrendData] = useState([]);
  const [trendTimeframe, setTrendTimeframe] = useState('monthly');

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/analytics/issue-trends`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { year: selectedDate.year, timeframe: trendTimeframe },
          withCredentials: true
        });
        if (res.data.success) {
          setTrendData(res.data.analytics);
        }
      } catch (err) {
        console.error("Error fetching trends:", err);
      }
    };
    fetchTrendData();
  }, [selectedDate.year, trendTimeframe]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Ensure loading state triggers on re-fetch
        const token = localStorage.getItem('token'); // Assuming auth token might be needed
        const config = {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: selectedDate.month, year: selectedDate.year },
          withCredentials: true
        };

        // Parallel fetching
        const [overviewRes, catRes, statusRes, timeRes, adminRes, escRes, catResTimeRes, areaRes] = await Promise.all([
          axios.get(`${BASE_URL}/analytics/overview`, config),
          axios.get(`${BASE_URL}/analytics/issues-by-category`, config),
          axios.get(`${BASE_URL}/analytics/issues-by-status`, config),
          axios.get(`${BASE_URL}/analytics/issues-over-time`, config),
          axios.get(`${BASE_URL}/analytics/admin-performance`, config),
          axios.get(`${BASE_URL}/analytics/escalations`, config),
          axios.get(`${BASE_URL}/analytics/category-resolution`, config),
          axios.get(`${BASE_URL}/analytics/issues-by-area`, config)
        ]);

        if (overviewRes.data.success) setOverview(overviewRes.data.data);

        if (catRes.data.success) {
          // Reformat for chart
          setCategoryData(catRes.data.analytics.map(i => ({ name: i._id, value: i.count })));
        }

        if (statusRes.data.success) {
          setStatusData(statusRes.data.analytics.map(i => ({ name: i._id, value: i.count })));
        }

        if (areaRes.data.success) {
          setAreaData(areaRes.data.analytics.map(i => ({ name: i.area, value: i.count })));
        }

        if (timeRes.data.success) {
          setTimeData(timeRes.data.analytics);
        }

        if (adminRes.data.success) {
          setAdminPerf(adminRes.data.analytics);
        }

        if (catResTimeRes.data.success) {
          setAvgResolutionByCat(catResTimeRes.data.analytics.map(i => ({
            name: i._id,
            time: parseFloat(i.avgResolutionDays.toFixed(1))
          })));
        }

        if (escRes.data.success) {
          setEscalations({
            total: escRes.data.data.totalEscalated,
            byCategory: escRes.data.data.byCategory,
            reasons: escRes.data.data.byReason
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setLoading(false);
        // Fallback to static data if backend fails or is empty for demo/visual purposes
      }
    };
    fetchData();
  }, [selectedDate]);

  const COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#0088FE'];
  const STATUS_COLORS = {
    'Pending': '#FFBB28',
    'In Progress': '#FF8042',
    'Resolved': '#00C49F'
  };

  if (loading) return <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>Loading Analytics...</div>;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} p-6 font-sans transition-colors duration-200`}>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Overview & Statistics</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Super Admin Analytics &gt; Overview & Statistics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300'} px-3 py-2 rounded-md shadow-sm border`}>
            <Calendar size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={selectedDate.month}
              onChange={(e) => setSelectedDate({ ...selectedDate, month: parseInt(e.target.value) })}
              className={`bg-transparent text-sm font-medium outline-none cursor-pointer ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select
              value={selectedDate.year}
              onChange={(e) => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}
              className={`bg-transparent text-sm font-medium outline-none cursor-pointer border-l pl-2 ml-2 ${isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300'}`}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-green-700">
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <StatCard icon={<FileText size={24} />} label="Total Issues" value={overview.totalIssues} color="bg-blue-600" />
        <StatCard icon={<Clock size={24} />} label="Pending Issues" value={overview.pendingIssues} color="bg-yellow-500" />
        <StatCard icon={<Settings size={24} />} label="In Progress" value={overview.inProgressIssues} color="bg-orange-500" />
        <StatCard icon={<CheckCircle size={24} />} label="Resolved" value={overview.resolvedIssues} color="bg-green-600" />
        <StatCard icon={<AlertTriangle size={24} />} label="Critical" value={overview.criticalIssues} color="bg-red-500" />
        <StatCard icon={<AlertTriangle size={24} />} label="Escalated" value={overview.escalatedIssues} color="bg-amber-600" />
      </div>

      {/* Issue Trends Chart (New) */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border mb-6 transition-colors duration-200`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Issue Trends</h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Timeframe:</span>
            <select
              value={trendTimeframe}
              onChange={(e) => setTrendTimeframe(e.target.value)}
              className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 border`}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid stroke={isDark ? "#374151" : "#f5f5f5"} vertical={false} />
              <XAxis dataKey="name" scale="point" padding={{ left: 20, right: 20 }} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="total" name="Total Issues" barSize={20} fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="resolved" name="Resolved Issues" stroke="#F97316" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Issues by Category */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Issues by Category</h3>
            <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues by Status */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Issues by Status</h3>
          </div>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues Over Time */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Issues Over Time</h3>
            <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#EFF6FF" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Performance */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border lg:col-span-1 transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Category Admin Performance</h3>
            <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Resolved</th>
                  <th className="px-3 py-2 text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {adminPerf.length > 0 ? adminPerf.map((admin, idx) => (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50'} last:border-0`}>
                    <td className={`px-3 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <img src={admin.profilePicture || "https://ui-avatars.com/api/?name=" + admin.name} alt="" className="w-6 h-6 rounded-full" />
                      {admin.name}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold 
                        ${admin.category === 'Road' ? (isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800') :
                          admin.category === 'Garbage' ? (isDark ? 'bg-yellow-900/50 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                            (isDark ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800')}`}>
                        {admin.category}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{admin.resolvedCount}</td>
                    <td className={`px-3 py-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{admin.avgResolutionDays ? admin.avgResolutionDays.toFixed(1) + ' days' : '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-4 text-gray-500">No admin data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Average Resolution Time */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Average Resolution Time</h3>
            <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgResolutionByCat} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="time" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {/* Custom Label on Top */}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Top Admin Performance Mini Table */}
          <div className="mt-4">
            <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><Settings size={14} /> 'Top' Admin Performance</h4>
            <div className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex justify-between">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Road Issues</div>
                <div className="font-medium">80 <span className="text-gray-400 ml-2">3.2 days</span></div>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Street Light Issues</div>
                <div className="font-medium">56 <span className="text-gray-400 ml-2">4.1 days</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Escalations Overview - Data Quality Issues */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border transition-colors duration-200`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Issues Requiring Review</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Flagged for incomplete data</p>
            </div>
            <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
          </div>
          
          {/* Total Escalated Issues - Highlighted Card */}
          <div className={`${isDark ? 'bg-amber-900/20 border-amber-900/50' : 'bg-amber-50 border-amber-200'} border rounded-lg p-4 mb-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${isDark ? 'bg-amber-900/50' : 'bg-amber-100'} p-2 rounded-lg`}>
                  <AlertTriangle className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>Pending Review</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{escalations.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* By Category */}
          <div className="mb-5">
            <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3 flex items-center gap-2`}>
              <div className={`w-1 h-4 ${isDark ? 'bg-blue-500' : 'bg-blue-600'} rounded`}></div>
              By Category
            </h4>
            <div className={`space-y-2.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {escalations.byCategory && escalations.byCategory.length > 0 ? (
                escalations.byCategory.map((cat, idx) => {
                  const percentage = escalations.total > 0 ? ((cat.count / escalations.total) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-3`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {cat._id || 'Uncategorized'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{percentage}%</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.count}</span>
                        </div>
                      </div>
                      <div className={`w-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-1.5`}>
                        <div 
                          className={`${isDark ? 'bg-blue-500' : 'bg-blue-600'} h-1.5 rounded-full transition-all duration-300`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
                  No escalations by category
                </div>
              )}
            </div>
          </div>

          {/* Top Data Quality Issues */}
          <div>
            <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3 flex items-center gap-2`}>
              <div className={`w-1 h-4 ${isDark ? 'bg-orange-500' : 'bg-orange-600'} rounded`}></div>
              Common Data Quality Issues
            </h4>
            <div className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {escalations.reasons && escalations.reasons.length > 0 ? (
                escalations.reasons.map((r, i) => (
                  <div key={i} className={`flex justify-between items-center ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} p-2 rounded transition-colors`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full ${isDark ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'} flex items-center justify-center text-xs font-bold`}>
                        {i + 1}
                      </span>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {r._id || 'Unspecified'}
                      </span>
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} bg-gray-500/10 px-2 py-1 rounded text-sm`}>
                      {r.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className={`text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
                  No escalation reasons recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Issues by Area (New Row) */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border mt-6 transition-colors duration-200`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Issues by Area</h3>
          <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" fill="#8884d8" barSize={20} radius={[0, 4, 4, 0]}>
                {areaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-lg shadow-sm text-white flex items-center justify-between ${color}`}>
    <div className="flex flex-col">
      <span className="text-xs opacity-90 uppercase tracking-wider mb-1 font-semibold">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
    <div className="bg-white bg-opacity-20 p-2 rounded-md">
      {icon}
    </div>
  </div>
);

export default Analytics;