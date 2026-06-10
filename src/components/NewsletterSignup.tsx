import { useEffect, useState } from 'react';
import { Mail, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

interface Props {
  variant?: 'inline' | 'banner';
  title?: string;
  description?: string;
}

export default function NewsletterSignup({
  variant = 'banner',
  title = 'Stay informed. Subscribe to our newsletter.',
  description = 'Get the most important stories delivered to your inbox every morning.',
}: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [showPrefs, setShowPrefs] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (variant === 'banner') {
      supabase.from('categories').select('*').order('sort_order').limit(8).then(({ data }) => {
        if (data) setCategories(data);
      });
    }
  }, [variant]);

  function toggleCat(id: string) {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    const preferences = {
      categories: selectedCats.size > 0 ? [...selectedCats] : undefined,
      frequency,
    };
    const { error } = await supabase.from('newsletter_subscriptions').insert({
      email: email.trim(),
      name: name.trim() || null,
      preferences,
    });
    if (error) {
      setErrorMsg(error.code === '23505' ? 'You\'re already subscribed!' : 'Something went wrong. Please try again.');
      setStatus('error');
    } else {
      setStatus('success');
    }
  }

  if (status === 'success') {
    return (
      <div className={`${variant === 'banner' ? 'bg-slate-900 text-white py-10' : 'bg-amber-50 border border-amber-200 rounded-lg p-5'} text-center`}>
        <CheckCircle className={`mx-auto mb-2 ${variant === 'banner' ? 'text-green-400' : 'text-green-500'}`} size={28} />
        <p className={`font-semibold ${variant === 'banner' ? 'text-white' : 'text-slate-800'}`}>You're subscribed!</p>
        <p className={`text-sm mt-1 ${variant === 'banner' ? 'text-slate-300' : 'text-slate-500'}`}>Check your inbox for a confirmation.</p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-amber-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Newsletter</h3>
        </div>
        <p className="text-sm text-slate-600 mb-3">{description}</p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {status === 'error' && (
            <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-slate-900 text-white text-sm font-semibold py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white py-14">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <Mail size={32} className="mx-auto mb-4 text-red-400" />
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">{title}</h2>
        <p className="text-slate-300 text-sm md:text-base mb-6">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-3 max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 px-4 py-2.5 rounded text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="flex-1 px-4 py-2.5 rounded text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Preferences toggle */}
          <button
            type="button"
            onClick={() => setShowPrefs(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mx-auto"
          >
            <ChevronDown size={13} className={`transition-transform ${showPrefs ? 'rotate-180' : ''}`} />
            Customize preferences
          </button>

          {showPrefs && (
            <div className="bg-slate-800 rounded-xl p-4 text-left space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Frequency</p>
                <div className="flex gap-2">
                  {(['daily', 'weekly'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors capitalize ${frequency === f ? 'bg-red-700 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {categories.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Topics of interest</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCat(cat.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${selectedCats.has(cat.id) ? 'text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        style={selectedCats.has(cat.id) ? { backgroundColor: cat.color } : undefined}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <p className="text-red-400 text-sm flex items-center justify-center gap-1">
              <AlertCircle size={14} />{errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-50 text-sm"
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe to newsletter'}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-3">No spam. Unsubscribe any time.</p>
      </div>
    </div>
  );
}
