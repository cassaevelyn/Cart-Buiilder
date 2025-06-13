import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Cart Builder</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Products
            </Link>
            {user?.is_seller && (
              <Link
                to="/seller/dashboard"
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart */}
                {!user.is_seller && (
                  <Link
                    to="/cart"
                    className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    <ShoppingCart className="h-6 w-6" />
                  </Link>
                )}

                {/* Orders */}
                <Link
                  to={user.is_seller ? "/seller/orders" : "/orders"}
                  className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <Package className="h-6 w-6" />
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">
                      {user.first_name} {user.last_name}
                      {user.is_seller && <span className="text-blue-600 ml-1">(Seller)</span>}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-700 hover:text-red-600 transition-colors duration-200"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;