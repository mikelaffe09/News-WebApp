import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Newspaper } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password, displayName);
    if (result.error) { setError(result.error); setLoading(false); }
    else navigate('/cms');
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
            <Newspaper size={28} className="text-red-700" />The Chronicle
          </Link>
          <p className="text-slate-500 text-sm mt-2">Content Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Display name</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="editor@example.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 mt-2">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in to CMS' : 'Create CMS account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            <Link to="/" className="text-red-700 hover:underline">← Return to The Chronicle</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
