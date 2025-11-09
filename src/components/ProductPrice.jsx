import React from 'react';
import { formatPrice } from '../utils/currency';

const ProductPrice = ({ 
  product, 
  size = 'base', 
  showPercentage = true, 
  showEndDate = true,
  className = '' 
}) => {
  const hasPromotion = product.promotion_active && 
                      product.promotion_percentage && 
                      product.old_price && 
                      product.old_price > product.price;

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const priceSizeClasses = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
    '3xl': 'text-2xl'
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-blue-700 ${sizeClasses[size]}`}>
          {formatPrice(product.price)}
        </span>
        {hasPromotion && (
          <span className={`text-gray-500 line-through ${priceSizeClasses[size]}`}>
            {formatPrice(product.old_price)}
          </span>
        )}
      </div>
      
      {hasPromotion && showPercentage && (
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            -{product.promotion_percentage}%
          </span>
          {showEndDate && product.promotion_end_date && (
            <span className="text-xs text-gray-600">
              Jusqu'au {new Date(product.promotion_end_date).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPrice; 