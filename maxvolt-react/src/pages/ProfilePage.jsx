import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import ProfileForm from '@components/account/ProfileForm';
import Button from '@components/ui/Button';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOutUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirect_after_login', '/account/profile');
      navigate('/account/login');
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOutUser();
    navigate('/');
  };

  if (authLoading || !user) {
    return (
      <div className="container-custom py-20 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1>My Profile</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/account/orders')} variant="outline" size="sm">
            My Orders
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </div>

      <ProfileForm />
    </div>
  );
}