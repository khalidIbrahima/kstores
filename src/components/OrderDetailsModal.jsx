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
      <div className="relative w-full max-w-4xl rounded-2xl bg-background p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-light hover:text-text text-2xl font-bold focus:outline-none transition-colors"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="mb-6 text-2xl font-bold text-center text-text-dark">{t('orders.order_details')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Infos client & commande */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-dark mb-1">{t('orders.customer_information')}</h3>
              <div className="card p-4 space-y-1">
                <p><strong>{t('name')}:</strong> {order.shipping_address?.name || 'Unknown Customer'}</p>
                {order.shipping_address?.email && (
                  <p><strong>{t('email')}:</strong> {order.shipping_address.email}</p>
                )}
                {order.shipping_address?.phone && (
                  <p><strong>{t('phone')}:</strong> {order.shipping_address.phone}</p>
                )}
                {order.shipping_address?.address && (
                  <p><strong>{t('address')}:</strong> {order.shipping_address.address}</p>
                )}
                {order.shipping_address?.city && (
                  <p><strong>{t('city')}:</strong> {order.shipping_address.city}</p>
                )}
                {order.shipping_address?.state && (
                  <p><strong>{t('state')}:</strong> {order.shipping_address.state}</p>
                )}
                {order.shipping_address?.zip_code && (
                  <p><strong>{t('zip_code')}:</strong> {order.shipping_address.zip_code}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-text-dark mb-1">{t('orders.order_information')}</h3>
              <div className="card p-4 space-y-1">
                <p><strong>{t('orders.order_id')}:</strong> {order.id}</p>
                <p><strong>{t('orders.date')}:</strong> {formatDate(order.created_at)}</p>
                <p><strong>{t('orders.status')}:</strong> {order.status}</p>
                <p><strong>{t('orders.total')}:</strong> {order.total ? `${order.total.toLocaleString()} FCFA` : ''}</p>
              </div>
            </div>
          </div>
          {/* Carte de localisation */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-dark mb-2">{t('orders.customer_location')}</h3>
              {geo && geo.latitude && geo.longitude ? (
                <>
                  <OrderLocationMap
                    userGeolocation={geo}
                    userName={order.profiles?.full_name || 'Unknown Customer'}
                  />
                  <div className="mt-2 text-xs text-text-light">
                    <span>{t('orders.lat')}: {geo.latitude}, {t('orders.lng')}: {geo.longitude}</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="text-xs text-text">{t('orders.scan_to_open_in_google_maps')}</span>
                    <QRCode value={`https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`} size={96} />
                  </div>
                </>
              ) : (
                <div className="text-sm text-text-light">{t('orders.no_geolocation_data_available')}</div>
              )}
            </div>
          </div>
        </div>
        {/* Items de la commande */}
        <div className="mt-8">
          <h3 className="mb-2 text-lg font-medium text-text-dark">{t('orders.order_items')}</h3>
          <div className="overflow-x-auto rounded-lg bg-background-light p-2">
            <table className="min-w-full divide-y divide-background-dark">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-light">{t('orders.product')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-light">{t('orders.price')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-light">{t('orders.quantity')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-light">{t('orders.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-dark">
                {order.order_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="flex items-center gap-2 px-4 py-2">
                      {item.products?.image_url && (
                        <img src={item.products.image_url} alt={item.products.name} className="h-8 w-8 rounded object-cover" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-text">{item.products?.name}</span>
                        {item.selected_color && (
                          <div className="flex items-center mt-1">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300 mr-1"
                              style={{ backgroundColor: JSON.parse(item.selected_color).hex }}
                            />
                            <span className="text-xs text-text-light">
                              {JSON.parse(item.selected_color).name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-text">{item.price ? `${item.price.toLocaleString()} FCFA` : ''}</td>
                    <td className="px-4 py-2 text-text">{item.quantity}</td>
                    <td className="px-4 py-2 font-semibold text-secondary">{item.price && item.quantity ? `${(item.price * item.quantity).toLocaleString()} FCFA` : ''}</td>
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