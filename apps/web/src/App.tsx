import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import MapPage from './pages/MapPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <MapPage /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
