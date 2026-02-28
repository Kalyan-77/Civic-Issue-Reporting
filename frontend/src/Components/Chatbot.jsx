import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../Context/ThemeContext';
import { BASE_URL } from '../../config';
import {
    X, Send, User, Phone, Mail,
    MapPin, RefreshCw, ChevronDown,
    HelpCircle, AlertCircle, CheckCircle2, Clock,
    Building2, Shield, Loader2, Sparkles, Info
} from 'lucide-react';

/* ─── Constants & Helpers ─────────────────────────────────────── */

const QUICK_ACTIONS = [
    { id: 'my_issues', label: '📋 My Issues Status', icon: '📋' },
    { id: 'contact_super', label: '🛡️ Super Admin Contact', icon: '🛡️' },
    { id: 'contact_dept', label: '🏢 Dept Admin Contact', icon: '🏢' },
    { id: 'faqs', label: '❓ FAQs', icon: '❓' },
    { id: 'track_issue', label: '🔍 Track Issue by ID', icon: '🔍' },
];

const STATUS_COLORS = {
    Pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock, border: 'border-yellow-300 dark:border-yellow-700' },
    'In Progress': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: AlertCircle, border: 'border-blue-300 dark:border-blue-700' },
    Resolved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle2, border: 'border-green-300 dark:border-green-700' },
};

const PRIORITY_STYLES = {
    high: 'bg-red-500 text-white',
    medium: 'bg-orange-500 text-white',
    low: 'bg-green-500 text-white',
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

/* ─── Intent Matching ─────────────────────────────────────────── */
function detectIntent(text) {
    const t = text.toLowerCase().trim();

    // Issue ID tracking intent (MongoDB ObjectId pattern or "#" prefix)
    const idMatch = t.match(/\b([0-9a-f]{24})\b/i);
    const hashMatch = t.match(/#([0-9a-f]{24})/i);
    if (idMatch) return { type: 'track_issue', id: idMatch[1] };
    if (hashMatch) return { type: 'track_issue', id: hashMatch[1] };

    // Issue status
    if (/\b(my issues?|status|track|progress|pending|resolved|all issues?|list|how are|my report)\b/.test(t))
        return { type: 'my_issues' };

    // Super Admin contact
    if (/\b(super admin|superadmin|main admin|chief|head|principal)\b/.test(t) && /\b(contact|phone|email|mobile|number|reach|call|address)\b/.test(t))
        return { type: 'contact_super' };

    // Dept admin contact
    if (/\b(dept|department|department admin|admin contact|contact admin|who handles|who is responsible|garbage|streetlight|pothole|water|leakage|reach admin)\b/.test(t) && /\b(contact|phone|email|mobile|number|reach|call|address)\b/.test(t))
        return { type: 'contact_dept' };

    // Any contact
    if (/\b(contact|phone|email|mobile|call|reach|address|who.*admin|admin.*info|send message)\b/.test(t))
        return { type: 'contact_all' };

    // FAQs
    if (/\b(faq|question|help|how to|how do|what is|what are|explain|guide|tutorial|tips|learn)\b/.test(t))
        return { type: 'faqs' };

    // Assigned admin
    if (/\b(assign|assigned|handling|responsible|who is working|will fix|will resolve|who fixed)\b/.test(t))
        return { type: 'assigned_admin' };

    // Greetings
    if (/\b(hi|hello|hey|good morning|good evening|sup|greetings|howdy)\b/.test(t))
        return { type: 'greeting' };

    // Thank you
    if (/\b(thanks|thank you|thank|thx|great|awesome|helpful|perfect|good)\b/.test(t))
        return { type: 'thanks' };

    return { type: 'unknown' };
}

/* ─── Message Components ──────────────────────────────────────── */

function BotMessage({ children, isDark }) {
    return (
        <div className="flex items-start gap-3 animate-in slide-in-from-left-2 duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnAu_DhNZJFGJ0DZMsDmFAv2BbyT7bk63GKA&s"
                    className="w-full h-full object-cover rounded-full"
                    alt="Bot"
                />
            </div>
            <div className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                {children}
            </div>
        </div>
    );
}

function UserMessage({ text, isDark }) {
    return (
        <div className="flex items-end gap-3 justify-end animate-in slide-in-from-right-2 duration-300">
            <div className={`max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md`}>
                <p className="text-sm leading-relaxed">{text}</p>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shadow">
                <User className="w-4 h-4 text-white" />
            </div>
        </div>
    );
}

function TypingIndicator({ isDark }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnAu_DhNZJFGJ0DZMsDmFAv2BbyT7bk63GKA&s"
                    className="w-full h-full object-cover rounded-full"
                    alt="Bot"
                />
            </div>
            <div className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex gap-1.5 items-center h-5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

/* ─── Status Badge ────────────────────────────────────────────── */
function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || STATUS_COLORS['Pending'];
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
}

/* ─── Issue Card ──────────────────────────────────────────────── */
function IssueCard({ issue, isDark }) {
    const statusStyle = STATUS_COLORS[issue.status] || STATUS_COLORS['Pending'];
    const StatusIcon = statusStyle.icon;

    return (
        <div className={`mt-2 rounded-xl border p-3 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{issue.title}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{issue.category}</p>
                </div>
                <StatusBadge status={issue.status} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${PRIORITY_STYLES[issue.priority?.toLowerCase()] || 'bg-gray-400 text-white'}`}>
                    {issue.priority} priority
                </span>
                {issue.isEscalated && (
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-500 text-white">Escalated</span>
                )}
            </div>
            {issue.assignedTo && (
                <div className={`mt-2 pt-2 border-t text-xs ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                    <span className="font-medium">Assigned to: </span>{issue.assignedTo.name}
                    {issue.assignedTo.department && <span className="ml-1 opacity-70">({issue.assignedTo.department})</span>}
                </div>
            )}
            <div className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Reported: {formatDate(issue.createdAt)}
                {issue.resolvedAt && <span className="ml-2">• Resolved: {formatDate(issue.resolvedAt)}</span>}
            </div>
        </div>
    );
}

/* ─── Admin Contact Card ──────────────────────────────────────── */
function AdminCard({ admin, type, isDark }) {
    const isSuper = type === 'super';
    return (
        <div className={`mt-2 rounded-xl border p-3 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSuper ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                    {isSuper
                        ? <Shield className={`w-5 h-5 ${isSuper ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        : <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{admin.name}</p>
                    <p className={`text-xs ${isSuper ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {isSuper ? 'Super Admin' : `Dept Admin${admin.department ? ` — ${admin.department}` : ''}`}
                    </p>
                </div>
            </div>
            <div className="space-y-1.5">
                {admin.email && (
                    <a href={`mailto:${admin.email}`} className={`flex items-center gap-2 text-xs group ${isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate group-hover:underline">{admin.email}</span>
                    </a>
                )}
                {admin.mobile && (
                    <a href={`tel:${admin.mobile}`} className={`flex items-center gap-2 text-xs group ${isDark ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} transition-colors`}>
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="group-hover:underline">{admin.mobile}</span>
                    </a>
                )}
                {admin.location?.area && (
                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{admin.location.area}{admin.location.state ? `, ${admin.location.state}` : ''}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── FAQ Item ────────────────────────────────────────────────── */
function FAQItem({ faq, isDark }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`mt-2 rounded-xl border overflow-hidden transition-all ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${isDark ? 'hover:bg-gray-700/50 text-white' : 'hover:bg-gray-50 text-gray-800'}`}
            >
                <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                    <span className="text-xs font-medium leading-snug">{faq.question}</span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className={`px-3 pb-3 pt-1 border-t text-xs leading-relaxed whitespace-pre-line ${isDark ? 'border-gray-700 text-gray-300 bg-gray-900/50' : 'border-gray-100 text-gray-600 bg-gray-50'}`}>
                    {faq.answer}
                </div>
            )}
        </div>
    );
}

/* ─── Main Chatbot Component ──────────────────────────────────── */
export default function Chatbot() {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [chatData, setChatData] = useState({ superAdmins: [], deptAdmins: [], faqs: [] });
    const [userIssues, setUserIssues] = useState([]);
    const [sessionUser, setSessionUser] = useState(null);
    const [trackingMode, setTrackingMode] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    // Fetch initial data once
    const fetchData = useCallback(async () => {
        if (hasFetched) return;
        setIsFetchingData(true);
        try {
            const [chatRes, sessionRes] = await Promise.all([
                fetch(`${BASE_URL}/chatbot/data`),
                fetch(`${BASE_URL}/auth/users/session`, { credentials: 'include' })
            ]);

            const chatJson = await chatRes.json();
            const sessionJson = await sessionRes.json();

            if (chatJson.success) setChatData(chatJson.data);
            if (sessionJson.loggedIn) {
                setSessionUser(sessionJson.user);
                // Fetch user issues
                const userId = sessionJson.user._id || sessionJson.user.id;
                const issuesRes = await fetch(`${BASE_URL}/issue/user/${userId}`, { credentials: 'include' });
                if (issuesRes.ok) {
                    const issuesJson = await issuesRes.json();
                    setUserIssues(Array.isArray(issuesJson) ? issuesJson : (issuesJson.issues || []));
                }
            }
        } catch (e) {
            console.error('Chatbot data fetch error:', e);
        } finally {
            setIsFetchingData(false);
            setHasFetched(true);
        }
    }, [hasFetched]);

    // Open chatbot
    const handleOpen = () => {
        setIsOpen(true);
        fetchData();
        if (!hasGreeted) {
            setTimeout(() => {
                addBotMessage('greeting_initial');
                setHasGreeted(true);
            }, 400);
        }
    };

    // Add bot message
    const addBotMessage = useCallback((type, payload = {}) => {
        setIsTyping(true);
        const delay = Math.random() * 500 + 600;
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + Math.random(), role: 'bot', type, payload, ts: new Date() }]);
        }, delay);
    }, []);

    // Handle quick action click
    const handleQuickAction = (actionId) => {
        const labels = {
            my_issues: '📋 Show my issues',
            contact_super: '🛡️ Super Admin Contact',
            contact_dept: '🏢 Dept Admin Contact',
            faqs: '❓ Show FAQs',
            track_issue: '🔍 Track Issue by ID',
            assigned_admin: '👤 Who is handling my issue?'
        };
        const label = labels[actionId] || actionId;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: label, ts: new Date() }]);
        processIntent({ type: actionId });
    };

    // Process intent and generate response
    const processIntent = useCallback((intent) => {
        switch (intent.type) {
            case 'greeting':
            case 'greeting_initial':
                addBotMessage('greeting', { name: sessionUser?.name });
                break;

            case 'thanks':
                addBotMessage('thanks');
                break;

            case 'my_issues':
                if (userIssues.length === 0) {
                    addBotMessage('no_issues');
                } else {
                    addBotMessage('my_issues', { issues: userIssues });
                }
                break;

            case 'contact_super':
                addBotMessage('contact_super', { admins: chatData.superAdmins });
                break;

            case 'contact_dept':
                addBotMessage('contact_dept', { admins: chatData.deptAdmins });
                break;

            case 'contact_all':
                addBotMessage('contact_all', { superAdmins: chatData.superAdmins, deptAdmins: chatData.deptAdmins });
                break;

            case 'faqs':
                addBotMessage('faqs', { faqs: chatData.faqs });
                break;

            case 'assigned_admin':
                if (userIssues.length === 0) {
                    addBotMessage('no_issues');
                } else {
                    addBotMessage('assigned_admin', { issues: userIssues.filter(i => i.assignedTo) });
                }
                break;

            case 'track_issue':
                if (intent.id) {
                    fetchIssueById(intent.id);
                } else {
                    setTrackingMode(true);
                    addBotMessage('ask_issue_id');
                }
                break;

            default:
                addBotMessage('unknown');
                break;
        }
    }, [addBotMessage, userIssues, chatData, sessionUser]);

    // Fetch issue by ID from backend
    const fetchIssueById = async (issueId) => {
        setIsTyping(true);
        try {
            const res = await fetch(`${BASE_URL}/chatbot/issue/${issueId}`);
            const data = await res.json();
            setIsTyping(false);
            if (data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now(), role: 'bot', type: 'issue_detail',
                    payload: { issue: data.issue }, ts: new Date()
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(), role: 'bot', type: 'issue_not_found',
                    payload: { id: issueId }, ts: new Date()
                }]);
            }
        } catch {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(), role: 'bot', type: 'error', payload: {}, ts: new Date()
            }]);
        }
    };

    // Handle user sending a message
    const handleSend = () => {
        const text = inputValue.trim();
        if (!text) return;

        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text, ts: new Date() }]);
        setInputValue('');

        // Tracking mode — expect issue ID input
        if (trackingMode) {
            setTrackingMode(false);
            const idMatch = text.match(/[0-9a-f]{24}/i);
            if (idMatch) {
                fetchIssueById(idMatch[0]);
            } else {
                addBotMessage('invalid_id');
            }
            return;
        }

        const intent = detectIntent(text);
        processIntent(intent);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* ─── Render Message ──────────────────────────────────────── */
    const renderMessage = (msg) => {
        if (msg.role === 'user') {
            return <UserMessage key={msg.id} text={msg.text} isDark={isDark} />;
        }

        const { type, payload } = msg;

        let content;

        switch (type) {
            case 'greeting':
            case 'greeting_initial':
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            👋 Hi{payload.name ? `, ${payload.name.split(' ')[0]}` : ''}! I'm CivBot 🤖
                        </p>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Your civic assistant — I can help you with issue tracking, admin contacts, and common questions.
                        </p>
                        <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quick Actions</p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_ACTIONS.map(a => (
                                <button key={a.id} onClick={() => handleQuickAction(a.id)}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 font-medium ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-blue-900/40 hover:border-blue-600 text-gray-200' : 'border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-gray-700'}`}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );
                break;

            case 'thanks':
                content = (
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            😊 You're welcome! Is there anything else I can help you with?
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {QUICK_ACTIONS.slice(0, 3).map(a => (
                                <button key={a.id} onClick={() => handleQuickAction(a.id)}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105 font-medium ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200' : 'border-gray-200 bg-gray-50 hover:bg-blue-50 text-gray-700'}`}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );
                break;

            case 'no_issues':
                content = (
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            📭 You haven't reported any issues yet. Head over to your dashboard to report your first one!
                        </p>
                    </div>
                );
                break;

            case 'my_issues':
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            📋 Your {payload.issues.length} Issue{payload.issues.length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
                            {payload.issues.map(issue => (
                                <IssueCard key={issue._id} issue={issue} isDark={isDark} />
                            ))}
                        </div>
                        {/* Summary stats */}
                        <div className={`mt-3 pt-3 border-t flex gap-3 flex-wrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            {['Pending', 'In Progress', 'Resolved'].map(s => {
                                const count = payload.issues.filter(i => i.status === s).length;
                                const style = STATUS_COLORS[s];
                                return count > 0 ? (
                                    <span key={s} className={`text-xs px-2 py-1 rounded-lg font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                                        {count} {s}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                );
                break;

            case 'contact_super':
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            🛡️ Super Admin Contact{payload.admins.length !== 1 ? 's' : ''}
                        </p>
                        {payload.admins.length === 0 ? (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No super admins found.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scroll">
                                {payload.admins.map(a => <AdminCard key={a._id} admin={a} type="super" isDark={isDark} />)}
                            </div>
                        )}
                    </div>
                );
                break;

            case 'contact_dept':
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            🏢 Department Admin Contact{payload.admins.length !== 1 ? 's' : ''}
                        </p>
                        {payload.admins.length === 0 ? (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No department admins found.</p>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
                                {payload.admins.map(a => <AdminCard key={a._id} admin={a} type="dept" isDark={isDark} />)}
                            </div>
                        )}
                    </div>
                );
                break;

            case 'contact_all':
                content = (
                    <div className="space-y-3">
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>🛡️ Super Admins</p>
                            {payload.superAdmins.length === 0 ? (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>None found.</p>
                            ) : payload.superAdmins.map(a => <AdminCard key={a._id} admin={a} type="super" isDark={isDark} />)}
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>🏢 Department Admins</p>
                            {payload.deptAdmins.length === 0 ? (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>None found.</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scroll">
                                    {payload.deptAdmins.map(a => <AdminCard key={a._id} admin={a} type="dept" isDark={isDark} />)}
                                </div>
                            )}
                        </div>
                    </div>
                );
                break;

            case 'faqs':
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            ❓ Frequently Asked Questions
                        </p>
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Click any question to expand the answer</p>
                        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scroll">
                            {payload.faqs.map(f => <FAQItem key={f.id} faq={f} isDark={isDark} />)}
                        </div>
                    </div>
                );
                break;

            case 'assigned_admin':
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            👤 Assigned Admins for Your Issues
                        </p>
                        {payload.issues.length === 0 ? (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                None of your issues have been assigned to an admin yet. They may still be pending review.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
                                {payload.issues.map(issue => (
                                    <div key={issue._id} className={`rounded-xl border p-3 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                                        <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{issue.title}</p>
                                        <StatusBadge status={issue.status} />
                                        {issue.assignedTo && (
                                            <AdminCard admin={issue.assignedTo} type="dept" isDark={isDark} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
                break;

            case 'ask_issue_id':
                content = (
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            🔍 Please enter the <strong>Issue ID</strong> you'd like to track.
                        </p>
                        <div className={`mt-2 p-2 rounded-lg text-xs flex items-start gap-2 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>You can find the Issue ID in the issue details page (it looks like a long alphanumeric code).</span>
                        </div>
                    </div>
                );
                break;

            case 'issue_detail':
                const issue = payload.issue;
                content = (
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔍 Issue Found</p>
                        <IssueCard issue={issue} isDark={isDark} />
                        {issue.description && (
                            <div className={`mt-2 p-2 rounded-lg text-xs ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                                <p className="font-semibold mb-1">Description:</p>
                                <p className="leading-relaxed line-clamp-3">{issue.description}</p>
                            </div>
                        )}
                        {issue.assignedTo && (
                            <div className="mt-2">
                                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assigned Admin:</p>
                                <AdminCard admin={issue.assignedTo} type="dept" isDark={isDark} />
                            </div>
                        )}
                    </div>
                );
                break;

            case 'issue_not_found':
                content = (
                    <div>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            ❌ No issue found with ID <code className={`px-1 py-0.5 rounded text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{payload.id}</code>.
                        </p>
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Please double-check the ID and try again, or use "My Issues" to see all your reported issues.
                        </p>
                    </div>
                );
                break;

            case 'invalid_id':
                content = (
                    <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        ⚠️ That doesn't look like a valid Issue ID. Issue IDs are 24-character alphanumeric codes. Please try again or check your issue details page.
                    </p>
                );
                break;

            case 'error':
                content = (
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        ⚠️ Something went wrong. Please try again in a moment.
                    </p>
                );
                break;

            case 'unknown':
            default:
                content = (
                    <div>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            🤔 I'm not sure I understand. Here's what I can help you with:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_ACTIONS.map(a => (
                                <button key={a.id} onClick={() => handleQuickAction(a.id)}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105 font-medium ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200' : 'border-gray-200 bg-gray-50 hover:bg-blue-50 text-gray-700'}`}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );
                break;
        }

        return (
            <BotMessage key={msg.id} isDark={isDark}>
                {content}
            </BotMessage>
        );
    };

    /* ─── Render Chat Widget ──────────────────────────────────── */
    return (
        <>
            {/* Floating Chatbot Button */}
            <div className="fixed bottom-6 right-6 z-[9999]">
                {!isOpen && (
                    <div className="relative group">
                        {/* Pulse rings */}
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
                        <button
                            id="chatbot-open-btn"
                            onClick={handleOpen}
                            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                            aria-label="Open CivBot chatbot"
                        >
                            {/* Custom Robot with Headset + Speech Bubble Icon */}
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnAu_DhNZJFGJ0DZMsDmFAv2BbyT7bk63GKA&s"
                                className="w-10 h-10 object-cover rounded-full border-2 border-white/50 shadow-inner"
                                alt="CivBot"
                            />
                        </button>
                        {/* Tooltip — only visible on hover via CSS group */}
                        <div className={`absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 ${isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'}`}>
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-blue-500" />
                                CivBot — Ask me anything!
                            </span>
                        </div>
                    </div>
                )}

                {/* Chat Window */}
                {isOpen && (
                    <div
                        id="chatbot-window"
                        className={`w-[320px] max-w-[calc(100vw-48px)] rounded-3xl shadow-2xl overflow-hidden flex flex-col border transition-all animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 ${isDark
                            ? 'bg-gray-900 border-gray-700 shadow-black/50'
                            : 'bg-white border-gray-200 shadow-gray-200/80'
                            }`}
                        style={{ height: '600px', maxHeight: 'calc(100vh - 80px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                                    {/* Header robot icon */}
                                    <img
                                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnAu_DhNZJFGJ0DZMsDmFAv2BbyT7bk63GKA&s"
                                        className="w-full h-full object-cover rounded-xl"
                                        alt="CivBot"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-base leading-tight">CivBot</h3>
                                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <p className="text-blue-100 text-xs">Online • Civic Assistant</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setMessages([]);
                                        setHasGreeted(false);
                                        setTrackingMode(false);
                                        setTimeout(() => { addBotMessage('greeting', { name: sessionUser?.name }); setHasGreeted(true); }, 300);
                                    }}
                                    title="Restart chat"
                                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    id="chatbot-close-btn"
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Loading overlay */}
                        {isFetchingData && (
                            <div className={`flex items-center justify-center gap-3 py-4 text-sm border-b ${isDark ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                <span>Loading your data...</span>
                            </div>
                        )}

                        {/* Messages */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scroll ${isDark ? 'bg-gray-900' : 'bg-gray-50/50'}`}>
                            {messages.length === 0 && !isFetchingData && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                                        <img
                                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnAu_DhNZJFGJ0DZMsDmFAv2BbyT7bk63GKA&s"
                                            className="w-14 h-14 object-cover rounded-2xl shadow-lg border-2 border-white/20"
                                            alt="CivBot"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to CivBot!</h4>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Your civic issue assistant. How can I help you today?
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {QUICK_ACTIONS.map(a => (
                                            <button key={a.id} onClick={() => handleQuickAction(a.id)}
                                                className={`text-xs px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 font-medium ${isDark ? 'border-gray-700 bg-gray-800 hover:bg-blue-900/40 hover:border-blue-600 text-gray-300' : 'border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 shadow-sm'}`}>
                                                {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map(msg => renderMessage(msg))}

                            {isTyping && <TypingIndicator isDark={isDark} />}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className={`flex-shrink-0 px-4 py-3 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                            {/* Quick chips for empty state */}
                            {messages.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scroll-x">
                                    {QUICK_ACTIONS.slice(0, 4).map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => handleQuickAction(a.id)}
                                            className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105 font-medium ${isDark
                                                ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                                                : 'border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-600'
                                                }`}
                                        >
                                            {a.icon} {a.label.replace(/[📋🛡️🏢❓🔍]\s/g, '')}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <input
                                    id="chatbot-input"
                                    ref={inputRef}
                                    type="text"
                                    placeholder={trackingMode ? "Enter issue ID (24 chars)..." : "Ask me anything..."}
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`flex-1 px-4 py-3 rounded-2xl text-sm outline-none border transition-all ${isDark
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                        : 'bg-gray-100 border-transparent text-gray-900 placeholder-gray-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 focus:bg-white'
                                        }`}
                                />
                                <button
                                    id="chatbot-send-btn"
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-110 hover:shadow-blue-500/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className={`text-center text-[10px] mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                Powered by CivBot AI • Civic Issue System
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom scrollbar styles */}
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #6b7280; border-radius: 2px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #4b5563; }
                .custom-scroll-x::-webkit-scrollbar { height: 2px; }
                .custom-scroll-x::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll-x::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
            `}</style>
        </>
    );
}
