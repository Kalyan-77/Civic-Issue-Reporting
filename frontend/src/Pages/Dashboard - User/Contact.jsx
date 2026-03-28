import { useState, useEffect } from "react";
import { Send, Mail, Phone, MapPin, Clock, CheckCircle, AlertCircle, Loader2, User, Building2, ChevronRight, HelpCircle, ChevronDown } from "lucide-react";
import { BASE_URL } from "../../../config";
import { useTheme } from "../../Context/ThemeContext";

export default function Contact() {
  // const { isDark } = useTheme(); // Removed unused variable, CSS handles theming
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    recipient: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [superAdmins, setSuperAdmins] = useState([]);
  const [deptAdmins, setDeptAdmins] = useState([]);
  const [selectedDeptAdmin, setSelectedDeptAdmin] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const superRes = await fetch(`${BASE_URL}/auth/users/super-admins`, { credentials: "include" });
        const superData = await superRes.json();
        if (superData.success && superData.admins) setSuperAdmins(superData.admins);

        const deptRes = await fetch(`${BASE_URL}/auth/users/dept-admins`, { credentials: "include" });
        const deptData = await deptRes.json();
        if (deptData.success && deptData.admins) {
          setDeptAdmins(deptData.admins);
          if (deptData.admins.length > 0) {
            setSelectedDeptAdmin(deptData.admins[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch admins:", err);
      }
    };
    fetchAdmins();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeptChange = (e) => {
    const adminId = e.target.value;
    const admin = deptAdmins.find(a => a._id === adminId);
    setSelectedDeptAdmin(admin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recipient) {
      setError("Please select a recipient.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${BASE_URL}/contact/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed to send message");

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "", recipient: "" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const AdminCard = ({ name, email, phone, location }) => (
    <div className="group p-4 rounded-xl bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-transparent hover:border-purple-100 dark:hover:border-purple-900/30 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-gray-100">{name}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Administrator</p>
        </div>
      </div>

      <div className="space-y-2 pl-1">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
          <span>{phone}</span>
        </div>
        {location && (
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
            {(() => {
              const parts = [location.address, location.state, location.area].filter(Boolean);
              return <span>{parts.join(', ')}</span>;
            })()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pt-32 pb-12 transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">help you?</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Our team is here to assist you with any questions or concerns.
            Fill out the form below or reach out to our administrators directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form Section */}
          <div className="lg:col-span-8">
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 p-8 md:p-10 relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Send us a Message</h2>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-4 animate-fade-in-down">
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">Message Sent!</h4>
                    <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-1">We've received your inquiry and will get back to you shortly.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-4 animate-fade-in-down">
                  <div className="p-1 bg-red-100 dark:bg-red-900/40 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-700 dark:text-red-300 font-medium py-1">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      placeholder="Brief summary of your inquiry"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">To Whom To Contact</label>
                    <div className="relative">
                      <select
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer text-slate-900 dark:text-white"
                      >
                        <option value="" disabled>Select Recipient</option>
                        <optgroup label="Super Admins">
                          {superAdmins.map(admin => (
                            <option key={admin._id} value={admin._id}>{admin.name} (Super Admin)</option>
                          ))}
                        </optgroup>
                        <optgroup label="Department Admins">
                          {deptAdmins.map(admin => (
                            <option key={admin._id} value={admin._id}>{admin.name} ({admin.department})</option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                    placeholder="Please minimize detailed personal information..."
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 space-y-6">

            {/* Main Admin Card */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-800 p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Administration</h3>
              </div>

              {superAdmins.length > 0 ? (
                <div className="space-y-4">
                  {superAdmins.map(admin => (
                    <AdminCard
                      key={admin._id}
                      name={admin.name}
                      email={admin.email}
                      phone={admin.mobile}
                      location={admin.location}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 italic">
                  No public admin contacts available.
                </div>
              )}
            </div>

            {/* Department Heads Dropdown Card */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-800 p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Department Heads</h3>
              </div>

              {deptAdmins.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      onChange={handleDeptChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer text-slate-900 dark:text-white font-medium"
                      defaultValue=""
                    >
                      <option value="" disabled>Select Department</option>
                      {deptAdmins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                          {admin.department} - {admin.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {selectedDeptAdmin ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 mt-4 animate-fade-in-down">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                          {selectedDeptAdmin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{selectedDeptAdmin.name}</p>
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                            {selectedDeptAdmin.department}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pl-1">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{selectedDeptAdmin.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>{selectedDeptAdmin.mobile}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Select a department above to view contact details.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 italic">
                  No department heads listed.
                </div>
              )}
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900 rounded-2xl p-6 text-white shadow-lg transition-colors duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Office Hours</h4>
                    <p className="text-indigo-100 text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
                    <p className="text-indigo-100 text-sm">Sat: 10:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-800 shadow-lg transition-colors duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="w-5 h-5 text-orange-500" />
                  <h4 className="font-bold text-slate-800 dark:text-white">Support Tips</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0"></span>
                    <span>Please provide specific details in your message.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0"></span>
                    <span>Allow 24-48 hours for a response.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}