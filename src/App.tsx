import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ProductList from './components/Products/ProductList';
import ProductDetail from './components/Products/ProductDetail';
import CartPage from './components/Cart/CartPage';
import OrdersPage from './components/Orders/OrdersPage';
import SellerDashboard from './components/Seller/SellerDashboard';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; sellerOnly?: boolean }> = ({ 
  children, 
  sellerOnly = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (sellerOnly && !user.is_seller) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterForm />
                </PublicRoute>
              }
            />
            <Route
              path="/seller/register"
              element={
                <PublicRoute>
                  <RegisterForm isSeller />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <Layout>
                  <ProductList />
                </Layout>
              }
            />

            <Route
              path="/products/:id"
              element={
                <Layout>
                  <ProductDetail />
                </Layout>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CartPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute sellerOnly>
                  <Layout>
                    <SellerDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute sellerOnly>
                  <Layout>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;