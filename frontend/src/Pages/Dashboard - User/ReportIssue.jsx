import { useState, useEffect } from "react";
import {
  MapPin,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Camera,
  Navigation,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../Context/ThemeContext";
import { BASE_URL } from "../../../config";
import LeafletMap from "../../Components/LeafletMap";

export default function ReportIssue() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    latitude: "",
    longitude: "",
    address: "",
    area: ""
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const categories = [
    { value: "Garbage", label: "Garbage", icon: "🗑️" },
    { value: "Streetlight", label: "Lights", icon: "💡" },
    { value: "Pothole", label: "Pothole", icon: "🕳️" },
    { value: "Water Leakage", label: "Water", icon: "💧" },
    { value: "Other", label: "Other", icon: "📋" }
  ];

  const priorities = [
    { value: "Low", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
    { value: "Medium", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" },
    { value: "High", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" }
  ];

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/users/session`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.loggedIn) {
        setUser(data.user);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
      navigate('/login');
    } finally {
      setLoadingUser(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handlePrioritySelect = (priority) => {
    setFormData(prev => ({ ...prev, priority }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image size should be less than 5MB", "error");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser", "error");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        let fetchedAddress = "";
        let fetchedArea = "";

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                "User-Agent": "CitizenIssueReportingApp/1.0",
                "Accept-Language": "en-US,en;q=0.9"
              }
            }
          );
          const data = await response.json();

          if (data && data.address) {
            fetchedAddress = data.display_name;
            fetchedArea =
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.residential ||
              data.address.village ||
              data.address.town ||
              data.address.city ||
              "";
          }
        } catch (error) {
          console.error("Failed to fetch address details:", error);
          showNotification("Location captured, but failed to fetch address details", "warning");
        }

        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: fetchedAddress,
          area: fetchedArea
        }));
        setGettingLocation(false);
        showNotification("Location and address captured successfully!", "success");
      },
      (error) => {
        console.error("Error getting location:", error);
        showNotification("Unable to retrieve your location. Please enable location services.", "error");
        setGettingLocation(false);
      }
    );
  };

  const handleLocationSelect = ({ lat, lng, address, area }) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
      area: area || prev.area
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      showNotification("Please login first to report an issue!", "error");
      setLoading(false);
      return;
    }

    // Basic Validation
    if (!formData.title || !formData.description || !formData.category || !formData.area) {
      showNotification("Please fill in all required fields", "error");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append("createdBy", user._id || user.id);
      if (image) formDataToSend.append("image", image);

      const res = await fetch(`${BASE_URL}/issue/report`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to report issue");

      showNotification("Issue reported successfully! Redirecting...", "success");

      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "Medium",
        latitude: "",
        longitude: "",
        address: "",
        area: ""
      });
      setImage(null);
      setImagePreview(null);

      setTimeout(() => navigate('/citizen'), 2000);

    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const inputStyles = `w-full px-5 py-3.5 rounded-2xl border outline-none transition-all font-medium ${isDark
    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:bg-gray-800 focus:border-blue-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 shadow-sm'
    }`;

  const labelStyles = `block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`;

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>

      {/* Notifications Toast */}
      {notification.show && (
        <div className={`fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-right duration-300 ${notification.type === 'success'
          ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100'
          : 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-10">
          {/* <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-full transition-all w-fit font-medium text-sm ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow'
              }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button> */}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className={`text-4xl font-extrabold mb-3 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Report an Issue
              </h1>
              <p className={`text-lg max-w-2xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Help us improve your community by reporting civic problems. Please provide accurate details for faster resolution.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Form Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* Basic Details Card */}
            <div className={`p-6 md:p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Issue Details</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Describe the problem you are facing</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className={labelStyles}>Issue Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Broken Streetlight outside Central Park"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`${inputStyles} appearance-none cursor-pointer`}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                  </div>
                </div>

                <div>
                  <label className={labelStyles}>Priority Level</label>
                  <div className="flex flex-wrap gap-3">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePrioritySelect(p.value)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.priority === p.value
                          ? p.color + ' ring-2 ring-offset-2 ring-transparent'
                          : isDark
                            ? 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:shadow-sm'
                          }`}
                      >
                        {p.value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelStyles}>Description <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Please describe the issue in detail. Mention any specific landmarks or hazards..."
                    className={`${inputStyles} resize-none leading-relaxed`}
                  />
                </div>
              </div>
            </div>

            {/* Location Card with Map */}
            <div className={`p-6 md:p-8 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Location</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Pinpoint the exact spot</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${gettingLocation
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                    }`}
                >
                  {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {gettingLocation ? 'Locating...' : 'Use My GPS'}
                </button>
              </div>

              <div className="space-y-6">

                {/* Integrated Map */}
                <div className="rounded-2xl border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden ring-1 ring-black/5">
                  <LeafletMap
                    onLocationSelect={handleLocationSelect}
                    initialLocation={{
                      lat: formData.latitude,
                      lng: formData.longitude
                    }}
                  />
                </div>

                <div className="sm:hidden">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg"
                  >
                    <Navigation className="w-4 h-4" />
                    Use My GPS Location
                  </button>
                </div>

                {/* Coordinates Display Card */}
                {(formData.latitude || formData.longitude) && (
                  <div className={`grid grid-cols-2 gap-px rounded-xl overflow-hidden border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-slate-200 border-slate-200'}`}>
                    <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Latitude</span>
                      <p className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{formData.latitude}</p>
                    </div>
                    <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Longitude</span>
                      <p className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{formData.longitude}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelStyles}>Area / Locality <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Auto-filled from map or enter manually"
                    className={inputStyles}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Full Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Street address or nearby landmarks"
                    className={`${inputStyles} resize-none`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Column (Image & Submit) */}
          <div className="lg:col-span-4 space-y-8">

            {/* Image Upload Card */}
            <div className={`p-6 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Evidence</h3>
                </div>
              </div>

              <div className="relative">
                {!imagePreview ? (
                  <label className={`group flex flex-col items-center justify-center w-full aspect-square md:aspect-video lg:aspect-square border-2 border-dashed rounded-3xl cursor-pointer transition-all ${isDark
                    ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/30'
                    : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'
                    }`}>
                    <div className={`p-5 rounded-full mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-gray-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className={`font-bold text-lg ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>Upload Photo</span>
                    <span className={`text-xs mt-2 font-medium ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>JPG, PNG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative w-full aspect-square md:aspect-video lg:aspect-square rounded-3xl overflow-hidden group shadow-lg">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-4 right-4 bg-red-500/90 hover:bg-red-600 text-white p-3 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-sm drop-shadow-md">Image Preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className={`sticky top-8 p-6 rounded-3xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ready to Submit?
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Ensure location and details are accurate.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="group relative w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span>Submit Report</span>
                    {!loading && <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className={`w-full font-bold py-3.5 rounded-2xl transition-colors ${isDark
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}