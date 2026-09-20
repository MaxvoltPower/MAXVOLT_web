import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import LoginForm from '@components/account/LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirect = sessionStorage.getItem('redirect_after_login');
      sessionStorage.removeItem('redirect_after_login');

      if (isAdmin) {
        navigate('/admin');
      } else if (redirect) {
        navigate(redirect);
      } else {
        navigate('/account/profile');
      }
    }
  }, [user, isAdmin, navigate]);

  return (
    <div className="min-h-[calc(100vh-72px)] grid place-items-center px-4 py-10">
      <LoginForm />
    </div>
  );
}