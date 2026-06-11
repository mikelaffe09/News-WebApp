import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicAuthProvider } from './contexts/PublicAuthContext';
import AppRoutes from './app/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PublicAuthProvider>
          <AppRoutes />
        </PublicAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
