import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Store, Plus, Minus, Star, Heart, Share2 } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { Product } from '../../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.get<Product>(`/products/${id}/`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      showNotification('Product not found', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user || user.is_seller || !product) return;

    setAddingToCart(true);
    try {
      await api.post('/orders/cart/add/', {
        product_id: product.id,
        quantity: quantity,
      });
      showNotification(`Added ${quantity} ${product.name}${quantity > 1 ? 's' : ''} to cart!`, 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add to cart';
      showNotification(errorMessage, 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const getStockStatus = () => {
    if (!product) return { text: '', color: '' };
    
    if (product.stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600' };
    } else if (product.stock <= 5) {
      return { text: `Only ${product.stock} left in stock`, color: 'text-orange-600' };
    } else {
      return { text: 'In Stock', color: 'text-green-600' };
    }
  };

  const getDisplayImages = () => {
    if (!product) return [];
    
    if (product.images && product.images.length > 0) {
      return product.images.map(img => img.image);
    } else if (product.image) {
      return [product.image];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const displayImages = getDisplayImages();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-blue-600 transition-colors duration-200">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden">
            {displayImages.length > 0 ? (
              <img
                src={displayImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Image Thumbnails */}
          {displayImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageIndex === index
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Store className="h-4 w-4" />
                <span>Sold by {product.store_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.5 (24 reviews)</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="border-b border-gray-200 pb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatPrice(product.price)}
            </div>
            <div className={`text-sm font-medium ${stockStatus.color}`}>
              {stockStatus.text}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          {user && !user.is_seller && product.stock > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <span className="text-xl font-semibold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock === 0}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  </button>
                  
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                  
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Total Price */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice((parseFloat(product.price) * quantity).toString())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-center">
                  <Link to="/login" className="font-medium hover:underline">
                    Sign in
                  </Link>{' '}
                  to add this item to your cart
                </p>
              </div>
            </div>
          )}

          {/* Seller view */}
          {user?.is_seller && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 text-center">
                  You are viewing this as a seller. Customers can purchase this item.
                </p>
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Stock:</span>
                <span className="ml-2 text-gray-900">{product.stock} units</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Store:</span>
                <span className="ml-2 text-gray-900">{product.store_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Listed:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Updated:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(product.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Products */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to all products</span>
        </Link>
      </div>
    </div>
  );
};

export default ProductDetail;