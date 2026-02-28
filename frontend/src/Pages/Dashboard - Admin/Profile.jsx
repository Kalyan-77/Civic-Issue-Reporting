import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Phone,
    Shield,
    MapPin,
    Clock,
    Calendar,
    Settings,
    Edit2,
    Camera,
    Activity,
    CheckCircle,
    AlertTriangle,
    Lock,
    Eye,
    EyeOff,
    KeyRound,
    X
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

export default function AdminProfile() {
    const { isDark } = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        mobile: '',
        location: '',
        profilePicture: null
    });
    const [previewImage, setPreviewImage] = useState(null);

    // ── Change Password modal state ───────────────────────────────────────────
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
            const res = await fetch(`${BASE_URL}/auth/users/${user._id}/change-password`, {
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


    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/users/session`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.loggedIn && data.user) {
                // Format dates
                const joinDate = new Date(data.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                const lastActive = data.user.lastLogin
                    ? new Date(data.user.lastLogin).toLocaleString()
                    : 'Just now';

                setUser({
                    ...data.user,
                    phone: data.user.mobile || 'N/A',
                    location: data.user.location?.address || data.user.location || 'Not Set',
                    joinDate: joinDate,
                    lastActive: lastActive,
                    // Fallback or use existing data
                    role: data.user.role === 'dept_admin' ? 'Department Admin' : data.user.role,
                    department: data.user.department || 'General',
                    // Stats come from backend now or mocked
                    stats: data.user.stats || {
                        issuesAssigned: 0,
                        issuesResolved: 0,
                        pendingIssues: 0
                    },
                    // Activities will be fetched separately
                    activities: []
                });

                // Fetch activities
                fetchActivities();
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

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
                setUser(prev => ({ ...prev, activities: formattedActivities }));
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

    const handleEditClick = () => {
        setEditForm({
            name: user.name,
            mobile: user.mobile,
            location: typeof user.location === 'object' ? (user.location?.address || '') : (user.location || ''),
            profilePicture: null
        });
        setPreviewImage(user.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}/uploads/${user.profilePicture}`) : null);
        setIsEditing(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('mobile', editForm.mobile);
            formData.append('location', editForm.location);
            if (editForm.profilePicture) {
                formData.append('profilePicture', editForm.profilePicture);
            }

            console.log(`Updating user ${user._id} with data:`, {
                name: editForm.name,
                mobile: editForm.mobile,
                location: editForm.location,
                hasImage: !!editForm.profilePicture
            });

            const response = await fetch(`${BASE_URL}/auth/users/${user._id}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            if (data.success) {
                // Update local state with new data
                setUser(prev => ({
                    ...prev,
                    name: data.user.name,
                    mobile: data.user.mobile,
                    location: data.user.location?.address || data.user.location || '',
                    phone: data.user.mobile, // Sync phone display field
                    profilePicture: data.user.profilePicture
                }));
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditForm({ ...editForm, profilePicture: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Not Found</h2>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Please login to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} px-6 pb-6 pt-24 lg:pt-28 transition-colors duration-200`}>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Profile Header Card */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden relative`}>
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end">
                                <div className="relative">
                                    <div className={`w-32 h-32 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full p-1 shadow-lg overflow-hidden`}>
                                        {user.profilePicture && user.profilePicture !== 'default-profile.png' ? (
                                            <img
                                                src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}/uploads/${user.profilePicture}`}
                                                alt={user.name}
                                                className="w-full h-full object-cover rounded-full border-4 border-white"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${isDark ? 'bg-blue-900/50 text-blue-200 border-gray-800' : 'bg-blue-100 text-blue-600 border-white'} rounded-full flex items-center justify-center text-4xl font-bold border-4`}>
                                                {user.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleEditClick}
                                        className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="ml-6 mb-2">
                                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h1>
                                    <div className={`flex items-center gap-4 mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <span className={`flex items-center gap-1 ${isDark ? 'bg-blue-900/50 text-blue-200 border-blue-900' : 'bg-blue-50 text-blue-700 border-blue-100'} px-3 py-1 rounded-full text-sm font-medium border`}>
                                            <Shield className="w-3 h-3" />
                                            {user.role}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            {user.location}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            Joined {user.joinDate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mb-2">
                                <button
                                    onClick={handleEditClick}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} pt-8`}>
                            <div className={`flex items-center p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} rounded-xl border`}>
                                <div className={`p-3 ${isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-600'} rounded-lg mr-4`}>
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.stats.issuesAssigned}</div>
                                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Assigned Issues</div>
                                </div>
                            </div>
                            <div className={`flex items-center p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} rounded-xl border`}>
                                <div className={`p-3 ${isDark ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-600'} rounded-lg mr-4`}>
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.stats.issuesResolved}</div>
                                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Resolved Issues</div>
                                </div>
                            </div>
                            <div className={`flex items-center p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} rounded-xl border`}>
                                <div className={`p-3 ${isDark ? 'bg-yellow-900/50 text-yellow-200' : 'bg-yellow-100 text-yellow-600'} rounded-lg mr-4`}>
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.stats.pendingIssues}</div>
                                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Pending Issues</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Detailed Info Card */}
                    <div className={`lg:col-span-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
                            <User className="w-5 h-5 text-gray-400" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="group">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label>
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium group-hover:text-blue-600 transition-colors`}>{user.name}</div>
                            </div>
                            <div className="group">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Email Address</label>
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium flex items-center gap-2 group-hover:text-blue-600 transition-colors`}>
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {user.email}
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium flex items-center gap-2 group-hover:text-blue-600 transition-colors`}>
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {user.phone}
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Department</label>
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium group-hover:text-blue-600 transition-colors`}>{user.department}</div>
                            </div>
                            <div className="group">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">ADMIN ID</label>
                                <div className={`${isDark ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-50'} font-medium font-mono inline-block px-2 py-1 rounded`}>
                                    {user._id ? `ADM-${user._id.slice(-6).toUpperCase()}` : 'N/A'}
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Last Active</label>
                                <div className="text-green-600 font-medium flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {user.lastActive}
                                </div>
                            </div>
                        </div>

                        <div className={`mt-8 pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
                                <Shield className="w-5 h-5 text-gray-400" />
                                Security
                            </h3>
                            <div className="space-y-4">
                                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} rounded-lg border`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${isDark ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-600'} rounded-lg`}>
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Password</div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Change your account password</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsChangingPassword(true); setPwError(''); setPwSuccess(''); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                    >
                                        <KeyRound className="w-3.5 h-3.5" />
                                        Change Password
                                    </button>
                                </div>
                                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} rounded-lg border`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-600'} rounded-lg`}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Role</div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Department Administrator</div>
                                        </div>
                                    </div>
                                    <span className={`text-blue-600 text-sm font-medium ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-100 border-blue-200'} px-3 py-1 rounded-full border`}>Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log Card */}
                    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6 flex flex-col`}>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
                            <Activity className="w-5 h-5 text-gray-400" />
                            Recent Activity
                        </h3>
                        <div className="flex-1 flow-root">
                            <ul className="-mb-8">
                                {user.activities.map((activity, activityIdx) => (
                                    <li key={activity.id}>
                                        <div className="relative pb-8">
                                            {activityIdx !== user.activities.length - 1 ? (
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
                        </div>
                        <button className={`mt-6 w-full py-2 text-sm ${isDark ? 'text-blue-400 hover:bg-blue-900/30 hover:border-blue-800' : 'text-blue-600 hover:bg-blue-50 hover:border-blue-100'} font-medium rounded-lg transition-colors border border-transparent`}>
                            View All Activity
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200`}>
                        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                            >
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative w-24 h-24 mb-4">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className={`w-full h-full object-cover rounded-full border-4 ${isDark ? 'border-gray-700' : 'border-gray-100'} shadow-sm`}
                                        />
                                    ) : (
                                        <div className={`w-full h-full ${isDark ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-600'} rounded-full flex items-center justify-center text-3xl font-bold`}>
                                            {editForm.name.charAt(0)}
                                        </div>
                                    )}
                                    <label
                                        htmlFor="profile-upload"
                                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                                    >
                                        <Camera className="w-3 h-3" />
                                        <input
                                            id="profile-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-gray-500">Click camera icon to change photo</p>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className={`w-full px-4 py-2 border ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.mobile}
                                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                                    className={`w-full px-4 py-2 border ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Location</label>
                                <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    className={`w-full px-4 py-2 border ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-white border-gray-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent`}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className={`px-4 py-2 ${isDark ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'} rounded-lg font-medium transition-colors`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

                            <div>
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Current Password</label>
                                <div className="relative">
                                    <input type={showCurrent ? 'text' : 'password'} value={pwForm.currentPassword}
                                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                        className={`w-full px-4 py-2.5 pr-10 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
                                        placeholder="Enter current password" required />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>New Password</label>
                                <div className="relative">
                                    <input type={showNew ? 'text' : 'password'} value={pwForm.newPassword}
                                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                        className={`w-full px-4 py-2.5 pr-10 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
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

                            <div>
                                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Confirm New Password</label>
                                <div className="relative">
                                    <input type={showConfirm ? 'text' : 'password'} value={pwForm.confirmPassword}
                                        onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                        className={`w-full px-4 py-2.5 pr-10 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm`}
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
                                    className={`flex-1 py-2.5 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl font-medium text-sm transition-colors`}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={pwLoading || pwForm.newPassword !== pwForm.confirmPassword}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
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
