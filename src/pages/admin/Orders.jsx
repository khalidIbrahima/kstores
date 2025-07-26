import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, X, Trash2, Plus, Filter, X as XIcon, Calendar, SortAsc, SortDesc } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import OrderLocationMap from '../../components/OrderLocationMap';
import QRCode from 'react-qr-code';
import { useTranslation } from 'react-i18next';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import { useNavigate, useLocation } from 'react-router-dom';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success('Order status updated successfully');
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
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
          <p className="text-gray-600">{t('orders.manage_customer_orders')}</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => navigate('/admin/create-order')}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
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
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          {sortOrder === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
          <span>Date {sortOrder === 'asc' ? '↑' : '↓'}</span>
        </button>
      </div>

      {/* Active Filters Display */}
      {(statusFilter || dateFilter || searchQuery) && (
        <div className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Filter className="h-5 w-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Filtres actifs :</span>
          
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Statut: {statusFilter}
              <button
                onClick={clearStatusFilter}
                className="ml-1 hover:text-blue-600"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {dateFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Date: {new Date(dateFilter).toLocaleDateString()}
              <button
                onClick={clearDateFilter}
                className="ml-1 hover:text-green-600"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              Recherche: "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:text-purple-600"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
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
        <div className="overflow-x-auto rounded-lg bg-white shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('order_id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('total')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
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
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.shipping_address?.name || 'Unknown Customer'}
                    </div>
                    {!order.user_id && (
                      <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full inline-block mt-1">
                        {t('orders.guest_order')}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.total.toFixed(2) } FCFA
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="pending">{t('pending')}</option>
                      <option value="processing">{t('processing')}</option>
                      <option value="shipped">{t('shipped')}</option>
                      <option value="delivered">{t('delivered')}</option>
                      <option value="cancelled">{t('cancelled')}</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium flex gap-2 items-center">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title={t('orders.view_details')}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900"
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

      {showModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => {
          setShowModal(false);
          setSelectedOrder(null);
        }} />
      )}
    </div>
  );
};

export default Orders;