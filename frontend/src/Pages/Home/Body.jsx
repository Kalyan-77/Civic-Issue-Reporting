import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Users, Zap, Shield, BarChart3, AlertCircle, Trash2, TreePine, Wrench, ArrowRight, CheckCircle, Phone, Mail, MapPinned, Github, Linkedin, Twitter, Plus, LayoutDashboard, Settings } from 'lucide-react';
import { BASE_URL } from '../../../config';

export default function Body() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'citizen' or 'dept_admin'
  const [loading, setLoading] = useState(true);
  const [showFabTooltip, setShowFabTooltip] = useState(false);
  const [heroStats, setHeroStats] = useState({
    resolvedIssues: '2,847',
    activeCitizens: '15,239',
    avgResponse: '48h'
  });

  // Check session on component mount
  useEffect(() => {
    checkSession();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BASE_URL}/analytics/hero-stats`);
      const resData = await response.json();
      if (resData.success) {
        setHeroStats({
          resolvedIssues: resData.data.resolvedIssues.toLocaleString(),
          activeCitizens: resData.data.activeCitizens.toLocaleString(),
          avgResponse: resData.data.avgResponse
        });
      }
    } catch (error) {
      console.error('Error fetching hero stats:', error);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setIsLoggedIn(data.loggedIn);
      // Assuming the API returns role information
      // Adjust based on your actual API response structure
      if (data.loggedIn && data.user) {
        setUserRole(data.user.role); // or data.role, depending on API structure
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoggedIn(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      if (userRole === 'dept_admin') {
        window.location.href = '/admin/'
      } else {
        window.location.href = '/citizen/';
      }
    } else {
      window.location.href = '/login';
    }
  };

  const handlePrimaryAction = () => {
    if (userRole === 'super_admin') {
      window.location.href = '/superadmin/';
    } else if (userRole === 'dept_admin') {
      window.location.href = '/admin/';
    } else {
      window.location.href = '/citizen/report';
    }
  };

  const handleSecondaryAction = () => {
    if (userRole === 'super_admin') {
      window.location.href = '/superadmin/admins';
    } else if (userRole === 'dept_admin') {
      window.location.href = '/admin/issues';
    } else {
      window.location.href = '/citizen/report';
    }
  };

  const handleReportIssue = () => {
    window.location.href = '/citizen/report';
  };

  const stats = [
    { value: heroStats.resolvedIssues, label: 'Issues Resolved' },
    { value: heroStats.activeCitizens, label: 'Active Citizens' },
    { value: heroStats.avgResponse, label: 'Avg Response' }
  ];

  const features = [
    {
      icon: Camera,
      title: 'Photo Documentation',
      description: 'Capture and upload high-quality images of infrastructure issues with automatic metadata tagging.'
    },
    {
      icon: MapPin,
      title: 'GPS Location Tracking',
      description: 'Precise location capture using GPS coordinates ensures accurate issue positioning and faster response.'
    },
    {
      icon: Users,
      title: 'Community Engagement',
      description: 'Connect with neighbors, track issue status, and see the impact of your reports on the community.'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant notifications about your reported issues and track resolution progress in real-time.'
    },
    {
      icon: Shield,
      title: 'Admin Dashboard',
      description: 'Comprehensive administrative tools for managing reports, assigning tasks, and monitoring city-wide issues.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Data-driven insights help administrators prioritize resources and track community improvement trends.'
    }
  ];

  const categories = [
    {
      icon: AlertCircle,
      title: 'Road Infrastructure',
      description: 'Report potholes, damaged roads, broken sidewalks, and street maintenance issues.',
      reports: '1,247',
      image: 'https://static.toiimg.com/thumb/msid-121732936,imgsize-253271,width-400,resizemode-4/Highways.jpg'
    },
    {
      icon: Trash2,
      title: 'Waste Management',
      description: 'Report illegal dumping, overflowing bins, litter, and garbage collection issues.',
      reports: '892',
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80'
    },
    {
      icon: TreePine,
      title: 'Environmental Issues',
      description: 'Report damaged trees, fallen branches, landscaping problems, and green space issues.',
      reports: '534',
      image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80'
    },
    {
      icon: Wrench,
      title: 'Utilities & Infrastructure',
      description: 'Report water leaks, gas issues, electrical problems, and utility infrastructure concerns.',
      reports: '678',
      image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80'
    }
  ];

  const steps = [
    {
      number: '01',
      icon: Camera,
      title: 'Capture the Issue',
      description: 'Take a clear photo of the infrastructure problem using your mobile device or camera.'
    },
    {
      number: '02',
      icon: MapPin,
      title: 'Add Location Details',
      description: 'GPS automatically captures the exact location, or manually adjust for precision.'
    },
    {
      number: '03',
      icon: ArrowRight,
      title: 'Submit Your Report',
      description: 'Add a brief description and submit your report to the appropriate authorities.'
    },
    {
      number: '04',
      icon: CheckCircle,
      title: 'Track Progress',
      description: 'Monitor the status of your report and receive updates when action is taken.'
    }
  ];

  // Get button configurations based on role
  const getButtonConfig = () => {
    if (userRole === 'dept_admin') {
      return {
        primary: {
          icon: LayoutDashboard,
          text: '📊 Go to Dashboard'
        },
        secondary: {
          icon: Settings,
          text: '🛠️ Manage Issues'
        }
      };
    }

    if (userRole === 'super_admin') {
      return {
        primary: {
          icon: LayoutDashboard,
          text: '📊 Super Dashboard'
        },
        secondary: {
          icon: Users,
          text: '👥 Manage Admins'
        }
      };
    }
    // Default to citizen view
    return {
      primary: {
        icon: Camera,
        text: 'Report an Issue'
      },
      secondary: {
        icon: MapPin,
        text: 'View Reports'
      }
    };
  };

  const buttonConfig = getButtonConfig();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Floating Action Button - Only show for citizens */}
      {(!userRole || userRole === 'citizen') && (
        <div className="fixed bottom-8 right-8 z-50 group cursor-pointer">
          <button
            onClick={handleReportIssue}
            onMouseEnter={() => setShowFabTooltip(true)}
            onMouseLeave={() => setShowFabTooltip(false)}
            className="relative w-12 h-12 bg-blue-600 rounded-full shadow-lg hover:shadow-2xl hover:bg-blue-700 transition-all duration-300 hover:scale-110 flex items-center justify-center group-hover:w-auto group-hover:px-6 cursor-pointer"
            style={{
              animation: 'fabPulse 2s ease-in-out infinite'
            }}
          >
            <Plus className="w-8 h-8 text-white transition-transform duration-300 group-hover:rotate-90" />
            <span className="hidden group-hover:inline-block ml-2 text-white font-medium whitespace-nowrap transition-all duration-300">
              Report an Issue
            </span>
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fabPulse {
          0%, 100% {
            box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
          }
          50% {
            box-shadow: 0 15px 35px rgba(37, 99, 235, 0.5);
          }
        }
      `}</style>

      {/* Hero Section */}
      <section id="logo" className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Report Issues,<br />
                  <span className="text-blue-600">Transform</span> Your Community
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Help build safer, cleaner neighborhoods by reporting infrastructure issues. From potholes to broken streetlights, your voice matters.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePrimaryAction}
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <buttonConfig.primary.icon className="w-5 h-5 mr-2" />
                  {buttonConfig.primary.text}
                </button>
                <button
                  onClick={handleSecondaryAction}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <buttonConfig.secondary.icon className="w-5 h-5 mr-2" />
                  {buttonConfig.secondary.text}
                </button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                {stats.map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF_jRkgfKJ8ayKUS-7xbg9PPs8NpL4ljmJUA&s"
                  alt="Community Report"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute top-6 left-6 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">Issue Reported</span>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl px-6 py-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Community Active</div>
                    <div className="text-sm text-gray-600">{heroStats.activeCitizens} citizens engaged</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Better Communities
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to report, track, and resolve civic issues efficiently and effectively.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Can You Report?
            </h2>
            <p className="text-lg text-gray-600">
              Our platform covers a wide range of civic issues to help keep your community safe and well-maintained.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <category.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {category.reports} reports
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Reporting civic issues is simple and straightforward. Follow these four easy steps to make a difference.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of active citizens working together to build better, safer communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Get Started Now
            </button>
            <button className="px-8 py-4 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors border-2 border-blue-500 cursor-pointer">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">CivicIssueReporter</span>
              </div>
              <p className="text-sm leading-relaxed">
                Empowering communities to report and resolve civic issues through technology and civic engagement.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Report Issue</a></li>
                <li><a href="#" className="hover:text-white transition-colors">View Reports</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>support@civicreport.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>+91 0123456789</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPinned className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>123 Civic Center<br />Community City, CC 12345</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 CivicIssueReporter. All rights reserved. Building better communities together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}