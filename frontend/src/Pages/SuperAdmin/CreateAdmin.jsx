import { useState } from 'react';
import {
  UserPlus, Mail, Phone, User, MapPin, Building2,
  AlertCircle, CheckCircle, ArrowLeft, Zap, ShieldCheck, Send
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

export default function CreateAdmin() {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    department: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

  const departments = [
    { value: '', label: 'Select Department' },
    { value: 'Potholes', label: '🛣️ Potholes' },
    { value: 'Garbage', label: '🗑️ Garbage' },
    { value: 'Streetlight', label: '💡 Streetlight' },
    { value: 'Water Leakage', label: '💧 Water Leakage' },
    { value: 'Other', label: '📋 Other' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/users/create-dept-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          department: formData.department,
          location: formData.location,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Account created! Login credentials were sent to ${formData.email}`);
        setFormData({ name: '', email: '', mobile: '', department: '', location: '' });
        setTimeout(() => { window.location.href = '/superadmin/admins'; }, 3000);
      } else {
        setError(data.message || 'Failed to create admin. Please try again.');
      }
    } catch (err) {
      console.error('Error creating admin:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Shared input wrapper styles ────────────────────────────────────────────
  const inputWrap = (hasErr) =>
    `relative flex items-center rounded-xl border-2 overflow-hidden transition-all duration-200
     focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]
     ${hasErr
      ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-900/10'
      : isDark
        ? 'border-slate-600 bg-slate-800/60 focus-within:border-blue-500'
        : 'border-slate-200 bg-white focus-within:border-blue-500'}`;

  const inputClass = `w-full py-3.5 bg-transparent border-none outline-none text-base font-medium
    placeholder:text-slate-400/50 ${isDark ? 'text-white' : 'text-slate-900'}`;

  const iconClass = `pl-4 pr-3 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className={`group mb-8 flex items-center gap-3 text-sm font-medium transition-all
            ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <div className={`p-2.5 rounded-full border shadow-sm transition-all
            ${isDark ? 'bg-slate-800/50 border-slate-700 group-hover:bg-blue-500/20' : 'bg-white border-slate-200 group-hover:bg-blue-50'}`}>
            <ArrowLeft className={`w-4 h-4 ${isDark ? 'group-hover:text-blue-400' : 'group-hover:text-blue-600'}`} />
          </div>
          <span className="tracking-wide">Back to Admins</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

          {/* ── Main Form Card ── */}
          <div className="flex-1 order-2 lg:order-1">
            <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300
              ${isDark ? 'bg-slate-800/60 backdrop-blur-xl border border-slate-700/50' : 'bg-white/80 backdrop-blur-xl border border-white/50'}`}>

              {/* Card Header */}
              <div className="relative px-8 pt-10 pb-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-4
                      ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      <Building2 className="w-3 h-3" />
                      Admin Creation
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      New Administrator
                    </h1>
                    <p className={`text-lg font-light ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Assign departmental responsibilities — credentials auto-sent via email.
                    </p>
                  </div>
                  <div className={`hidden sm:flex p-4 rounded-2xl ${isDark ? 'bg-slate-700/50 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <UserPlus className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {(success || error) && (
                <div className="px-8 pb-4">
                  {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 flex items-start gap-4 animate-pulse-once">
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg shadow-emerald-500/30 flex-shrink-0 mt-0.5">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Account Created & Email Sent!</h3>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">{success}</p>
                        <p className="text-xs text-emerald-500/70 dark:text-emerald-500/60 mt-1">Redirecting to Admin Management…</p>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 flex items-center gap-4">
                      <div className="bg-rose-500 text-white p-1.5 rounded-full shadow-lg shadow-rose-500/30">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Error</h3>
                        <p className="text-sm text-rose-600/80 dark:text-rose-400/80">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-10">

                {/* Section: Identity */}
                <div className="space-y-6">
                  <SectionDivider label="Identity" isDark={isDark} />

                  {/* Full Name */}
                  <div className="group space-y-2">
                    <label className={`block text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Full Name
                    </label>
                    <div className={inputWrap(errors.name)}>
                      <div className={iconClass}><User className="w-5 h-5" /></div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g. Rajesh Kumar"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-rose-500 font-semibold ml-1 mt-1">{errors.name}</p>}
                  </div>

                  {/* Email + Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group space-y-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Email Address
                      </label>
                      <div className={inputWrap(errors.email)}>
                        <div className={iconClass}><Mail className="w-5 h-5" /></div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="admin@example.com"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-rose-500 font-semibold ml-1 mt-1">{errors.email}</p>}
                    </div>

                    <div className="group space-y-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Mobile Number
                      </label>
                      <div className={inputWrap(errors.mobile)}>
                        <div className={iconClass}><Phone className="w-5 h-5" /></div>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="10-digit mobile"
                        />
                      </div>
                      {errors.mobile && <p className="text-xs text-rose-500 font-semibold ml-1 mt-1">{errors.mobile}</p>}
                    </div>
                  </div>
                </div>

                {/* Section: Assignment */}
                <div className="space-y-6">
                  <SectionDivider label="Assignment" isDark={isDark} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Department */}
                    <div className="group space-y-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Department
                      </label>
                      <div className={inputWrap(errors.department)}>
                        <div className={iconClass}><Building2 className="w-5 h-5" /></div>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none cursor-pointer`}
                        >
                          {departments.map(d => (
                            <option key={d.value} value={d.value} className={isDark ? 'bg-slate-800' : ''}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 pointer-events-none">
                          <svg className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.department && <p className="text-xs text-rose-500 font-semibold ml-1 mt-1">{errors.department}</p>}
                    </div>

                    {/* Location */}
                    <div className="group space-y-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Location / Area
                      </label>
                      <div className={inputWrap(errors.location)}>
                        <div className={iconClass}><MapPin className="w-5 h-5" /></div>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="e.g. North District"
                        />
                      </div>
                      {errors.location && <p className="text-xs text-rose-500 font-semibold ml-1 mt-1">{errors.location}</p>}
                    </div>
                  </div>
                </div>

                {/* Section: Auto-Password Info Banner */}
                <div className="space-y-4">
                  <SectionDivider label="Security" isDark={isDark} />

                  <div className={`relative overflow-hidden rounded-2xl p-5 border
                    ${isDark
                      ? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-blue-700/40'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`p-3 rounded-xl flex-shrink-0 shadow-lg
                        ${isDark ? 'bg-blue-500/20 text-blue-400 shadow-blue-500/10' : 'bg-blue-100 text-blue-600 shadow-blue-200'}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                          Auto-Generated Secure Password
                        </h3>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          A strong 12-character password will be <span className="font-semibold">automatically generated</span> by
                          the system — you don't need to create one manually.
                        </p>
                        <div className={`mt-3 flex flex-wrap gap-2`}>
                          {['Uppercase', 'Lowercase', 'Numbers', 'Symbols'].map(tag => (
                            <span key={tag} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                              ${isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                              <CheckCircle className="w-3 h-3" /> {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 pt-4 border-t flex items-center gap-3
                      ${isDark ? 'border-blue-700/30' : 'border-blue-200'}`}>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                        <Send className="w-4 h-4" />
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        The password will be <strong>emailed instantly</strong> to the admin's registered email address upon account creation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full group overflow-hidden rounded-2xl p-[2px] transition-all hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="font-bold tracking-wide">Creating Account & Sending Email…</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-lg tracking-wide">Create Administrator</span>
                          <UserPlus className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-96 order-1 lg:order-2 space-y-6">

            {/* Role Overview */}
            <div className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-md
              ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Building2 className="w-32 h-32 text-blue-500" />
              </div>
              <h3 className={`text-xl font-bold mb-6 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>Role Overview</h3>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Full Authority</h4>
                    <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Complete control over issue resolution and status updates within their assigned domain.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Geo-Fenced</h4>
                    <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Operations are limited to their specified geographical area and department.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden
              ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-base font-bold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                📋 How It Works
              </h3>
              <ol className="space-y-4">
                {[
                  { icon: '1', color: 'blue', text: 'Fill in the admin details and submit the form.' },
                  { icon: '2', color: 'indigo', text: 'System auto-generates a strong 12-character password.' },
                  { icon: '3', color: 'violet', text: 'Credentials are emailed instantly to the admin.' },
                  { icon: '4', color: 'purple', text: 'Admin logs in and changes their password on first use.' },
                ].map(step => (
                  <li key={step.icon} className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
                      bg-${step.color}-500/15 text-${step.color}-400`}>
                      {step.icon}
                    </span>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.text}</p>
                  </li>
                ))}
              </ol>

              <div className={`mt-5 pt-5 border-t flex items-start gap-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <ShieldCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="font-bold block mb-0.5">Security Note</span>
                  Passwords are never stored in plain text — they are hashed with bcrypt before being saved.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Helper: Section Divider ── */
function SectionDivider({ label, isDark }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  );
}