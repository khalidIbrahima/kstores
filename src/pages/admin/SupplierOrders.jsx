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

  if (loading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Commandes Fournisseurs</h1>
        <button onClick={() => { setEditOrder(null); setShowForm(true); }} className="btn btn-primary w-full sm:w-auto">
          + Nouvelle Commande
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant (USD)</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frais transition (USD)</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(order.order_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(order.total_amount_usd).toFixed(2)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(order.bank_fees_usd?.toFixed(2)) || '0.00'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {order.notes || '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded text-xs"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => { setShowForm(false); setEditOrder(null); }} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
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
      )}
    </div>
  );
} 