import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Newspaper } from 'lucide-react';
import { usePublicAuth } from '../../contexts/PublicAuthContext';

export default function PublicLoginPage() {
  const { signIn, signUp, session } = usePublicAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (session) {
    navigate(from, { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, displayName);

    if (result.error) {
      setErrorMsg(result.error);
      setStatus('error');
    } else {
      navigate(from, { replace: true });
    }
  }

  function switchMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setErrorMsg('');
    setStatus('idle');
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-slate-900 text-slate-400 text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/" className="flex items-center gap-1.5 hover:text-white transition-colors w-fit">
            <ArrowLeft size={12} /> Back to The Chronicle
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Newspaper size={28} className="text-red-700" />
              <span className="font-serif text-2xl font-bold text-slate-900">The Chronicle</span>
            </Link>
            <h1 className="font-serif text-2xl font-bold text-slate-900 mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-slate-500 text-sm">
              {mode === 'signin'
                ? 'Sign in to access saved articles and more.'
                : 'Join thousands of readers staying informed.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 text-sm font-semibold py-2 rounded-md transition-colors ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 text-sm font-semibold py-2 rounded-md transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Display Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    required
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm mt-2"
              >
                {status === 'loading'
                  ? 'Please wait…'
                  : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={switchMode} className="text-red-700 font-semibold hover:underline">
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
