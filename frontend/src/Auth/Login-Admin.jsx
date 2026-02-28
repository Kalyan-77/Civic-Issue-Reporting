import { useState } from 'react';
import { AlertCircle, Mail, Lock, Eye, EyeOff, Users, Shield, Crown } from 'lucide-react';
import { BASE_URL } from '../../config';

export default function LoginAdmin() {
  const [userType, setUserType] = useState('dept_admin');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleUserTypeSwitch = (type) => {
    setUserType(type);
    setError('');
    setFormData({ email: '', password: '' });
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Validate user type matches selected portal
        if (userType === 'super_admin' && data.user.role !== 'super_admin') {
          setError('Access denied. Super Admin credentials required.');
          setLoading(false);
          return;
        }
        
        if (userType === 'dept_admin' && data.user.role !== 'dept_admin') {
          setError('Access denied. Department Admin credentials required.');
          setLoading(false);
          return;
        }
        
        if (userType === 'citizen' && data.user.role !== 'citizen') {
          setError('Please use the appropriate administration login portal.');
          setLoading(false);
          return;
        }

        // Navigate based on user role
        if (data.user.role === 'super_admin') {
          window.location.href = '/superadmin/';
        } else if (data.user.role === 'dept_admin') {
          window.location.href = '/admin/';
        } else {
          window.location.href = '/citizen/';
        }
        
        console.log('User data:', data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeConfig = () => {
    switch(userType) {
      case 'super_admin':
        return {
          icon: Crown,
          title: 'Super Admin Login',
          subtitle: 'System-wide management',
          color: 'purple',
          gradient: 'from-purple-500 to-purple-500',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600',
          focusRing: 'focus:ring-purple-500 focus:border-purple-500',
          buttonBg: 'bg-purple-600 hover:bg-purple-700',
          linkColor: 'text-purple-600 hover:text-purple-700',
          placeholder: 'superadmin@example.com'
        };
      case 'dept_admin':
        return {
          icon: Shield,
          title: 'Department Admin Login',
          subtitle: 'Manage civic issues',
          color: 'indigo',
          gradient: 'from-indigo-500 to-indigo-500',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-600',
          focusRing: 'focus:ring-indigo-500 focus:border-indigo-500',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
          linkColor: 'text-indigo-600 hover:text-indigo-700',
          placeholder: 'admin@example.com'
        };
      default:
        return {
          icon: Users,
          title: 'Citizen Login',
          subtitle: 'Report and track issues',
          color: 'blue',
          gradient: 'from-blue-500 to-blue-500',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          focusRing: 'focus:ring-blue-500 focus:border-blue-500',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          linkColor: 'text-blue-600 hover:text-blue-700',
          placeholder: 'you@example.com'
        };
    }
  };

  const config = getUserTypeConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Civic Issue Reporter</h1>
          <p className="text-gray-600">Sign in to report and track community issues</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Toggle Switch - Three Options */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="grid grid-cols-3 gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => handleUserTypeSwitch('citizen')}
                className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  userType === 'citizen' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Citizen
              </button>
              <button
                onClick={() => handleUserTypeSwitch('dept_admin')}
                className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  userType === 'dept_admin' 
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Dept Admin
              </button>
              <button
                onClick={() => handleUserTypeSwitch('super_admin')}
                className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  userType === 'super_admin' 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Super Admin
              </button>
            </div>
          </div>

          {/* Login Form Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bgColor}`}>
              <IconComponent className={`w-6 h-6 ${config.textColor}`} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {config.title}
              </h2>
              <p className="text-sm text-gray-500">
                {config.subtitle}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${config.focusRing} outline-none transition`}
                  placeholder={config.placeholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 ${config.focusRing} outline-none transition`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className={`w-4 h-4 border-gray-300 rounded ${config.textColor} ${config.focusRing}`}
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button className={`text-sm font-medium ${config.linkColor}`}>
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonBg} focus:ring-${config.color}-500`}
            >
              {loading ? 'Signing in...' : `Sign In as ${userType === 'citizen' ? 'Citizen' : userType === 'dept_admin' ? 'Dept Admin' : 'Super Admin'}`}
            </button>

            {userType === 'citizen' && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button 
                   onClick={() => window.location.href = '/register'}
                  className={`${config.linkColor} font-medium cursor-pointer`}>
                    Register here
                  </button>
                </p>
              </div>
            )}

            {(userType === 'dept_admin' || userType === 'super_admin') && (
              <div className="text-center">
                <p className="text-sm text-gray-500 italic">
                  🔒 Authorized personnel only
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}