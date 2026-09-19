import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import { CartProvider } from '@context/CartContext';
import { ProductsProvider } from '@context/ProductsContext';
import { ToastProvider } from '@components/ui/Toast';
import Layout from '@components/layout/Layout';
import ScrollToTop from '@components/layout/ScrollToTop';
import Chatbot from '@components/Chatbot';

// Pages
import HomePage from '@pages/HomePage';
import ProductsPage from '@pages/ProductsPage';
import ProductDetailPage from '@pages/ProductDetailPage';
import CartPage from '@pages/CartPage';
import CheckoutPage from '@pages/CheckoutPage';
import OrderSuccessPage from '@pages/OrderSuccessPage';
import LoginPage from '@pages/LoginPage';
import RegisterPage from '@pages/RegisterPage';
import ForgotPasswordPage from '@pages/ForgotPasswordPage';
import ProfilePage from '@pages/ProfilePage';
import OrdersPage from '@pages/OrdersPage';
import AdminPage from '@pages/AdminPage';
import PrivacyPage from '@pages/PrivacyPage';
import TermsPage from '@pages/TermsPage';
import NotFoundPage from '@pages/NotFoundPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-success" element={<OrderSuccessPage />} />
                <Route path="privacy-policy" element={<PrivacyPage />} />
                <Route path="terms-conditions" element={<TermsPage />} />

                {/* Account routes */}
                <Route path="account">
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="orders" element={<OrdersPage />} />
                </Route>

                {/* Admin routes */}
                <Route path="admin/*" element={<AdminPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Chatbot />
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;