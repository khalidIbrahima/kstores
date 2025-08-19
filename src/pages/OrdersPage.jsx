import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReviewForm from '../components/ReviewForm';
import logoHorizontal from '../assets/logo_nav.jpg';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleViewInvoice = (order) => {
    const logoUrl = window.location.origin + '/src/assets/logo_nav.jpg';
    const invoiceHtml = `
      <html>
        <head>
          <title>Facture - ${order.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #f6f8fa;
              padding: 0;
              margin: 0;
            }
            .invoice-container {
              background: #fff;
              max-width: 800px;
              margin: 40px auto;
              border-radius: 18px;
              box-shadow: 0 8px 32px rgba(44, 62, 80, 0.12);
              padding: 48px 40px 32px 40px;
              position: relative;
            }
            .logo {
              display: block;
              max-width: 220px;
              height: 60px;
              object-fit: contain;
              margin-bottom: 8px;
            }
            .brand {
              font-family: 'Pacifico', cursive;
              font-size: 2.1rem;
              color: #183153;
              margin-bottom: 0;
              font-weight: 700;
            }
            .ribbon {
              position: absolute;
              top: 32px;
              right: -32px;
              background: linear-gradient(90deg, #1fb6ff 60%, #ffb300 100%);
              color: #fff;
              font-size: 1.1rem;
              font-weight: bold;
              padding: 10px 40px;
              border-radius: 0 12px 12px 0;
              box-shadow: 0 2px 8px rgba(44,62,80,0.08);
              letter-spacing: 2px;
              text-shadow: 0 1px 2px #0001;
            }
            .info {
              margin-bottom: 32px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              flex-wrap: wrap;
            }
            .info-block {
              margin-bottom: 12px;
            }
            .info-title {
              color: #1fb6ff;
              font-weight: 600;
              font-size: 1.1rem;
              margin-bottom: 2px;
            }
            .client-box {
              background: #f0f7fa;
              border-left: 4px solid #1fb6ff;
              border-radius: 8px;
              padding: 16px 24px;
              margin-bottom: 24px;
              font-size: 1rem;
              color: #183153;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 18px;
              background: #fff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px #1fb6ff22;
            }
            th {
              background: #1fb6ff;
              color: #fff;
              font-weight: 600;
              padding: 14px 8px;
              font-size: 1rem;
              border: none;
            }
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #e3e8ee;
              font-size: 1rem;
              color: #183153;
              background: #fff;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:hover td {
              background: #f0f7fa;
            }
            .total-row td {
              font-weight: bold;
              font-size: 1.1rem;
              background: #e3f6fd;
              color: #1fb6ff;
              border-bottom: none;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #888;
              font-size: 0.95rem;
            }
            .print-btn {
              display: inline-block;
              margin: 32px auto 0 auto;
              padding: 12px 32px;
              background: linear-gradient(90deg, #1fb6ff 60%, #ffb300 100%);
              color: #fff;
              font-size: 1.1rem;
              font-weight: 600;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              box-shadow: 0 2px 8px #1fb6ff33;
              transition: background 0.2s;
            }
            .print-btn:hover {
              background: linear-gradient(90deg, #009eea 60%, #ffb300 100%);
            }
            @media (max-width: 600px) {
              .invoice-container { padding: 16px 4px; }
              .info { flex-direction: column; gap: 12px; }
              .client-box { padding: 10px 8px; }
              th, td { font-size: 0.95rem; }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="invoice-container">
            <div class="ribbon">FACTURE</div>
            <img src='${logoUrl}' alt='Kapital Stores Logo' class='logo' />
            <div class="brand">Kapital Stores</div>
            <div class="info">
              <div class="info-block">
                <div class="info-title">Facture N°</div>
                <div>${order.id}</div>
              </div>
              <div class="info-block">
                <div class="info-title">Date</div>
                <div>${new Date(order.created_at).toLocaleDateString()}</div>
              </div>
              <div class="info-block">
                <div class="info-title">Contact</div>
                <div>support@kapital-stores.shop<br>+221 77 240 50 63</div>
              </div>
            </div>
            <div class="client-box">
              <strong>Client :</strong> ${order.shipping_address?.name || 'N/A'}<br>
              <span>${order.shipping_address?.address || ''} ${order.shipping_address?.city || ''}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items.map(item => `
                  <tr>
                    <td>${item.products?.name || ''}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price.toLocaleString()} FCFA</td>
                    <td>${(item.price * item.quantity).toLocaleString()} FCFA</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" style="text-align:right;">Total</td>
                  <td>${order.total.toLocaleString()} FCFA</td>
                </tr>
              </tbody>
            </table>
            <button onclick="window.print()" class="print-btn">Imprimer / Télécharger</button>
            <div class="footer">
              Merci pour votre confiance !<br>
              Kapital Stores &copy; ${new Date().getFullYear()}
            </div>
          </div>
        </body>
      </html>
    `;
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <div className="flex flex-col items-center">
          <ShoppingBag className="h-16 w-16 text-gray-400" />
          <h2 className="mt-6 mb-4 text-2xl font-bold">{t('orders.no_orders_yet')}</h2>
          <p className="mb-8 text-gray-600">{t('orders.start_shopping_to_see_your_order_history_here')}</p>
          <Link
            to="/products"
            className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Browse Products <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t('orders.your_orders')}</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-lg bg-white shadow-md"
          >
            <div className="border-b border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('orders.order_placed')}</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('orders.total')}</p>
                  <p className="font-medium">{order.total.toFixed(2)} {t('common.currency')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('orders.order_id')}</p>
                  <p className="font-medium">{order.id}</p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t(`orders.${order.status}`)}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center p-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={item.products?.image_url}
                      alt={item.products?.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link to={`/product/${item.products?.id}`} className="hover:text-blue-600">
                            {item.products?.name}
                          </Link>
                        </h3>
                        <p className="ml-4 text-lg font-medium text-gray-900">
                          {(item.price * item.quantity).toFixed(2)} {t('common.currency')}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{t('orders.quantity')}: {item.quantity}</p>
                    </div>
                    {order.status === 'delivered' && user && (
                      <div className="mt-2">
                        <ReviewForm productId={item.product_id || item.products?.id} userId={user.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex justify-between">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Track Package
                </button>
                <button
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  onClick={() => handleViewInvoice(order)}
                >
                  {t('orders.view_invoice')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage