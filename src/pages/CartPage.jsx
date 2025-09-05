import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/currency';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { urlUtils } from '../utils/slugUtils';


const CartPage = () => {
  const { t } = useTranslation();
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto my-8 sm:my-16 px-4 text-center">
        <div className="flex flex-col items-center max-w-md mx-auto">
          <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 sm:mt-6 mb-3 sm:mb-4 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('cart.yourCartIsEmpty')}</h2>
          <p className="mb-6 sm:mb-8 text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">{t('cart.looksLikeYouHaveNotAddedAnythingToYourCartYet')}</p>
          <Link
            to="/products"
            className="btn-primary inline-flex items-center px-6 py-3 text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('cart.yourCart')} | Kapital Stores</title>
        <meta name="description" content={t('cart.viewAndEditYourShoppingCart')} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6 sm:py-12">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('cart.yourCart')}</h1>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {/* Mobile View - Cards */}
          <div className="block md:hidden space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={urlUtils.generateProductUrl(item)} 
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      
                      {/* Color Display */}
                      {item.selectedColor && (
                        <div className="flex items-center mt-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 mr-2"
                            style={{ backgroundColor: item.selectedColor.hex }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {item.selectedColor.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Properties Display */}
                      {item.selectedProperties && Object.keys(item.selectedProperties).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(item.selectedProperties).map(([key, value]) => {
                            if (key.endsWith('_url')) return null;
                            const imageUrl = item.selectedProperties[`${key}_url`];
                            
                            return (
                              <div key={key} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{key}:</span>
                                {imageUrl ? (
                                  <div className="ml-1 flex items-center gap-1">
                                    <img
                                      src={imageUrl}
                                      alt={value}
                                      className="w-3 h-3 rounded border border-gray-300 dark:border-gray-600 object-cover"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">{value}</span>
                                  </div>
                                ) : (
                                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">{value}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Price */}
                      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex-shrink-0 text-accent hover:text-accent/80 p-1"
                      aria-label={t('cart.removeItem')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Quantity and Total */}
                  <div className="mt-4 flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 mr-3">{t('cart.quantity')}:</span>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-primary transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex w-12 items-center justify-center border-y border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-primary transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('cart.total')}</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Desktop View - Table */}
          <div className="hidden md:block rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t('cart.product')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t('cart.price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t('cart.quantity')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      {t('cart.total')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      <span className="sr-only">{t('cart.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <Link to={urlUtils.generateProductUrl(item)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary">
                                {item.name}
                              </Link>
                              {/* Color Display */}
                              {item.selectedColor && (
                                <div className="flex items-center mt-1">
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 mr-2"
                                    style={{ backgroundColor: item.selectedColor.hex }}
                                  />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {item.selectedColor.name}
                                  </span>
                                </div>
                              )}
                              
                              {/* Properties Display */}
                              {item.selectedProperties && Object.keys(item.selectedProperties).length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {Object.entries(item.selectedProperties).map(([key, value]) => {
                                    // Skip URL properties (they are handled with their corresponding image properties)
                                    if (key.endsWith('_url')) return null;
                                    
                                    const imageUrl = item.selectedProperties[`${key}_url`];
                                    
                                    return (
                                      <div key={key} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">{key}:</span>
                                        {imageUrl ? (
                                          <div className="ml-1 flex items-center gap-1">
                                            <img
                                              src={imageUrl}
                                              alt={value}
                                              className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 object-cover"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                              }}
                                            />
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">{value}</span>
                                          </div>
                                        ) : (
                                          <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">{value}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatPrice(item.price)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="rounded-l-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-primary transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="flex w-10 items-center justify-center border-y border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-primary transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-accent hover:text-accent/80 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-right">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                {t('cart.clearCart')}
              </button>
            </div>
          </div>
          
          {/* Mobile Clear Cart Button */}
          <div className="block md:hidden mt-4 text-center">
            <button
              onClick={() => setShowConfirmClear(true)}
              className="font-medium text-accent hover:text-accent/80 transition-colors px-4 py-2 rounded-md border border-accent hover:bg-accent/10"
            >
              {t('cart.clearCart')}
            </button>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart.orderSummary')}</h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">{t('cart.subtotal')}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">{t('cart.shipping')}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{t('cart.calculatedAtCheckout')}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600 dark:text-gray-400">{t('cart.tax')}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{t('cart.calculatedAtCheckout')}</span>
            </div>
            <div className="my-3 sm:my-4 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
              <div className="flex justify-between">
                <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{t('cart.total')}</span>
                <span className="text-base sm:text-lg font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary mt-4 sm:mt-6 w-full py-3 sm:py-2 text-sm sm:text-base font-medium"
          >
            {t('cart.proceedToCheckout')}
          </button>
          
          <div className="mt-4 sm:mt-6">
            <Link
              to="/products"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md mx-4 rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <button
                onClick={() => setShowConfirmClear(false)}
                className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-center">
                <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('cart.clearYourCart')}</h3>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('cart.areYouSureYouWantToRemoveAllItemsFromYourCart')}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="btn-secondary py-2.5 sm:py-2 text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    {t('cart.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      setShowConfirmClear(false);
                    }}
                    className="btn-accent py-2.5 sm:py-2 text-sm sm:text-base flex-1 sm:flex-none"
                  >
                    {t('cart.clearCart')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default CartPage;