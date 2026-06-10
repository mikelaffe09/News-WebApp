import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PublicAuthProvider } from './contexts/PublicAuthContext';
import { ReactNode } from 'react';

// Public pages
import HomePage from './pages/public/HomePage';
import ArticlePage from './pages/public/ArticlePage';
import CategoryPage from './pages/public/CategoryPage';
import SearchPage from './pages/public/SearchPage';
import AuthorPage from './pages/public/AuthorPage';
import PublicLoginPage from './pages/public/PublicLoginPage';
import AccountPage from './pages/public/AccountPage';

// CMS pages
import LoginPage from './pages/cms/LoginPage';
import CMSDashboardPage from './pages/cms/CMSDashboardPage';
import ArticlesListPage from './pages/cms/ArticlesListPage';
import ArticleEditorPage from './pages/cms/ArticleEditorPage';
import CategoriesPage from './pages/cms/CategoriesPage';
import AuthorsPage from './pages/cms/AuthorsPage';
import MediaPage from './pages/cms/MediaPage';
import HomepageCurationPage from './pages/cms/HomepageCurationPage';
import AnalyticsDashboardPage from './pages/cms/AnalyticsDashboardPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!session || !profile) return <Navigate to="/cms/login" replace />;
  return <>{children}</>;
}

function CMSRoot() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session || !profile) return <Navigate to="/cms/login" replace />;
  return <Navigate to="/cms/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PublicAuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/author/:slug" element={<AuthorPage />} />

            {/* Reader account */}
            <Route path="/account/login" element={<PublicLoginPage />} />
            <Route path="/account" element={<AccountPage />} />

            {/* CMS auth */}
            <Route path="/cms/login" element={<LoginPage />} />

            {/* CMS (protected) */}
            <Route path="/cms" element={<CMSRoot />} />
            <Route path="/cms/dashboard" element={<RequireAuth><CMSDashboardPage /></RequireAuth>} />
            <Route path="/cms/articles" element={<RequireAuth><ArticlesListPage /></RequireAuth>} />
            <Route path="/cms/articles/new" element={<RequireAuth><ArticleEditorPage /></RequireAuth>} />
            <Route path="/cms/articles/:id/edit" element={<RequireAuth><ArticleEditorPage /></RequireAuth>} />
            <Route path="/cms/categories" element={<RequireAuth><CategoriesPage /></RequireAuth>} />
            <Route path="/cms/authors" element={<RequireAuth><AuthorsPage /></RequireAuth>} />
            <Route path="/cms/media" element={<RequireAuth><MediaPage /></RequireAuth>} />
            <Route path="/cms/homepage" element={<RequireAuth><HomepageCurationPage /></RequireAuth>} />
            <Route path="/cms/analytics" element={<RequireAuth><AnalyticsDashboardPage /></RequireAuth>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PublicAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
