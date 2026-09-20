import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import RegisterForm from '@components/account/RegisterForm';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/account/profile');
  }, [user, navigate]);

  return (
    <div className="min-h-[calc(100vh-72px)] grid place-items-center px-4 py-10">
      <RegisterForm onSuccess={() => navigate('/account/profile')} />
    </div>
  );
}