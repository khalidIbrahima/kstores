import React from 'react';
import { motion } from 'framer-motion';
import { Percent, Clock } from 'lucide-react';

const PromotionBadge = ({ 
  product, 
  size = 'sm', 
  showEndDate = true,
  className = '' 
}) => {
  const hasPromotion = product.promotion_active && 
                      product.promotion_percentage && 
                      product.old_price && 
                      product.old_price > product.price;

  if (!hasPromotion) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    base: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    base: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const isExpiringSoon = () => {
    if (!product.promotion_end_date) return false;
    const endDate = new Date(product.promotion_end_date);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && diffDays > 0;
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`absolute top-2 left-2 z-10 ${className}`}
    >
      <div className={`flex items-center gap-1 rounded-full font-medium shadow-lg ${
        isExpiringSoon() 
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
      } ${sizeClasses[size]}`}>
        <Percent className={iconSizes[size]} />
        <span>-{product.promotion_percentage}%</span>
      </div>
      
      {showEndDate && product.promotion_end_date && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={`mt-1 flex items-center gap-1 rounded-full bg-black bg-opacity-75 text-white ${sizeClasses[size]}`}
        >
          <Clock className={iconSizes[size]} />
          <span className="text-xs">
            {new Date(product.promotion_end_date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit'
            })}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PromotionBadge; 