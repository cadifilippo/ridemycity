import { Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <Bike size={32} />
        </div>
        <h1 className="login-title">RideMyCity</h1>
        <p className="login-subtitle">Traza las calles de tu ciudad</p>
        <button className="login-btn" onClick={signInWithGoogle}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="login-btn-icon"
            aria-hidden="true"
          />
          Entrar con Google
        </button>
      </div>
    </div>
  );
}
