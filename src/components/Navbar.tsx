import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronDown, User, Bookmark, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePublicAuth } from '../contexts/PublicAuthContext';
import { Category } from '../types';

const SITE_NAME = 'The Chronicle';

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { session, profile, savedIds, signOut } = usePublicAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  }

  const primaryNav = categories.slice(0, 6);

  return (
    <>
      <div className="bg-slate-900 text-slate-400 text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span className="font-medium text-slate-300">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <div className="flex items-center gap-4">
            <Link to="/cms" className="hover:text-white transition-colors">CMS Login</Link>
            <span className="text-slate-600">|</span>
            {session ? (
              <Link to="/account" className="hover:text-white transition-colors">My Account</Link>
            ) : (
              <Link to="/account/login" className="hover:text-white transition-colors">Subscribe</Link>
            )}
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <button className="md:hidden p-1" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" className="flex-1 md:flex-none text-center md:text-left">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{SITE_NAME}</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search articles…"
                    className="border border-slate-300 rounded px-3 py-1.5 text-sm w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="ml-2 text-slate-500 hover:text-slate-900">
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-1.5 hover:text-red-700 transition-colors text-slate-600">
                  <Search size={20} />
                </button>
              )}

              {session ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-700 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:border-red-300"
                  >
                    <User size={15} />
                    <span className="max-w-[100px] truncate">{profile?.display_name || 'Account'}</span>
                    {savedIds.size > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
                        {savedIds.size}
                      </span>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 w-52 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{profile?.display_name || 'Reader'}</p>
                        <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                      </div>
                      <Link to="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors">
                        <Bookmark size={15} />
                        Saved Articles
                        {savedIds.size > 0 && <span className="ml-auto text-xs font-bold text-red-600">{savedIds.size}</span>}
                      </Link>
                      <Link to="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors">
                        <User size={15} />
                        Profile Settings
                      </Link>
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-red-700 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/account/login" className="hidden md:flex items-center gap-1 text-sm text-slate-600 hover:text-red-700 transition-colors border border-slate-200 px-3 py-1.5 rounded hover:border-red-300">
                    Sign in
                  </Link>
                  <Link to="/account/login" className="bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-800 transition-colors hidden md:block">
                    Subscribe
                  </Link>
                </>
              )}

              <Link to="/cms" className="hidden md:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5">
                CMS
              </Link>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0 py-0">
            {primaryNav.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="text-sm font-medium text-slate-700 hover:text-red-700 px-3 py-2.5 transition-colors border-b-2 border-transparent hover:border-red-700"
              >
                {cat.name}
              </Link>
            ))}
            {categories.length > 6 && (
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-red-700 px-3 py-2.5">
                  More <ChevronDown size={14} />
                </button>
                <div className="absolute left-0 top-full bg-white shadow-lg border border-slate-100 rounded min-w-40 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {categories.slice(6).map(cat => (
                    <Link key={cat.id} to={`/category/${cat.slug}`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:text-red-700 hover:bg-slate-50">{cat.name}</Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <nav className="max-w-7xl mx-auto px-4 py-2">
              {categories.map(cat => (
                <Link key={cat.id} to={`/category/${cat.slug}`}
                  className="block py-2.5 text-sm font-medium text-slate-700 border-b border-slate-100">{cat.name}</Link>
              ))}
              <div className="border-t border-slate-100 pt-2 mt-1 space-y-0.5">
                {session ? (
                  <>
                    <Link to="/account" className="block py-2.5 text-sm font-medium text-slate-700">
                      My Account {savedIds.size > 0 && `(${savedIds.size} saved)`}
                    </Link>
                    <button onClick={handleSignOut} className="block py-2.5 text-sm font-medium text-slate-500 w-full text-left">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/account/login" className="block py-2.5 text-sm font-medium text-red-700">Sign in / Subscribe</Link>
                )}
                <Link to="/cms" className="block py-2.5 text-sm font-medium text-slate-400">CMS Dashboard</Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
