import React, { useState, useEffect } from 'react';
import {
    Mail,
    Search,
    Clock,
    User,
    MessageSquare,
    ChevronRight,
    Inbox,
    Shield,
    X,
    Calendar,
    Hash,
    CheckCircle,
    MoreHorizontal,
    Reply,
    Flag
} from 'lucide-react';
import { BASE_URL } from '../../../config';
import { useTheme } from '../../Context/ThemeContext';

export default function SuperCitizenMessages() {
    const { isDark } = useTheme();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        fetchMessages();

        const interval = setInterval(() => {
            fetchMessages(true);
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const res = await fetch(`${BASE_URL}/contact`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setMessages(data.contacts);
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        const updatedMessages = messages.map(msg => ({ ...msg, status: 'read' }));
        setMessages(updatedMessages);

        try {
            await fetch(`${BASE_URL}/contact/read-all`, {
                method: 'PUT',
                credentials: 'include'
            });
            fetchMessages(true);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const markAsRead = async (id) => {
        const updatedMessages = messages.map(msg =>
            msg._id === id ? { ...msg, status: 'read' } : msg
        );
        setMessages(updatedMessages);

        try {
            await fetch(`${BASE_URL}/contact/${id}/read`, {
                method: 'PUT',
                credentials: 'include'
            });
            fetchMessages(true);
        } catch (err) {
            console.error("Failed to mark message as read", err);
        }
    };

    const toggleFlag = async (id) => {
        const currentMsg = messages.find(m => m._id === id);
        if (!currentMsg) return;

        const newStatus = currentMsg.status === 'archived' ? 'read' : 'archived';

        // Optimistic UI update
        const updatedMessages = messages.map(msg =>
            msg._id === id ? { ...msg, status: newStatus } : msg
        );
        setMessages(updatedMessages);

        try {
            const res = await fetch(`${BASE_URL}/contact/${id}/archive`, {
                method: 'PUT',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            fetchMessages(true);
        } catch (err) {
            console.error("Failed to toggle flag", err);
            fetchMessages(true); // Revert on failure
        }
    };

    const getFilteredMessages = () => {
        let filtered = messages;

        // Apply Tab Filtering
        if (activeTab === 'Unread') {
            filtered = messages.filter(msg => msg.status === 'new');
        } else if (activeTab === 'Read') {
            filtered = messages.filter(msg => msg.status === 'read');
        } else if (activeTab === 'Flagged') {
            filtered = messages.filter(msg => msg.status === 'archived');
        }

        // Apply Search Filtering
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(msg =>
                msg.name.toLowerCase().includes(term) ||
                msg.subject.toLowerCase().includes(term) ||
                msg.message.toLowerCase().includes(term)
            );
        }

        return filtered;
    };

    const filteredMessages = getFilteredMessages();
    const stats = {
        all: messages.length,
        unread: messages.filter(m => m.status === 'new').length,
        read: messages.filter(m => m.status === 'read').length,
        flagged: messages.filter(m => m.status === 'archived').length
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRandomColor = (name) => {
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-indigo-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffInMs = now - msgDate;
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            if (hours === 0) return 'Just now';
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const openModal = (msg) => {
        setSelectedMessage(msg);
        if (msg.status === 'new') {
            markAsRead(msg._id);
        }
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedMessage(null);
        document.body.style.overflow = 'unset';
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-[#F8FAFC] text-slate-900'} p-6 transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Mail className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className={`text-3xl font-extrabold tracking-tight`}>
                                All Messages
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                Review inquiries directed to Super Admin
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className={`p-2 rounded-xl border ${isDark ? 'border-gray-800 hover:bg-gray-900 text-gray-400' : 'border-slate-200 hover:bg-white text-slate-400'}`}>
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className={`rounded-3xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} shadow-sm overflow-hidden`}>

                    {/* Tabs & Action Button */}
                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                            {[
                                { label: 'All', count: stats.all },
                                { label: 'Unread', count: stats.unread },
                                { label: 'Read', count: stats.read },
                                { label: 'Flagged', count: stats.flagged }
                            ].map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => setActiveTab(tab.label)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.label
                                        ? (isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600')
                                        : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.label
                                            ? (isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700')
                                            : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500')
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={markAllAsRead}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isDark
                                ? 'bg-rose-600/10 text-rose-500 hover:bg-rose-600/20'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark All as Read
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className={`px-6 py-4 border-b ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-slate-50/50 border-gray-100'}`}>
                        <div className={`relative flex items-center group ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700 focus-within:border-indigo-500' : 'border-slate-200 focus-within:border-indigo-500'} transition-all`}>
                            <Search className={`absolute left-4 w-5 h-5 ${isDark ? 'text-gray-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                            <input
                                type="text"
                                placeholder="Search messages by name, email, or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-sm font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Messages Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4">Sender</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Preview</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Received</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-slate-100'}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <p className="text-sm font-medium animate-pulse">Scanning inbox...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMessages.length > 0 ? (
                                    filteredMessages.map((msg) => (
                                        <tr
                                            key={msg._id}
                                            onClick={() => openModal(msg)}
                                            className={`group transition-all duration-200 cursor-pointer ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'
                                                } ${msg.status === 'new' ? (isDark ? 'bg-indigo-500/5' : 'bg-indigo-50/30') : ''}`}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${getRandomColor(msg.name)}`}>
                                                        {getInitials(msg.name)}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{msg.name}</p>
                                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{msg.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-slate-800'} line-clamp-1`}>{msg.subject}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'} line-clamp-1 max-w-[200px]`}>{msg.message}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${msg.status === 'new'
                                                    ? (isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-100 text-amber-700')
                                                    : (isDark ? 'bg-emerald-400/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                                                    }`}>
                                                    {msg.status === 'new' ? 'Unread' : 'Read'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <a
                                                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                                                        className={`p-2 rounded-lg ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/40' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'} transition-all`}
                                                        title="Reply"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Reply className="w-4 h-4" />
                                                    </a>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFlag(msg._id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-all ${msg.status === 'archived'
                                                            ? (isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600')
                                                            : (isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100')
                                                            }`}
                                                        title={msg.status === 'archived' ? "Unflag" : "Flag message"}
                                                    >
                                                        <Flag className={`w-4 h-4 ${msg.status === 'archived' ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <div className={`p-2 rounded-lg ${isDark ? 'text-gray-400 border border-gray-700 hover:text-white' : 'text-slate-400 border border-slate-200 hover:text-slate-900'}`}>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isDark ? 'bg-gray-800 text-gray-700' : 'bg-slate-50 text-slate-200'}`}>
                                                    <Inbox className="w-10 h-10" />
                                                </div>
                                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No messages found</h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                    {searchTerm ? `No results for "${searchTerm}" in ${activeTab} messages.` : `Your ${activeTab.toLowerCase()} inbox is empty.`}
                                                </p>
                                                {searchTerm && (
                                                    <button onClick={() => setSearchTerm('')} className="mt-6 text-sm font-bold text-indigo-500 hover:underline">Clear search filters</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-slate-100'}`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-slate-50 bg-slate-50/50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg ${getRandomColor(selectedMessage.name)}`}>
                                    {getInitials(selectedMessage.name)}
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Citizen Inquiry</h4>
                                    <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate max-w-[200px] sm:max-w-md`}>
                                        {selectedMessage.subject}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900'} border ${isDark ? 'border-gray-700' : 'border-slate-200'}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50' : 'bg-blue-50/30 border-blue-100/50'}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <User className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Citizen Info</span>
                                    </div>
                                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMessage.name}</p>
                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{selectedMessage.email}</p>
                                </div>

                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50' : 'bg-amber-50/30 border-amber-100/50'}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Received At</span>
                                    </div>
                                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {new Date(selectedMessage.createdAt).toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedMessage.status === 'new'
                                            ? 'bg-amber-500/10 text-amber-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {selectedMessage.status === 'new' ? 'New' : 'Reviewed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Message</span>
                                </div>
                                <div className={`p-6 rounded-2xl border leading-relaxed ${isDark ? 'bg-gray-950/50 border-gray-800 text-gray-300' : 'bg-slate-50/50 border-slate-100 text-slate-700'}`}>
                                    <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                                </div>
                            </div>

                            <div className={`mt-8 p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-indigo-500/5 border border-indigo-500/10' : 'bg-indigo-50/50 border border-indigo-100/50'}`}>
                                <Hash className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Internal ID</p>
                                    <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{selectedMessage._id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`p-6 border-t ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-slate-100 bg-slate-50/30'} flex items-center justify-end gap-3`}>
                            <button
                                onClick={closeModal}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => toggleFlag(selectedMessage._id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedMessage.status === 'archived'
                                    ? (isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600')
                                    : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')
                                    }`}
                            >
                                <Flag className={`w-4 h-4 ${selectedMessage.status === 'archived' ? 'fill-current' : ''}`} />
                                {selectedMessage.status === 'archived' ? 'Unflag' : 'Flag Inquiry'}
                            </button>
                            <a
                                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                    }`}
                            >
                                <Reply className="w-4 h-4" />
                                Respond
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
