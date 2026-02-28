import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertCircle, LayoutDashboard,
  MapPin, Activity, Filter, Download
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

const AnalyticsPage = () => {
  const { isDark } = useTheme();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('Department');
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchSessionAndData = async () => {
      try {
        const sessionRes = await fetch(`${BASE_URL}/auth/users/session`, {
          credentials: 'include'
        });
        const sessionData = await sessionRes.json();

        if (sessionData.loggedIn && sessionData.user) {
          const user = sessionData.user;
          // Set department name for display
          setDepartment(user.department || 'Department');

          // Fetch all issues and filter by department if user is dept_admin
          fetchAllIssues(user);
        } else {
          console.warn('User not logged in, showing sample data');
          setSampleData(); // Fallback
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setSampleData();
        setLoading(false);
      }
    };

    fetchSessionAndData();
  }, []);

  const normalizeStr = (str) => str?.toLowerCase().replace(/s$/, '').trim();

  const fetchAllIssues = async (user) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/issue/all`, {
        credentials: 'include'
      });
      const data = await response.json();

      let relevantIssues = data || [];

      // Filter by department for Dept Admins
      if (user.role === 'dept_admin' && user.department) {
        const deptNormalized = normalizeStr(user.department);
        relevantIssues = relevantIssues.filter(issue => {
          const catNormalized = normalizeStr(issue.category);
          // Specific handle for known variations if needed, generally includes check works
          if (deptNormalized === 'streetlight') return catNormalized === 'streetlight';
          return catNormalized.includes(deptNormalized) || deptNormalized.includes(catNormalized);
        });
      }

      setIssues(relevantIssues);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const setSampleData = () => {
    // Only for fallback/demo
    const statuses = ['Pending', 'In Progress', 'Resolved'];
    const sampleIssues = [];
    const areas = ['North St', 'Main Ave', 'West Blvd', 'Downtown', 'Market Sq'];

    for (let i = 0; i < 50; i++) {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      sampleIssues.push({
        _id: `issue-${i}`,
        title: `Sample Issue ${i}`,
        status: status,
        createdAt: createdDate.toISOString(),
        resolvedAt: status === 'Resolved' ? new Date().toISOString() : null,
        area: areas[Math.floor(Math.random() * areas.length)],
        category: 'Sample'
      });
    }
    setIssues(sampleIssues);
  };

  // Filter issues by date range
  const filteredIssues = issues.filter(issue => {
    if (dateRange === 'all') return true;
    const issueDate = new Date(issue.createdAt);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    return issueDate >= daysAgo;
  });

  // --- Metrics Calculations ---

  // 1. Key Counts
  const total = filteredIssues.length;
  const resolved = filteredIssues.filter(i => i.status === 'Resolved').length;
  const inProgress = filteredIssues.filter(i => i.status === 'In Progress').length;
  const pending = filteredIssues.filter(i => i.status === 'Pending').length;

  // 2. Resolution Rate
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

  // 3. Average Resolution Time
  const resolvedIssues = filteredIssues.filter(i => i.status === 'Resolved' && i.resolvedAt);
  let avgResolutionTime = 0;
  if (resolvedIssues.length > 0) {
    const totalDuration = resolvedIssues.reduce((acc, issue) => {
      const created = new Date(issue.createdAt);
      const resolved = new Date(issue.resolvedAt);
      return acc + (resolved - created);
    }, 0);
    avgResolutionTime = (totalDuration / resolvedIssues.length) / (1000 * 60 * 60 * 24); // in days
  }

  // 4. Daily Trend Data (Reports vs Resolved)
  const getDailyTrend = () => {
    const days = [];
    // Show granular days based on range 
    const isAllTime = dateRange === 'all';
    const numDays = isAllTime ? 30 : Math.min(parseInt(dateRange), 30);

    for (let i = numDays - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const createdCount = filteredIssues.filter(issue => {
        const d = new Date(issue.createdAt);
        return d >= dayStart && d < dayEnd;
      }).length;

      const resolvedCount = filteredIssues.filter(issue => {
        if (issue.status !== 'Resolved' || !issue.resolvedAt) return false;
        const d = new Date(issue.resolvedAt);
        return d >= dayStart && d < dayEnd;
      }).length;

      days.push({
        date: dayStart.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        Reported: createdCount,
        Resolved: resolvedCount
      });
    }
    return days;
  };
  const trendData = getDailyTrend();

  // 5. Top Impacted Areas (Bar Chart)
  const getTopAreas = () => {
    const areaCounts = {};
    filteredIssues.forEach(issue => {
      const area = issue.area || issue.address || issue.location?.address || 'Unknown';
      // Simple normalization
      const cleanArea = area.split(',')[0].trim();
      areaCounts[cleanArea] = (areaCounts[cleanArea] || 0) + 1;
    });

    return Object.entries(areaCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  };
  const areaData = getTopAreas();

  // 6. Reporting Trends (Weekly/Monthly/Yearly)
  const [reportTimeframe, setReportTimeframe] = useState('monthly');

  const getReportingData = () => {
    const data = [];
    const now = new Date();

    if (reportTimeframe === 'weekly') {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7));
        // Get start and end of that week
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const count = issues.filter(issue => {
          const created = new Date(issue.createdAt);
          return created >= startOfWeek && created <= endOfWeek;
        }).length;

        const resolvedCount = issues.filter(issue => {
          if (issue.status !== 'Resolved' || !issue.resolvedAt) return false;
          const resolved = new Date(issue.resolvedAt);
          return resolved >= startOfWeek && resolved <= endOfWeek;
        }).length;

        data.push({
          name: `W${getWeekNumber(startOfWeek)}`, // Helper needed or simplified
          fullName: startOfWeek.toLocaleDateString(),
          Reports: count,
          Resolved: resolvedCount
        });
      }
    } else if (reportTimeframe === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const count = issues.filter(issue => {
          const created = new Date(issue.createdAt);
          return created >= monthStart && created <= monthEnd;
        }).length;

        const resolvedCount = issues.filter(issue => {
          if (issue.status !== 'Resolved' || !issue.resolvedAt) return false;
          const resolved = new Date(issue.resolvedAt);
          return resolved >= monthStart && resolved <= monthEnd;
        }).length;

        data.push({
          name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          Reports: count,
          Resolved: resolvedCount
        });
      }
    } else if (reportTimeframe === 'yearly') {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const yearStart = new Date(now.getFullYear() - i, 0, 1);
        const yearEnd = new Date(now.getFullYear() - i, 11, 31, 23, 59, 59);

        const count = issues.filter(issue => {
          const created = new Date(issue.createdAt);
          return created >= yearStart && created <= yearEnd;
        }).length;

        const resolvedCount = issues.filter(issue => {
          if (issue.status !== 'Resolved' || !issue.resolvedAt) return false;
          const resolved = new Date(issue.resolvedAt);
          return resolved >= yearStart && resolved <= yearEnd;
        }).length;

        data.push({
          name: yearStart.getFullYear().toString(),
          Reports: count,
          Resolved: resolvedCount
        });
      }
    }
    return data;
  };

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const reportingData = getReportingData();

  // --- Components ---

  const MetricCard = ({ title, value, subValue, icon: Icon, colorClass, trend }) => (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>{title}</p>
          <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-1`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {subValue && (
        <div className="flex items-center text-sm">
          {trend && (
            <span className={`flex items-center font-medium mr-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </span>
          )}
          <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subValue}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Loading {department} analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50/50'} p-6 md:p-12 mb-20 md:pt-24 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{department} Analytics</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Real-time insights for {department.toLowerCase()} management</p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border'} rounded-lg flex items-center px-3 py-2 shadow-sm`}>
              <Filter className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-400'} mr-2`} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-gray-700'} font-medium cursor-pointer`}
              >
                <option value="7" className={isDark ? 'bg-gray-800' : ''}>Last 7 Days</option>
                <option value="30" className={isDark ? 'bg-gray-800' : ''}>Last 30 Days</option>
                <option value="90" className={isDark ? 'bg-gray-800' : ''}>Last 3 Months</option>
                <option value="all" className={isDark ? 'bg-gray-800' : ''}>All Time</option>
              </select>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Reports"
            value={total}
            subValue="in selected period"
            icon={LayoutDashboard}
            colorClass="bg-blue-500"
          />
          <MetricCard
            title="Avg. Resolution Time"
            value={`${avgResolutionTime.toFixed(1)} Days`}
            subValue="target: < 2 Days"
            icon={Clock}
            colorClass="bg-indigo-500"
          />
          <MetricCard
            title="Resolution Rate"
            value={`${resolutionRate}%`}
            subValue={`${resolved} resolved issues`}
            icon={CheckCircle}
            colorClass="bg-green-500"
            trend={parseFloat(resolutionRate) - 50} // Mock trend logic
          />
          <MetricCard
            title="Active Cases"
            value={pending + inProgress}
            subValue={`${inProgress} currently in progress`}
            icon={Activity}
            colorClass="bg-orange-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status Distribution Pie Chart */}
          <div className={`lg:col-span-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Activity className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Issue Distribution Status</h3>
            </div>
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: pending, color: '#EF4444' },
                      { name: 'In Progress', value: inProgress, color: '#F97316' },
                      { name: 'Resolved', value: resolved, color: '#22C55E' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {[
                      { name: 'Pending', value: pending, color: isDark ? '#F87171' : '#EF4444' },
                      { name: 'In Progress', value: inProgress, color: isDark ? '#FB923C' : '#F97316' },
                      { name: 'Resolved', value: resolved, color: isDark ? '#4ADE80' : '#22C55E' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {total === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  No issue data available
                </div>
              )}
            </div>
          </div>

          {/* Top Impacted Areas */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border overflow-hidden`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Impacted Areas</h3>
            </div>

            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={areaData}
                  layout="vertical"
                  margin={{ top: 5, right: 35, bottom: 5, left: 10 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#818CF8" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke={isDark ? '#374151' : '#F3F4F6'}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#4B5563', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[0, 8, 8, 0]}
                    barSize={32}
                    name="Issue Count"
                    label={{
                      position: 'right',
                      fill: isDark ? '#E5E7EB' : '#4B5563',
                      fontSize: 12,
                      fontWeight: 600,
                      formatter: (value) => `${value}`
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              {areaData.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Activity className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No area data available</p>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Reporting Trends Chart */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Issue Reporting Trends</h3>
            </div>
            <div className={`flex ${isDark ? 'bg-gray-900/50' : 'bg-gray-100'} p-1 rounded-xl border ${isDark ? 'border-gray-700' : 'border-transparent'}`}>
              {['Weekly', 'Monthly', 'Yearly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setReportTimeframe(tf.toLowerCase())}
                  className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${reportTimeframe === tf.toLowerCase()
                    ? `${isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-blue-600 shadow-sm'} `
                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#F3F4F6'} />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#6B7280' : '#9CA3AF'}
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke={isDark ? '#6B7280' : '#9CA3AF'}
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{value}</span>}
                />
                <Bar dataKey="Reports" fill="url(#reportsGradient)" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Resolved" fill="url(#resolvedGradient)" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
            {reportingData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                No reporting data available for this period
              </div>
            )}
          </div>
        </div>



        {/* Priority & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Breakdown */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Issue Priority Breakdown</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'High', value: filteredIssues.filter(i => i.priority === 'High' || i.priority === 'Critical').length, fill: '#EF4444' },
                    { name: 'Medium', value: filteredIssues.filter(i => i.priority === 'Medium').length, fill: '#F59E0B' },
                    { name: 'Low', value: filteredIssues.filter(i => i.priority === 'Low' || i.priority === 'Normal' || !i.priority).length, fill: '#3B82F6' }
                  ]}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis type="number" stroke="#9CA3AF" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {
                      [
                        { name: 'High', fill: '#EF4444' },
                        { name: 'Medium', fill: '#F59E0B' },
                        { name: 'Low', fill: '#3B82F6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Activity className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
              {filteredIssues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((issue, idx) => (
                <div key={idx} className={`flex items-start gap-4 p-3 rounded-lg ${isDark ? 'hover:bg-gray-700 hover:border-gray-600' : 'hover:bg-gray-50 hover:border-gray-100'} transition-colors border border-transparent`}>
                  <div className={`p-2 rounded-full mt-1 ${issue.status === 'Resolved' ? 'bg-green-100 text-green-600' :
                    issue.status === 'In Progress' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                    {issue.status === 'Resolved' ? <CheckCircle className="w-4 h-4" /> :
                      issue.status === 'In Progress' ? <Activity className="w-4 h-4" /> :
                        <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} line-clamp-1`}>{issue.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${issue.priority === 'High' ? 'bg-red-100 text-red-700' :
                        issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {issue.priority || 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredIssues.length === 0 && (
                <p className="text-gray-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Current Distribution (Status) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Pending Review</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-red-500">{pending}</span>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>cases</span>
            </div>
            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-1.5 mt-4`}>
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(pending / total) * 100}%` }}></div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>In Progress</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-500">{inProgress}</span>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>cases</span>
            </div>
            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-1.5 mt-4`}>
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(inProgress / total) * 100}%` }}></div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Resolved</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-500">{resolved}</span>
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>cases</span>
            </div>
            <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full h-1.5 mt-4`}>
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(resolved / total) * 100}%` }}></div>
            </div>
          </div>
        </div>

      </div>
    </div >
  );
};

export default AnalyticsPage;