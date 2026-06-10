import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function PaywallGate({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="relative">
      <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-stone-50 pointer-events-none" />
      <div className="bg-stone-50 border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-amber-700" />
        </div>
        <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">
          {isLoggedIn ? 'Subscriber-only content' : 'This article is for subscribers'}
        </h3>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          {isLoggedIn
            ? 'Upgrade your account to read this premium article.'
            : 'Create a free account or subscribe to continue reading.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-red-700 hover:bg-red-800 text-white font-semibold px-6 py-2.5 rounded transition-colors text-sm">
            Subscribe — from $9.99/mo
          </button>
          {!isLoggedIn && (
            <Link to="/cms/login" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-6 py-2.5 rounded transition-colors text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
