import { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePublicAuth } from '../contexts/PublicAuthContext';
import HomePage from '../pages/public/HomePage';
import ArticlePage from '../pages/public/ArticlePage';
import CategoryPage from '../pages/public/CategoryPage';
import SearchPage from '../pages/public/SearchPage';
import AuthorPage from '../pages/public/AuthorPage';
import PublicLoginPage from '../pages/public/PublicLoginPage';
import AccountPage from '../pages/public/AccountPage';
import LoginPage from '../pages/cms/LoginPage';
import CMSDashboardPage from '../pages/cms/CMSDashboardPage';
import ArticlesListPage from '../pages/cms/ArticlesListPage';
import ArticleEditorPage from '../pages/cms/ArticleEditorPage';
import CategoriesPage from '../pages/cms/CategoriesPage';
import AuthorsPage from '../pages/cms/AuthorsPage';
import MediaPage from '../pages/cms/MediaPage';
import HomepageCurationPage from '../pages/cms/HomepageCurationPage';
import AnalyticsDashboardPage from '../pages/cms/AnalyticsDashboardPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireCmsProfile({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session || !profile) return <Navigate to="/cms/login" replace />;
  return <>{children}</>;
}

function RequirePublicAccount({ children }: { children: ReactNode }) {
  const { session, loading } = usePublicAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/account/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function CMSRoot() {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session || !profile) return <Navigate to="/cms/login" replace />;
  return <Navigate to="/cms/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/author/:slug" element={<AuthorPage />} />

      <Route path="/account/login" element={<PublicLoginPage />} />
      <Route path="/account" element={<RequirePublicAccount><AccountPage /></RequirePublicAccount>} />

      <Route path="/cms/login" element={<LoginPage />} />
      <Route path="/cms" element={<CMSRoot />} />
      <Route path="/cms/dashboard" element={<RequireCmsProfile><CMSDashboardPage /></RequireCmsProfile>} />
      <Route path="/cms/articles" element={<RequireCmsProfile><ArticlesListPage /></RequireCmsProfile>} />
      <Route path="/cms/articles/new" element={<RequireCmsProfile><ArticleEditorPage /></RequireCmsProfile>} />
      <Route path="/cms/articles/:id/edit" element={<RequireCmsProfile><ArticleEditorPage /></RequireCmsProfile>} />
      <Route path="/cms/categories" element={<RequireCmsProfile><CategoriesPage /></RequireCmsProfile>} />
      <Route path="/cms/authors" element={<RequireCmsProfile><AuthorsPage /></RequireCmsProfile>} />
      <Route path="/cms/media" element={<RequireCmsProfile><MediaPage /></RequireCmsProfile>} />
      <Route path="/cms/homepage" element={<RequireCmsProfile><HomepageCurationPage /></RequireCmsProfile>} />
      <Route path="/cms/analytics" element={<RequireCmsProfile><AnalyticsDashboardPage /></RequireCmsProfile>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
