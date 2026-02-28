import { useState, useRef, useEffect } from 'react';
import {
    AlertCircle, Mail, Lock, Eye, EyeOff,
    ArrowLeft, RefreshCw, ShieldCheck, CheckCircle, KeyRound
} from 'lucide-react';
import { BASE_URL } from '../../config';

// OTP Input 
function OtpInput({ value, onChange }) {
    const inputsRef = useRef([]);
    const digits = value.split('');

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace') {
            if (digits[idx]) {
                const next = [...digits]; next[idx] = ''; onChange(next.join(''));
            } else if (idx > 0) {
                inputsRef.current[idx - 1]?.focus();
                const next = [...digits]; next[idx - 1] = ''; onChange(next.join(''));
            }
        }
    };

    const handleChange = (e, idx) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        if (!val) return;
        const next = [...digits]; next[idx] = val; onChange(next.join(''));
        if (idx < 5) inputsRef.current[idx + 1]?.focus();
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            onChange(pasted.padEnd(6, '').slice(0, 6));
            inputsRef.current[Math.min(pasted.length, 5)]?.focus();
        }
        e.preventDefault();
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, idx) => (
                <input
                    key={idx}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[idx] || ''}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all duration-200
            ${digits[idx]
                            ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md shadow-rose-100'
                            : 'border-gray-200 bg-white text-gray-800 focus:border-rose-400 focus:bg-rose-50/50'
                        }`}
                />
            ))}
        </div>
    );
}

// ─── Countdown
function useCountdown(start) {
    const [remaining, setRemaining] = useState(start);
    useEffect(() => {
        setRemaining(start);
        if (start === 0) return;
        const id = setInterval(() => setRemaining(p => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000);
        return () => clearInterval(id);
    }, [start]);
    return remaining;
}

// ─── Password Strength 
function PasswordStrength({ password }) {
    const checks = [
        { label: 'At least 6 characters', ok: password.length >= 6 },
        { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
        { label: 'Number', ok: /\d/.test(password) },
        { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = checks.filter(c => c.ok).length;
    const colours = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    if (!password) return null;
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= score ? colours[score] : 'bg-gray-200'}`} />
                ))}
            </div>
            <p className={`text-xs font-medium ${score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                {labels[score]}
            </p>
            <ul className="space-y-0.5">
                {checks.map(c => (
                    <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
                        <span>{c.ok ? '✓' : '○'}</span> {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Main Component 
export default function ForgotPassword() {
    // step: 'email' | 'otp' | 'password' | 'success'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timerStart, setTimerStart] = useState(0);
    const remaining = useCountdown(timerStart);

    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timerDisplay = `${minutes}:${String(secs).padStart(2, '0')}`;

    // ── Step 1: request OTP
    const handleSendOtp = async () => {
        setError('');
        if (!email.trim()) return setError('Please enter your email address');
        if (!/\S+@\S+\.\S+/.test(email)) return setError('Please enter a valid email address');

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.message || 'Failed to send OTP');
            setOtp('');
            setTimerStart(600);
            setStep('otp');
        } catch { setError('Unable to connect to server. Please try again.'); }
        finally { setLoading(false); }
    };

    // ── Resend OTP
    const handleResend = async () => {
        setError(''); setOtp(''); setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.message || 'Failed to resend OTP');
            setTimerStart(p => p === 600 ? 599 : 600); // force reset
        } catch { setError('Unable to connect to server.'); }
        finally { setLoading(false); }
    };

    // ── Step 2: verify OTP 
    const handleVerifyOtp = async () => {
        setError('');
        if (otp.length !== 6) return setError('Please enter the complete 6-digit OTP');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/users/verify-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.message || 'Verification failed');
            setResetToken(data.resetToken);
            setStep('password');
        } catch { setError('Unable to connect to server. Please try again.'); }
        finally { setLoading(false); }
    };

    // ── Step 3: set new password 
    const handleResetPassword = async () => {
        setError('');
        if (newPassword.length < 6) return setError('Password must be at least 6 characters');
        if (newPassword !== confirmPassword) return setError('Passwords do not match');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), resetToken, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.message || 'Reset failed');
            setStep('success');
            setTimeout(() => { window.location.href = '/login'; }, 3000);
        } catch { setError('Unable to connect to server. Please try again.'); }
        finally { setLoading(false); }
    };

    const stepProgress = { email: '33%', otp: '66%', password: '90%', success: '100%' };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center p-4 py-12 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            <div className="max-w-md w-full relative z-10">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl mb-4 shadow-lg shadow-rose-200">
                        <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Forgot Password</h1>
                    <p className="text-gray-500 text-sm">
                        {step === 'email' && "Enter your email and we'll send you an OTP"}
                        {step === 'otp' && 'Enter the OTP sent to your email'}
                        {step === 'password' && 'Choose a new strong password'}
                        {step === 'success' && 'Password reset successfully!'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-100/50 border border-white/60 overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                        <div className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-700"
                            style={{ width: stepProgress[step] }} />
                    </div>

                    <div className="p-8">

                        {/* ══ ERROR ══ */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/*  STEP 1: EMAIL  */}
                        {step === 'email' && (
                            <>
                                <div className="flex items-center gap-3 mb-7">
                                    <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Verify your identity</h2>
                                        <p className="text-xs text-gray-400">Step 1 of 3 — Send OTP</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email" value={email}
                                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                                                placeholder="you@example.com"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button onClick={handleSendOtp} disabled={loading}
                                        className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-rose-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {loading
                                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP…</>
                                            : <><Mail className="w-4 h-4" /> Send OTP to Email</>}
                                    </button>

                                    <div className="text-center pt-1">
                                        <button onClick={() => window.location.href = '/login'}
                                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mx-auto group">
                                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                            Back to Login
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ══════════ STEP 2: OTP ══════════ */}
                        {step === 'otp' && (
                            <>
                                <button onClick={() => { setStep('email'); setError(''); }}
                                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors group">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Change email
                                </button>

                                <div className="text-center mb-7">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-100 rounded-2xl mb-4">
                                        <ShieldCheck className="w-7 h-7 text-rose-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        We sent a 6-digit code to<br />
                                        <span className="font-semibold text-gray-800">{email}</span>
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <OtpInput value={otp} onChange={setOtp} />
                                </div>

                                {/* Timer */}
                                <div className="text-center mb-5">
                                    {remaining > 0
                                        ? <p className="text-sm text-gray-400">
                                            Code expires in{' '}
                                            <span className={`font-mono font-bold ${remaining < 60 ? 'text-red-500' : 'text-rose-600'}`}>
                                                {timerDisplay}
                                            </span>
                                        </p>
                                        : <p className="text-sm text-red-500 font-medium">Code has expired</p>}
                                </div>

                                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6 || remaining === 0}
                                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-rose-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4">
                                    {loading
                                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
                                        : <><ShieldCheck className="w-4 h-4" /> Verify OTP</>}
                                </button>

                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Didn't receive it?{' '}
                                        <button onClick={handleResend} disabled={loading || remaining > 540}
                                            className="font-semibold text-rose-600 hover:text-rose-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1">
                                            <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                                        </button>
                                    </p>
                                    {remaining > 540 && (
                                        <p className="text-xs text-gray-400 mt-1">Resend available in {remaining - 540}s</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ══════════ STEP 3: NEW PASSWORD ══════════ */}
                        {step === 'password' && (
                            <>
                                <div className="flex items-center gap-3 mb-7">
                                    <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Set new password</h2>
                                        <p className="text-xs text-gray-400">Step 3 of 3 — Choose a strong password</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* New password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            New Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showNew ? 'text' : 'password'} value={newPassword}
                                                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                                                placeholder="Min. 6 characters"
                                            />
                                            <button type="button" onClick={() => setShowNew(!showNew)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <PasswordStrength password={newPassword} />
                                    </div>

                                    {/* Confirm password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Confirm Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                                                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                                                placeholder="Re-enter new password"
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                                        )}
                                        {confirmPassword && newPassword === confirmPassword && (
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Passwords match
                                            </p>
                                        )}
                                    </div>

                                    <button onClick={handleResetPassword}
                                        disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                                        className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-rose-200 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                                        {loading
                                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting…</>
                                            : <><KeyRound className="w-4 h-4" /> Reset Password</>}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ══════════ SUCCESS ══════════ */}
                        {step === 'success' && (
                            <div className="text-center py-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-5 animate-bounce">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset! 🎉</h2>
                                <p className="text-gray-500 text-sm mb-1">Your password has been updated successfully.</p>
                                <p className="text-gray-400 text-xs">Redirecting to login in 3 seconds…</p>
                                <div className="mt-6">
                                    <div className="w-full bg-gray-100 rounded-full h-1">
                                        <div className="h-1 bg-gradient-to-r from-rose-500 to-orange-400 rounded-full"
                                            style={{ animation: 'growWidth 3s linear forwards' }} />
                                    </div>
                                </div>
                                <button onClick={() => window.location.href = '/login'}
                                    className="mt-5 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors">
                                    Go to Login now →
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Remember your password?{' '}
                    <button onClick={() => window.location.href = '/login'}
                        className="font-semibold text-rose-600 hover:text-rose-700 transition-colors">
                        Login here
                    </button>
                </p>
            </div>

            <style>{`
        @keyframes growWidth {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
        </div>
    );
}
