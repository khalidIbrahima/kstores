import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SupplierOrderForm from './SupplierOrderForm';
import { useNavigate } from 'react-router-dom';

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('supplier_orders')
      .select('*')
      .order('order_date', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const handleEditOrder = (order) => {
    setEditOrder(order);
    setShowForm(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Supprimer cette commande ?')) {
      await supabase.from('supplier_order_items').delete().eq('supplier_order_id', orderId);
      await supabase.from('deliveries').delete().eq('supplier_order_id', orderId);
      await supabase.from('supplier_orders').delete().eq('id', orderId);
      fetchOrders();
    }
  };

  const handleOrderClick = (order) => {
    navigate(`/admin/supplier-orders/${order.id}`);
  };

  if (loading) return <div className="text-center py-8 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 min-h-screen">Chargement...</div>;

  return (
    <div className="container mx-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Commandes Fournisseurs</h1>
        <button onClick={() => { setEditOrder(null); setShowForm(true); }} className="btn btn-primary w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md">
          + Nouvelle Commande
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Titre</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Commande</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Montant (USD)</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Frais transition (USD)</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 lg:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(order.order_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {order.title || 'Sans titre'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100" onClick={(e) => e.stopPropagation()}>
                      {order.order_number ? (
                        <a 
                          href={`https://biz.alibaba.com/ta/detail.htm?spm=a2756.trade-list-buyer.0.0.257576e9lMBpKE&orderId=${order.order_number}&tracelog=from_orderlist_dropdown`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                        >
                          {order.order_number}
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.total_amount_usd).toFixed(2)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.bank_fees_usd?.toFixed(2)) || '0.00'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {order.notes || '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2 py-1 rounded text-xs"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 py-1 rounded text-xs"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-2 lg:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-xl shadow-2xl dark:shadow-black/50 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-[75vw] lg:max-w-[70vw] xl:max-w-[65vw] 2xl:max-w-[60vw] overflow-hidden relative flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-none sm:rounded-t-xl">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {editOrder ? 'Modifier' : 'Nouvelle'} Commande Fournisseur
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Gestion des commandes fournisseurs
                </p>
              </div>
              <button 
                onClick={() => { setShowForm(false); setEditOrder(null); }} 
                className="p-2 sm:p-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-4"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <SupplierOrderForm 
                order={editOrder} 
                onClose={(refresh) => { 
                  setShowForm(false); 
                  setEditOrder(null); 
                  if (refresh) fetchOrders(); 
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 