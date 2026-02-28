import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Search, BookOpen, Video, MessageCircle,
  Mail, Phone, FileText, ChevronRight, ExternalLink,
  CheckCircle, Clock, AlertCircle, Send, ChevronDown,
  PlayCircle, Download, Users, Shield, Settings, Loader2
} from 'lucide-react';
import { BASE_URL } from '../../../config';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    recipient: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [superAdmins, setSuperAdmins] = useState([]);

  useEffect(() => {
    const fetchSuperAdmins = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/users/super-admins`, { credentials: "include" });
        const data = await res.json();
        if (data.success && data.admins) {
          setSuperAdmins(data.admins);
          if (data.admins.length > 0) {
            setSupportForm(prev => ({ ...prev, recipient: data.admins[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch super admins:", err);
      }
    };
    fetchSuperAdmins();
  }, []);

  // FAQ Data
  const faqCategories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: PlayCircle,
      color: 'bg-blue-100 text-blue-600',
      faqs: [
        {
          question: 'How do I access my assigned issues?',
          answer: 'Navigate to "My Issues" from the main navigation menu. You\'ll see all issues currently assigned to you. You can filter them by status (Pending, In Progress, Resolved) and category.'
        },
        {
          question: 'How do I update the status of an issue?',
          answer: 'Open any assigned issue and click on the status buttons: "Start Working" to change from Pending to In Progress, or "Mark Resolved" to complete the issue. You can also add comments to document your progress.'
        },
        {
          question: 'What do the different status colors mean?',
          answer: 'Red badge = Pending (not yet started), Yellow badge = In Progress (currently working on it), Green badge = Resolved (completed). This color coding helps you quickly identify issue states.'
        }
      ]
    },
    {
      id: 'issue-management',
      name: 'Issue Management',
      icon: FileText,
      color: 'bg-green-100 text-green-600',
      faqs: [
        {
          question: 'Can I view issues that are not assigned to me?',
          answer: 'Yes! Go to "All Issues" tab to view all civic issues in the system. However, you can only update status and add comments to issues assigned to you by the Main Admin.'
        },
        {
          question: 'How do I add comments or updates to an issue?',
          answer: 'Open the issue details by clicking "View Details". Scroll to the comments section, type your message in the input field, and click "Post". This helps maintain communication with citizens and other admins.'
        },
        {
          question: 'What should I do if an issue needs reassignment?',
          answer: 'Contact the Main Admin through the support ticket system or directly. Only Main Admins can reassign issues between different administrators.'
        },
        {
          question: 'How do I handle duplicate issues?',
          answer: 'If you notice duplicate reports, document this in the comments section and notify the Main Admin. They can merge or remove duplicate entries.'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics & Reports',
      icon: BookOpen,
      color: 'bg-purple-100 text-purple-600',
      faqs: [
        {
          question: 'How do I access my performance analytics?',
          answer: 'Click on "Analytics" in the navigation menu to see comprehensive performance metrics including resolution rate, average response time, category distribution, and weekly trends.'
        },
        {
          question: 'What is the resolution rate?',
          answer: 'Resolution rate is the percentage of assigned issues you\'ve successfully resolved. A higher rate indicates better performance. It\'s calculated as (Resolved Issues / Total Assigned Issues) × 100.'
        },
        {
          question: 'Can I export my reports?',
          answer: 'Yes! Click the "Export Report" button in the Analytics page to download your performance data in PDF or Excel format for record-keeping or sharing with supervisors.'
        }
      ]
    },
    {
      id: 'account',
      name: 'Account & Profile',
      icon: Users,
      color: 'bg-yellow-100 text-yellow-600',
      faqs: [
        {
          question: 'How do I update my profile information?',
          answer: 'Go to "Profile" from the top-right user menu. You can update your name, email, mobile number, location, and profile picture. Remember to save changes after editing.'
        },
        {
          question: 'How do I change my password?',
          answer: 'In your Profile page, look for the "Change Password" section. Enter your current password and new password twice for confirmation, then click "Update Password".'
        },
        {
          question: 'I forgot my password. What should I do?',
          answer: 'On the login page, click "Forgot Password". Enter your registered email address, and you\'ll receive instructions to reset your password.'
        }
      ]
    },
    {
      id: 'technical',
      name: 'Technical Issues',
      icon: Settings,
      color: 'bg-red-100 text-red-600',
      faqs: [
        {
          question: 'The page is loading slowly. What should I do?',
          answer: 'Try refreshing the page (Ctrl+R or Cmd+R). Clear your browser cache and cookies. Ensure you have a stable internet connection. If the issue persists, contact technical support.'
        },
        {
          question: 'I can\'t see images attached to issues',
          answer: 'Check your internet connection. Some browsers block images by default. Ensure image loading is enabled in your browser settings. Try accessing from a different browser.'
        },
        {
          question: 'The map is not displaying correctly',
          answer: 'Enable location services in your browser. Check if your browser has blocked location permissions for this site. Make sure JavaScript is enabled.'
        }
      ]
    },
    {
      id: 'policies',
      name: 'Policies & Guidelines',
      icon: Shield,
      color: 'bg-indigo-100 text-indigo-600',
      faqs: [
        {
          question: 'What are the response time expectations?',
          answer: 'Pending issues should be started within 24 hours. In Progress issues should be resolved within 7 days based on complexity. High-priority issues require immediate attention.'
        },
        {
          question: 'What information should I include in comments?',
          answer: 'Provide clear updates about actions taken, resources used, estimated completion time, and any challenges encountered. Be professional and detailed in your communication.'
        },
        {
          question: 'Can I access the system from mobile devices?',
          answer: 'Yes! The admin portal is fully responsive and works on smartphones and tablets. Download our mobile app for better experience on the go.'
        }
      ]
    }
  ];

  // Video Tutorials
  const videoTutorials = [
    {
      title: 'Getting Started with Admin Portal',
      duration: '5:30',
      thumbnail: '🎬',
      description: 'Learn the basics of navigating the admin dashboard',
      views: '1.2K'
    },
    {
      title: 'Managing Assigned Issues',
      duration: '8:15',
      thumbnail: '📋',
      description: 'Complete guide to updating and resolving civic issues',
      views: '856'
    },
    {
      title: 'Understanding Analytics',
      duration: '6:45',
      thumbnail: '📊',
      description: 'How to interpret your performance metrics',
      views: '642'
    },
    {
      title: 'Best Practices for Issue Resolution',
      duration: '10:20',
      thumbnail: '✅',
      description: 'Tips and tricks for efficient civic issue management',
      views: '923'
    }
  ];

  // Quick Links
  const quickLinks = [
    { title: 'User Manual (PDF)', icon: FileText, link: '#', color: 'text-blue-600' },
    { title: 'Video Tutorial Library', icon: Video, link: '#', color: 'text-purple-600' },
    { title: 'Community Forum', icon: MessageCircle, link: '#', color: 'text-green-600' },
    { title: 'API Documentation', icon: BookOpen, link: '#', color: 'text-orange-600' },
  ];

  // Contact Information
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      detail: 'support@civicportal.com',
      subtitle: 'Response within 24 hours',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      detail: '+1 (555) 123-4567',
      subtitle: 'Mon-Fri, 9 AM - 6 PM',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      detail: 'Chat with our team',
      subtitle: 'Available 24/7',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  // Filter FAQs
  const filteredFaqs = faqCategories
    .map(category => ({
      ...category,
      faqs: category.faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category =>
      (selectedCategory === 'all' || category.id === selectedCategory) &&
      category.faqs.length > 0
    );

  const handleFormSubmit = async () => {
    if (!supportForm.name || !supportForm.email || !supportForm.subject || !supportForm.message || !supportForm.recipient) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/contact/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(supportForm)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit ticket');
      }

      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setSupportForm(prev => ({
          name: '',
          email: '',
          subject: '',
          recipient: superAdmins.length > 0 ? superAdmins[0]._id : '',
          message: ''
        }));
      }, 5000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSupportForm({
      ...supportForm,
      [field]: value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-21">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Help & Support Center</h1>
            <p className="text-gray-600 text-lg">Find answers, tutorials, and get assistance</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => window.open(link.link, '_blank')}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1 group text-left"
            >
              <link.icon className={`w-8 h-8 ${link.color} mb-3`} />
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {link.title}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <span>Learn more</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Video Tutorials */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Video Tutorials</h2>
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoTutorials.map((video, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-8 mb-3 flex items-center justify-center text-6xl relative overflow-hidden group-hover:scale-105 transition-transform">
                  {video.thumbnail}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{video.duration}</span>
                  <span>{video.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  All Categories
                </button>
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <category.icon className="w-5 h-5" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>

              {filteredFaqs.length > 0 ? (
                <div className="space-y-6">
                  {filteredFaqs.map((category) => (
                    <div key={category.id}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <category.icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                      </div>
                      <div className="space-y-3 ml-11">
                        {category.faqs.map((faq, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() =>
                                setOpenFaq(openFaq === `${category.id}-${index}` ? null : `${category.id}-${index}`)
                              }
                              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-medium text-gray-900 pr-4">
                                {faq.question}
                              </span>
                              <ChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${openFaq === `${category.id}-${index}` ? 'transform rotate-180' : ''
                                  }`}
                              />
                            </button>
                            {openFaq === `${category.id}-${index}` && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No FAQs found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center mb-4`}>
                <method.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
              <p className="text-gray-900 font-medium mb-1">{method.detail}</p>
              <p className="text-sm text-gray-500">{method.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Support Ticket Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit a Support Ticket</h2>
              <p className="text-gray-600">Can't find what you're looking for? Send us a message and we'll get back to you.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {formSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">Ticket Submitted Successfully!</h3>
                <p className="text-green-700">We've received your support request and will respond within 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={supportForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={supportForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={supportForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Whom To Contact (Super Admin) *
                    </label>
                    <div className="relative">
                      <select
                        value={supportForm.recipient}
                        onChange={(e) => handleInputChange('recipient', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Super Admin</option>
                        {superAdmins.map(admin => (
                          <option key={admin._id} value={admin._id}>{admin.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={supportForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Please describe your issue in detail..."
                  ></textarea>
                </div>

                <button
                  onClick={handleFormSubmit}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Support Ticket
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h2>
            <p className="text-blue-100 mb-6">
              Our support team is available 24/7 to help you with any urgent issues or questions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                Start Live Chat
              </button>
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors">
                Schedule a Call
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;