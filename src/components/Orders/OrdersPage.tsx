import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Calendar, MapPin, DollarSign, User, CheckCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../types';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { user } = useAuth();
  const location = useLocation();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = user?.is_seller ? '/orders/seller/' : '/orders/buyer/';
      const response = await api.get<Order[]>(endpoint);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status/`, { status: newStatus });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Message */}
      {location.state?.message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{location.state.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.is_seller ? 'Seller Orders' : 'Your Orders'}
          </h1>
          <p className="text-gray-600 mt-2">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
          <p className="text-gray-600 text-lg">
            {user?.is_seller 
              ? "You haven't received any orders yet." 
              : "You haven't placed any orders yet."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-xl shadow-md border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedOrder?.id === order.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {!user?.is_seller && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Customer: {order.buyer_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                  <p className="text-lg font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {formatPrice(order.total_amount)}
                  </p>
                </div>

                <div className="text-sm text-blue-600 font-medium">
                  Click to view details →
                </div>
              </div>
            ))}
          </div>

          {/* Order Details */}
          <div className="lg:sticky lg:top-8">
            {selectedOrder ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Order #{selectedOrder.id}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>

                {/* Customer Info */}
                {!user?.is_seller && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer</h3>
                    <p className="text-gray-700">{selectedOrder.buyer_name}</p>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Shipping Address
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.shipping_address}
                  </p>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × {formatPrice(item.price_at_time)}
                          </p>
                          {user?.is_seller && (
                            <p className="text-sm text-gray-600">Store: {item.seller_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Status Update (Sellers Only) */}
                {user?.is_seller && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {['confirmed', 'processing', 'shipped', 'delivered'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(selectedOrder.id, status)}
                          disabled={selectedOrder.status === status}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            selectedOrder.status === status
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Order</h3>
                <p className="text-gray-600">Click on an order from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;