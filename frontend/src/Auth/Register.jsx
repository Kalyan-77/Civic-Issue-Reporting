import { useState, useRef, useEffect } from 'react';
import {
  AlertCircle, Mail, Lock, Eye, EyeOff, Users, User,
  Phone, MapPin, CheckCircle, ArrowLeft, RefreshCw, ShieldCheck
} from 'lucide-react';
import { BASE_URL } from '../../config';

// ─── OTP Input Component ───────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputsRef = useRef([]);
  const digits = value.split('');

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        const next = [...digits];
        next[idx - 1] = '';
        onChange(next.join(''));
      }
    }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    if (!val) return;
    const next = [...digits];
    next[idx] = val;
    onChange(next.join(''));
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
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
              : 'border-gray-200 bg-white text-gray-800 focus:border-indigo-400 focus:bg-indigo-50/50'
            }`}
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer Hook ──────────────────────────────────────────────────
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);
  return remaining;
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function Register() {
  // Step: 'form' | 'otp' | 'success'
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    mobile: '', location: ''
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimerKey, setOtpTimerKey] = useState(0); // reset timer on resend
  const remaining = useCountdown(otpTimerKey === 0 ? 0 : 600);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ── Step 1: validate & request OTP ─────────────────────────────────────
  const handleSendOtp = async () => {
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
      return setError('All required fields must be filled');
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) return setError('Please enter a valid email address');
    if (!/^\d{10}$/.test(formData.mobile)) return setError('Mobile number must be exactly 10 digits');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          mobile: formData.mobile,
          location: formData.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Failed to send OTP');
      setOtp('');
      setOtpTimerKey((k) => k + 1);
      setStep('otp');
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP & create account ────────────────────────────────
  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length !== 6) return setError('Please enter the complete 6-digit OTP');

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Verification failed');
      setStep('success');
      setTimeout(() => { window.location.href = '/login'; }, 3000);
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, email: formData.email,
          password: formData.password, mobile: formData.mobile,
          location: formData.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Failed to resend OTP');
      setOtpTimerKey((k) => k + 1);
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timerDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="max-w-md w-full relative z-10">
        {/* ── Brand Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Civic Issue Reporter</h1>
          <p className="text-gray-500 text-sm">
            {step === 'form' && 'Create your account to get started'}
            {step === 'otp' && 'Verify your email address'}
            {step === 'success' && 'Account created successfully!'}
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-100/50 border border-white/60 overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
              style={{ width: step === 'form' ? '50%' : step === 'otp' ? '80%' : '100%' }}
            />
          </div>

          <div className="p-8">
            {/* ══════════ STEP 1 — REGISTRATION FORM ══════════ */}
            {step === 'form' && (
              <>
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Citizen Registration</h2>
                    <p className="text-xs text-gray-400">Step 1 of 2 — Fill your details</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                        placeholder="John Doe" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                        placeholder="you@example.com" />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                        maxLength="10"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                        placeholder="9876543210" />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" name="location" value={formData.location} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                        placeholder="City, State" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                        placeholder="Min. 6 characters" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
                        placeholder="Re-enter password" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button onClick={handleSendOtp} disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP…</>
                    ) : (
                      <><Mail className="w-4 h-4" /> Send Verification OTP</>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">Already have an account?{' '}
                      <button onClick={() => window.location.href = '/login'}
                        className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        Login here
                      </button>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ══════════ STEP 2 — OTP VERIFICATION ══════════ */}
            {step === 'otp' && (
              <>
                <button onClick={() => { setStep('form'); setError(''); }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back to form
                </button>

                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl mb-4">
                    <ShieldCheck className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    We sent a 6-digit verification code to<br />
                    <span className="font-semibold text-gray-800">{formData.email}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* OTP digit boxes */}
                <div className="mb-6">
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {/* Timer */}
                <div className="text-center mb-5">
                  {remaining > 0 ? (
                    <p className="text-sm text-gray-400">
                      OTP expires in{' '}
                      <span className={`font-mono font-bold ${remaining < 60 ? 'text-red-500' : 'text-indigo-600'}`}>
                        {timerDisplay}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">OTP has expired</p>
                  )}
                </div>

                {/* Verify button */}
                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6 || remaining === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4">
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Verify & Create Account</>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Didn't receive it?{' '}
                    <button
                      onClick={handleResendOtp}
                      disabled={loading || remaining > 540}  /* allow resend after 60s */
                      className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                    </button>
                  </p>
                  {remaining > 540 && (
                    <p className="text-xs text-gray-400 mt-1">You can resend after {remaining - 540}s</p>
                  )}
                </div>
              </>
            )}

            {/* ══════════ SUCCESS ══════════ */}
            {step === 'success' && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-5 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set! 🎉</h2>
                <p className="text-gray-500 text-sm mb-2">Your account has been created successfully.</p>
                <p className="text-gray-400 text-xs">Redirecting to login in 3 seconds…</p>
                <div className="mt-6">
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-[growWidth_3s_linear_forwards]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By registering, you agree to our Terms of Service and Privacy Policy
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