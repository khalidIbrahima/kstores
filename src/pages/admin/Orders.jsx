import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, X, Trash2, Plus, Filter, X as XIcon, Calendar, SortAsc, SortDesc, Bell, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import OrderLocationMap from '../../components/OrderLocationMap';
import QRCode from 'react-qr-code';
import { useTranslation } from 'react-i18next';

import { useNavigate, useLocation } from 'react-router-dom';
import { notifyCustomerOrderStatusChange, ORDER_STATUS_CONFIG } from '../../services/notificationService';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Get status filter from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusFromUrl = urlParams.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `)
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Récupérer la commande complète pour les notifications
      const order = orders.find(o => o.id === orderId);
      const previousStatus = order?.status;

      // Mettre à jour le statut dans la base de données
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;

      // Mettre à jour l'état local
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      // Notifier le client du changement de statut
      if (order && previousStatus !== newStatus) {
        try {
          const notificationResults = await notifyCustomerOrderStatusChange(order, newStatus, previousStatus);
          
          // Afficher un message de succès avec les détails des notifications
          const successMessages = [];
          if (notificationResults.email) successMessages.push('Email envoyé');
          if (notificationResults.whatsapp) successMessages.push('WhatsApp envoyé');
          if (notificationResults.internal) successMessages.push('Notification interne créée');
          
          if (successMessages.length > 0) {
            toast.success(`Statut mis à jour et ${successMessages.join(', ')}`);
          } else {
            toast.success('Statut mis à jour');
          }

          // Afficher les erreurs s'il y en a
          if (notificationResults.errors.length > 0) {
            notificationResults.errors.forEach(error => {
              toast.error(`Erreur ${error.type}: ${error.error}`);
            });
          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          toast.error('Statut mis à jour mais erreur lors de l\'envoi des notifications');
        }
      } else {
        toast.success('Order status updated successfully');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(t('orders.confirm_delete'))) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (error) throw error;
      setOrders(orders.filter(order => order.id !== orderId));
      toast.success(t('orders.delete_success'));
    } catch (error) {
      toast.error(t('orders.delete_error'));
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shipping_address?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status?.toLowerCase() === statusFilter.toLowerCase();
    
    // Date filter
    const matchesDate = !dateFilter || (() => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === dateFilter;
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const clearStatusFilter = () => {
    setStatusFilter('');
    navigate('/admin/orders');
  };

  const clearDateFilter = () => {
    setDateFilter('');
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setDateFilter('');
    setSearchQuery('');
    navigate('/admin/orders');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('orders.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('orders.manage_customer_orders')}</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => navigate('/admin/create-order')}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t('orders.create_order') || 'Créer une commande'}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher par ID ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiées</option>
          <option value="delivered">Livrées</option>
          <option value="cancelled">Annulées</option>
        </select>

        {/* Sort Order */}
        <button
          onClick={toggleSortOrder}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {sortOrder === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
          <span>Date {sortOrder === 'asc' ? '↑' : '↓'}</span>
        </button>
      </div>

      {/* Active Filters Display */}
      {(statusFilter || dateFilter || searchQuery) && (
        <div className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-800 dark:text-blue-200 font-medium">Filtres actifs :</span>
          
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              Statut: {statusFilter}
              <button
                onClick={clearStatusFilter}
                className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {dateFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
              Date: {new Date(dateFilter).toLocaleDateString()}
              <button
                onClick={clearDateFilter}
                className="ml-1 hover:text-green-600 dark:hover:text-green-300"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
              Recherche: "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:text-purple-600 dark:hover:text-purple-300"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <XIcon className="h-4 w-4" />
            <span className="text-sm">Effacer tous les filtres</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white dark:bg-gray-800 shadow-md dark:shadow-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('order_id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('total')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            {filteredOrders.length === 0 && !isLoading && (
              <tbody>
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {(statusFilter || dateFilter || searchQuery) ? (
                        <>
                          <p className="text-lg font-medium mb-2">Aucune commande trouvée</p>
                          <p className="text-sm mb-4">
                            Aucune commande ne correspond aux critères de recherche.
                            {statusFilter && ` Statut: ${statusFilter}`}
                            {dateFilter && ` Date: ${new Date(dateFilter).toLocaleDateString()}`}
                            {searchQuery && ` Recherche: "${searchQuery}"`}
                          </p>
                          <button
                            onClick={clearAllFilters}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <XIcon className="h-4 w-4" />
                            <span>Voir toutes les commandes</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-medium mb-2">Aucune commande trouvée</p>
                          <p className="text-sm">Aucune commande ne correspond à votre recherche.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                      title={`View order ${order.id}`}
                    >
                      {order.id.length > 12 ? `${order.id.substring(0, 12)}...` : order.id}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.shipping_address?.name || 'Unknown Customer'}
                    </div>
                    {!order.user_id && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full inline-block mt-1">
                        {t('orders.guest_order')}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.total.toFixed(2) } FCFA
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${ORDER_STATUS_CONFIG[order.status]?.color || 'text-gray-600'}`}>
                        <span className="text-lg">{ORDER_STATUS_CONFIG[order.status]?.emoji || '📋'}</span>
                        <span className="text-sm font-medium">{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500"
                      >
                        <option value="pending">{t('pending')}</option>
                        <option value="processing">{t('processing')}</option>
                        <option value="shipped">{t('shipped')}</option>
                        <option value="delivered">{t('delivered')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium flex gap-2 items-center">
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title={t('orders.view_details')}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title={t('orders.delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default Orders;