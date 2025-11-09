import OrderLocationMap from './OrderLocationMap';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import ReviewForm from './ReviewForm';
import { useAuth } from '../contexts/AuthContext';

export default function OrderDetailsModal({ order, onClose }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  if (!order) return null;

  const formatDate = (date) =>
    new Date(date).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US');
  const formatPrice = (amount) => `${Number(amount).toLocaleString()} FCFA`;

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Function to open Google Maps
  const openGoogleMaps = (latitude, longitude) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  };

  let geo = order.userGeolocation;
  if (typeof geo === 'string') {
    try {
      geo = JSON.parse(geo);
    } catch (e) {
      geo = null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40 overflow-y-auto p-4">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold focus:outline-none transition-colors"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-gray-100">{t('orders.order_details')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Infos client & commande */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('orders.customer_information')}</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-1">
                <p className="text-gray-900 dark:text-gray-100"><strong>{t('name')}:</strong> {order.shipping_address?.name || 'Unknown Customer'}</p>
                {order.shipping_address?.email && (
                  <p className="text-gray-900 dark:text-gray-100"><strong>{t('email')}:</strong> {order.shipping_address.email}</p>
                )}
                {order.shipping_address?.phone && (
                  <p className="text-gray-900 dark:text-gray-100"><strong>{t('phone')}:</strong> {order.shipping_address.phone}</p>
                )}
                {order.shipping_address?.address && (
                  <p className="text-gray-900 dark:text-gray-100"><strong>{t('address')}:</strong> {order.shipping_address.address}</p>
                )}
                {order.shipping_address?.city && (
                  <p className="text-gray-900 dark:text-gray-100"><strong>{t('city')}:</strong> {order.shipping_address.city}</p>
                )}
                {order.shipping_address?.state && (
                  <p className="text-gray-900 dark:text-gray-100"><strong>{t('state')}:</strong> {order.shipping_address.state}</p>
                )}
                {order.shipping_address?.zip_code && (
                  <p className="text-gray-900 dark:text-gray-100"><strong>{t('zip_code')}:</strong> {order.shipping_address.zip_code}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('orders.order_information')}</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-1">
                <p className="text-gray-900 dark:text-gray-100"><strong>{t('orders.order_id')}:</strong> {order.id}</p>
                <p className="text-gray-900 dark:text-gray-100"><strong>{t('orders.date')}:</strong> {formatDate(order.created_at)}</p>
                <p className="text-gray-900 dark:text-gray-100"><strong>{t('orders.status')}:</strong> {order.status}</p>
                <p className="text-gray-900 dark:text-gray-100"><strong>{t('orders.total')}:</strong> {order.total ? `${order.total.toLocaleString()} FCFA` : ''}</p>
              </div>
            </div>
          </div>
          {/* Carte de localisation */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('orders.customer_location')}</h3>
              {geo && geo.latitude && geo.longitude ? (
                <>
                  <OrderLocationMap
                    userGeolocation={geo}
                    userName={order.profiles?.full_name || 'Unknown Customer'}
                  />
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{t('orders.lat')}: {geo.latitude}, {t('orders.lng')}: {geo.longitude}</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {isMobile ? t('orders.tap_qr_to_open_google_maps') : t('orders.scan_to_open_in_google_maps')}
                    </span>
                    {isMobile ? (
                      <button
                        onClick={() => openGoogleMaps(geo.latitude, geo.longitude)}
                        className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                        aria-label="Ouvrir dans Google Maps"
                      >
                        <QRCode value={`https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`} size={96} />
                      </button>
                    ) : (
                      <QRCode value={`https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`} size={96} />
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('orders.no_geolocation_data_available')}</div>
              )}
            </div>
          </div>
        </div>
        {/* Items de la commande */}
        <div className="mt-8">
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">{t('orders.order_items')}</h3>
          <div className="overflow-x-auto rounded-lg bg-gray-50 dark:bg-gray-700 p-2">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('orders.product')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('orders.price')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('orders.quantity')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('orders.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {order.order_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="flex items-center gap-2 px-4 py-2">
                      {item.products?.image_url && (
                        <img src={item.products.image_url} alt={item.products.name} className="h-8 w-8 rounded object-cover" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100">{item.products?.name}</span>
                        {item.selected_color && (() => {
                          try {
                            const colorData = JSON.parse(item.selected_color);
                            return (
                              <div className="flex items-center mt-1">
                                <div
                                  className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 mr-1"
                                  style={{ backgroundColor: colorData.hex }}
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {colorData.name}
                                </span>
                              </div>
                            );
                          } catch (error) {
                            console.error('Error parsing selected_color:', error);
                            return null;
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.price ? `${item.price.toLocaleString()} FCFA` : ''}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.quantity}</td>
                    <td className="px-4 py-2 font-semibold text-blue-600 dark:text-blue-400">{item.price && item.quantity ? `${(item.price * item.quantity).toLocaleString()} FCFA` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 