import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Package, CreditCard, ArrowLeft } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import type { Cart, CartItem } from '../../types';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get<Cart>('/orders/cart/');
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(itemId);
    try {
      await api.put(`/orders/cart/item/${itemId}/update/`, {
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      await api.delete(`/orders/cart/item/${itemId}/remove/`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/orders/cart/clear/');
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    setCheckingOut(true);
    try {
      await api.post('/orders/create/', {
        shipping_address: shippingAddress,
      });
      
      navigate('/orders', { 
        state: { message: 'Order placed successfully!' }
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: CartItem) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center space-x-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Store: {item.product.store_name}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updating === item.id || item.quantity <= 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="text-lg font-semibold min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updating === item.id || item.quantity >= item.product.stock}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Item Total & Remove */}
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    {formatPrice(item.total_price)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cart.item_count} items)</span>
                <span className="font-semibold">{formatPrice(cart.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(cart.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {!showCheckout ? (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Proceed to Checkout</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Address
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter your complete shipping address..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut || !shippingAddress.trim()}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>{checkingOut ? 'Placing Order...' : 'Place Order'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;