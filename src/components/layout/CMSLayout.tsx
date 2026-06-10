import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, FolderOpen, Users, LogOut,
  ChevronLeft, ChevronRight, Menu, X, BarChart2, Image, Home,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/cms' },
  { label: 'Articles', icon: FileText, href: '/cms/articles' },
  { label: 'Homepage', icon: Home, href: '/cms/homepage' },
  { label: 'Media', icon: Image, href: '/cms/media' },
  { label: 'Categories', icon: FolderOpen, href: '/cms/categories' },
  { label: 'Authors', icon: Users, href: '/cms/authors' },
  { label: 'Analytics', icon: BarChart2, href: '/cms/analytics' },
];

export default function CMSLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/cms/login');
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-4 border-b border-slate-700`}>
        {!collapsed && (
          <Link to="/" className="font-serif text-lg font-bold text-white truncate">The Chronicle</Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block text-slate-400 hover:text-white transition-colors flex-shrink-0">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.href ||
            (item.href !== '/cms' && location.pathname.startsWith(item.href));
          return (
            <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-all text-sm font-medium
                ${active ? 'bg-red-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-slate-700 p-4 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{profile?.display_name || user?.email}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace(/_/g, ' ') || 'Staff'}</p>
          </div>
        )}
        <button onClick={handleSignOut}
          className={`flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm ${collapsed ? 'justify-center w-full' : ''}`}>
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className={`hidden lg:flex flex-col bg-slate-900 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 flex flex-col h-full z-50">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 text-white">
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-serif font-bold">The Chronicle CMS</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
