import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  showAddToCart?: boolean;
  loading?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  showAddToCart = true,
  loading = false 
}) => {
  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking add to cart
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };

  const getDisplayImage = () => {
    if (product.primary_image) {
      return product.primary_image;
    } else if (product.images && product.images.length > 0) {
      return product.images[0].image;
    } else if (product.image) {
      return product.image;
    }
    return null;
  };

  const displayImage = getDisplayImage();

  return (
    <Link to={`/products/${product.id}`} className="block">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 group">
        {/* Product Image */}
        <div className="h-48 bg-gray-200 relative overflow-hidden">
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              Out of Stock
            </div>
          )}
          
          {product.stock > 0 && product.stock <= 5 && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              Low Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {product.description}
              </p>
            )}
          </div>

          {/* Store Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Store:</span> {product.store_name}
            </div>
            <div className="text-sm text-gray-500">
              Stock: <span className="font-medium">{product.stock}</span>
            </div>
          </div>

          {/* Price and Action */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </div>
            
            {showAddToCart && (
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{loading ? 'Adding...' : 'Add to Cart'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;