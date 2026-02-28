import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Camera, Loader2, CheckCircle, AlertCircle, Activity, Settings, AlertTriangle, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { BASE_URL } from "../../../config";
import { useTheme } from "../../Context/ThemeContext";

export default function Profile() {
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ── Change Password modal state ──────────────────────────────────────────
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwStrengthChecks = [
    { label: 'At least 6 characters', ok: pwForm.newPassword.length >= 6 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(pwForm.newPassword) },
    { label: 'Number', ok: /\d/.test(pwForm.newPassword) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(pwForm.newPassword) },
  ];
  const pwScore = pwStrengthChecks.filter(c => c.ok).length;
  const pwColours = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwError('New passwords do not match');
    if (pwForm.newPassword.length < 6) return setPwError('Password must be at least 6 characters');
    setPwLoading(true);
    try {
      const userId = user?.id || user?._id;
      const res = await fetch(`${BASE_URL}/auth/users/${userId}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) return setPwError(data.message || 'Failed to change password');
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setIsChangingPassword(false); setPwSuccess(''); }, 2000);
    } catch { setPwError('Unable to connect. Please try again.'); }
    finally { setPwLoading(false); }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    location: "",
    state: "",
    area: ""
  });

  useEffect(() => {
    fetchUserProfile();
    fetchActivities();
  }, []);

  const [activities, setActivities] = useState([]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`${BASE_URL}/activity/my-activity`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        // Transform backend activity to frontend format
        const formattedActivities = data.activities.map(act => ({
          id: act._id,
          action: formatActionText(act),
          time: new Date(act.createdAt).toLocaleString(),
          type: mapActionToType(act.action)
        }));
        setActivities(formattedActivities);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const formatActionText = (activity) => {
    switch (activity.action) {
      case 'LOGIN': return 'Logged in to the system';
      case 'LOGOUT': return 'Logged out';
      case 'CREATE_ISSUE': return `Reported issue: ${activity.details?.title || 'Unknown'}`;
      case 'UPDATE_STATUS': return `Updated issue status to ${activity.details?.status}`;
      case 'ASSIGN_ISSUE': return `Assigned issue to admin`;
      case 'COMMENT': return `Commented on issue`;
      case 'ESCALATE_ISSUE': return `Escalated an issue`;
      case 'BLOCK_USER': return `Blocked a user`;
      case 'UNBLOCK_USER': return `Unblocked a user`;
      default: return activity.action.replace(/_/g, ' ');
    }
  };

  const mapActionToType = (action) => {
    if (['LOGIN', 'LOGOUT', 'UPDATE_PROFILE'].includes(action)) return 'system';
    if (['CREATE_ISSUE', 'UPDATE_STATUS', 'ASSIGN_ISSUE', 'COMMENT'].includes(action)) return 'resolution';
    if (['ESCALATE_ISSUE', 'BLOCK_USER', 'UNBLOCK_USER'].includes(action)) return 'alert';
    return 'system';
  };

  const fetchUserProfile = async () => {
    try {
      const sessionRes = await fetch(`${BASE_URL}/auth/users/session`, {
        method: "GET",
        credentials: "include",
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.loggedIn) {
        setError("Please login to view your profile");
        setLoading(false);
        return;
      }

      // Fetch full user details
      const userId = sessionData.user._id || sessionData.user.id;
      const userRes = await fetch(`${BASE_URL}/auth/users/${userId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch user details");
      }

      const userData = await userRes.json();

      if (userData.success && userData.user) {
        setUser({
          ...userData.user,
          id: userData.user._id
        });

        setFormData({
          name: userData.user.name || "",
          email: userData.user.email || "",
          mobile: userData.user.mobile || "",
          location: userData.user.location?.address || "",
          state: userData.user.location?.state || "",
          area: userData.user.location?.area || ""
        });

        if (userData.user.profilePicture && userData.user.profilePicture !== 'default-profile.png') {
          setImagePreview(userData.user.profilePicture.startsWith('http') ? userData.user.profilePicture : `${BASE_URL}/uploads/${userData.user.profilePicture}`);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("area", formData.area);

      if (profileImage) {
        formDataToSend.append("profilePicture", profileImage);
      }

      const res = await fetch(`${BASE_URL}/auth/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        body: formDataToSend
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      // Update local state with new user data
      setUser({
        ...result.user,
        id: result.user._id
      });

      setFormData({
        name: result.user.name || "",
        email: result.user.email || "",
        mobile: result.user.mobile || "",
        location: result.user.location?.address || "",
        state: result.user.location?.state || "",
        area: result.user.location?.area || ""
      });

      if (result.user.profilePicture && result.user.profilePicture !== 'default-profile.png') {
        setImagePreview(result.user.profilePicture.startsWith('http') ? result.user.profilePicture : `${BASE_URL}/uploads/${result.user.profilePicture}`);
      }

      setSuccess("Profile updated successfully!");
      setEditing(false);
      setProfileImage(null);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      location: user.location?.address || "",
      state: user.location?.state || "",
      area: user.location?.area || ""
    });

    if (user.profilePicture && user.profilePicture !== 'default-profile.png') {
      setImagePreview(user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}/uploads/${user.profilePicture}`);
    } else {
      setImagePreview(null);
    }

    setProfileImage(null);
    setEditing(false);
    setError("");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    if (!role) return isDark ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-300';
    const roleStr = role.toString().toLowerCase();
    if (roleStr === 'super_admin' || roleStr === 'superadmin') {
      return isDark ? 'bg-purple-900/40 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (roleStr === 'dept_admin' || roleStr === 'deptadmin' || roleStr === 'admin') {
      return isDark ? 'bg-indigo-900/40 text-indigo-300 border-indigo-800' : 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
    // citizen
    return isDark ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getRoleDisplayName = (role) => {
    if (!role) return '👤 Citizen';
    const roleStr = role.toString().toLowerCase();
    if (roleStr === 'super_admin' || roleStr === 'superadmin') return '👑 Super Admin';
    if (roleStr === 'dept_admin' || roleStr === 'deptadmin') return '🛡️ Dept Admin';
    if (roleStr === 'admin') return '👑 Admin';
    return '👤 Citizen';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-lg shadow-lg max-w-md text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Error</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-lg shadow-lg max-w-md text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No User Data</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Unable to load user information</p>
        </div>
      </div>
    );
  }

  const inputClasses = `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none ${isDark
    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:bg-gray-800'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
    }`;

  const labelClasses = `block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-300 ${isDark ? 'bg-[#0B1120]' : 'bg-gray-50/50'}`}>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[20%] -right-[10%] w-[700px] h-[700px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob ${isDark ? 'bg-purple-900' : 'bg-purple-200'}`}></div>
        <div className={`absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 ${isDark ? 'bg-blue-900' : 'bg-blue-200'}`}></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Success/Error Alerts */}
        {(success || error) && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-md ${success
            ? (isDark ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-50 border border-green-200 text-green-700')
            : (isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-700')
            }`}>
            {success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{success || error}</p>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column - Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`rounded-3xl shadow-xl overflow-hidden backdrop-blur-md border ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white/80 border-white/50'}`}>

              {/* Cover Area */}
              <div className={`h-32 relative ${isDark ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
              </div>

              {/* Profile Image Area */}
              <div className="px-6 pb-6 text-center -mt-16">
                <div className="relative inline-block">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className={`w-32 h-32 rounded-full border-4 shadow-2xl object-cover ${isDark ? 'border-gray-800' : 'border-white'}`}
                    />
                  ) : (
                    <div className={`w-32 h-32 rounded-full border-4 shadow-2xl flex items-center justify-center ${isDark ? 'border-gray-800 bg-gray-700' : 'border-white bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                      <span className="text-white text-4xl font-bold">{getInitials(user.name)}</span>
                    </div>
                  )}

                  {editing && (
                    <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-all hover:scale-110 active:scale-95">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="mt-4">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</h2>
                  <div className="flex justify-center flex-wrap gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                    {user.isMainAdmin && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        ⭐ Main Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-slate-100'}`}>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Account ID</p>
                      <p className={`font-mono text-xs truncate ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>#{user.id?.slice(-6) || user._id?.slice(-6)}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Member Since</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                        {user.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status Card - Optional visual element */}
            <div className={`p-6 rounded-3xl shadow-lg border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-white/50'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'}`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Status</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Your account is active and secure</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Edit */}
          <div className="lg:col-span-8">
            <div className={`rounded-3xl shadow-xl overflow-hidden backdrop-blur-md border h-full ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white/80 border-white/50'}`}>
              <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                      }`}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                        }`}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className={`text-lg font-medium flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}>
                        <User className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        {user.name}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelClasses}>Email Address</label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className={`text-lg font-medium flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}>
                        <Mail className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        {user.email}
                      </div>
                    )}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className={labelClasses}>Mobile Number</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className={`text-lg font-medium flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}>
                        <Phone className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        {user.mobile}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Location</label>
                    {editing ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Enter your location"
                        className={inputClasses}
                      />
                    ) : (
                      <div className={`text-lg font-medium flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}>
                        <MapPin className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <div className="flex flex-col">
                          <span>{user.location?.address || "Not specified"}</span>
                          {(user.location?.area || user.location?.state) && (
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {[user.location?.area, user.location?.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* State Field */}
                  <div>
                    <label className={labelClasses}>State</label>
                    {editing ? (
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g. Andhra Pradesh"
                        className={inputClasses}
                      />
                    ) : (
                      <div className={`text-lg font-medium flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}>
                        <MapPin className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        {user.location?.state || "Not specified"}
                      </div>
                    )}
                  </div>

                  {/* Area Field */}
                  <div>
                    <label className={labelClasses}>Area</label>
                    {editing ? (
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        placeholder="e.g. Visakhapatnam"
                        className={inputClasses}
                      />
                    ) : (
                      <div className={`text-lg font-medium flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-transparent text-gray-900'}`}>
                        <MapPin className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        {user.location?.area || "Not specified"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Section */}
                <div className="mt-10">
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
                    Security & Privacy
                  </h4>
                  <div className={`rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className={`font-bold ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>Password</h5>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Keep your account secure</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsChangingPassword(true); setPwError(''); setPwSuccess(''); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                        : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 shadow-sm'
                        }`}>
                      <KeyRound className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Activity Log Section */}
                <div className="mt-10">
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
                    Recent Activity
                  </h4>
                  <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6 flex flex-col`}>
                    <div className="flex-1 flow-root">
                      {activities.length > 0 ? (
                        <ul className="-mb-8">
                          {activities.map((activity, activityIdx) => (
                            <li key={activity.id}>
                              <div className="relative pb-8">
                                {activityIdx !== activities.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ${isDark ? 'ring-gray-800' : 'ring-white'}
                            ${activity.type === 'system' ? (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600') :
                                        activity.type === 'resolution' ? (isDark ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-600') :
                                          activity.type === 'alert' ? (isDark ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-600') :
                                            (isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-600')}`}>
                                      {activity.type === 'system' ? <Settings className="w-4 h-4" /> :
                                        activity.type === 'resolution' ? <CheckCircle className="w-4 h-4" /> :
                                          activity.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> :
                                            <Activity className="w-4 h-4" />}
                                    </span>
                                  </div>
                                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                      <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} font-medium`}>{activity.action}</p>
                                    </div>
                                    <div className={`whitespace-nowrap text-right text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {activity.time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No recent activity found.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Change Password Modal ── */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md shadow-2xl`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
              </div>
              <button onClick={() => setIsChangingPassword(false)} className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {pwError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />{pwSuccess}
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className={`w-full px-4 py-2.5 pr-10 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                    placeholder="Enter current password" required />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className={`w-full px-4 py-2.5 pr-10 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                    placeholder="Min. 6 characters" required />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`flex-1 rounded-full transition-all ${i <= pwScore ? pwColours[pwScore] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <ul className="space-y-0.5">
                      {pwStrengthChecks.map(c => (
                        <li key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{c.ok ? '✓' : '○'}</span>{c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={pwForm.confirmPassword}
                    onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-2.5 pr-10 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                    placeholder="Re-enter new password" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.confirmPassword && (
                  <p className={`text-xs mt-1 ${pwForm.newPassword === pwForm.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {pwForm.newPassword === pwForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsChangingPassword(false)}
                  className={`flex-1 py-2.5 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl font-bold text-sm transition-colors`}>
                  Cancel
                </button>
                <button type="submit" disabled={pwLoading || pwForm.newPassword !== pwForm.confirmPassword}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                  {pwLoading ? 'Saving…' : <><KeyRound className="w-4 h-4" /> Save Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}