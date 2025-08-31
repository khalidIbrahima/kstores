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
      <div className="container mx-auto my-16 px-4 text-center">
        <div className="flex flex-col items-center">
          <ShoppingCart className="h-16 w-16 text-text-light" />
          <h2 className="mt-6 mb-4 text-2xl font-bold text-text-dark">{t('cart.yourCartIsEmpty')}</h2>
          <p className="mb-8 text-text-light">{t('cart.looksLikeYouHaveNotAddedAnythingToYourCartYet')}</p>
          <Link
            to="/products"
            className="btn-primary inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-text-dark">{t('cart.yourCart')}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-background shadow-md">
            <div className="overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-background-dark">
                <thead className="bg-background-light">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-light">
                      {t('cart.product')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-light">
                      {t('cart.price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-light">
                      {t('cart.quantity')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-light">
                      {t('cart.total')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-light">
                      <span className="sr-only">{t('cart.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-dark bg-background">
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
                              <Link to={urlUtils.generateProductUrl(item)} className="text-sm font-medium text-text-dark hover:text-primary">
                                {item.name}
                              </Link>
                              {/* Color Display */}
                              {item.selectedColor && (
                                <div className="flex items-center mt-1">
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300 mr-2"
                                    style={{ backgroundColor: item.selectedColor.hex }}
                                  />
                                  <span className="text-xs text-text-light">
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
                                      <div key={key} className="flex items-center text-xs text-text-light">
                                        <span className="font-medium">{key}:</span>
                                        {imageUrl ? (
                                          <div className="ml-1 flex items-center gap-1">
                                            <img
                                              src={imageUrl}
                                              alt={value}
                                              className="w-4 h-4 rounded border border-gray-300 object-cover"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                              }}
                                            />
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{value}</span>
                                          </div>
                                        ) : (
                                          <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{value}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-text-light">
                          {formatPrice(item.price)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-text-light">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="rounded-l-md border border-background-dark bg-background-light p-1 text-text-dark hover:bg-background hover:text-primary"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="flex w-10 items-center justify-center border-y border-background-dark p-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="rounded-r-md border border-background-dark bg-background-light p-1 text-text-dark hover:bg-background hover:text-primary"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-text-dark">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-accent hover:text-accent/80"
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

            <div className="border-t border-background-dark p-4 text-right">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="font-medium text-accent hover:text-accent/80"
              >
                {t('cart.clearCart')}
              </button>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="rounded-lg bg-background p-6 shadow-md">
          <h2 className="mb-6 text-xl font-bold text-text-dark">{t('cart.orderSummary')}</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-text-light">{t('cart.subtotal')}</span>
              <span className="font-medium text-text-dark">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">{t('cart.shipping')}</span>
              <span className="font-medium text-text-dark">{t('cart.calculatedAtCheckout')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">{t('cart.tax')}</span>
              <span className="font-medium text-text-dark">{t('cart.calculatedAtCheckout')}</span>
            </div>
            <div className="my-4 border-t border-background-dark pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-text-dark">{t('cart.total')}</span>
                <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary mt-6 w-full"
          >
            {t('cart.proceedToCheckout')}
          </button>
          
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-background-dark/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md rounded-lg bg-background p-6 shadow-xl"
            >
              <button
                onClick={() => setShowConfirmClear(false)}
                className="absolute top-4 right-4 text-text-light hover:text-text-dark"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-center">
                <h3 className="mb-4 text-xl font-bold text-text-dark">{t('cart.clearYourCart')}</h3>
                <p className="mb-6 text-text-light">{t('cart.areYouSureYouWantToRemoveAllItemsFromYourCart')}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="btn-secondary"
                  >
                    {t('cart.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      setShowConfirmClear(false);
                    }}
                    className="btn-accent"
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
  );
};

export default CartPage;