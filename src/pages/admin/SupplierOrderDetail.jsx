import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SupplierOrderForm from './SupplierOrderForm';
import DeliveryForm from './DeliveryForm';
import ShippingAgencyForm from './ShippingAgencyForm';

export default function SupplierOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [editDelivery, setEditDelivery] = useState(null);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    
    // Récupérer la commande
    const { data: orderData } = await supabase
      .from('supplier_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (orderData) {
      setOrder(orderData);
      
      // Récupérer les produits
      const { data: itemsData } = await supabase
        .from('supplier_order_items')
        .select('*')
        .eq('supplier_order_id', id)
        .order('created_at');
      
      setItems(itemsData || []);
      
      // Récupérer les livraisons
      const { data: deliveriesData } = await supabase
        .from('deliveries')
        .select(`
          *,
          shipping_agencies (
            id,
            name,
            phone,
            air_price_per_kg,
            sea_price_per_cbm,
            express_cost_per_kg
          )
        `)
        .eq('supplier_order_id', id)
        .order('created_at', { ascending: false });
      
      setDeliveries(deliveriesData || []);
    }
    
    setLoading(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Supprimer ce produit ?')) {
      await supabase.from('supplier_order_items').delete().eq('id', itemId);
      fetchOrderDetails();
    }
  };

  const handleDeleteDelivery = async (deliveryId) => {
    if (window.confirm('Supprimer cette livraison ?')) {
      await supabase.from('deliveries').delete().eq('id', deliveryId);
      fetchOrderDetails();
    }
  };

  const handleDeliverySaved = () => {
    setShowDeliveryModal(false);
    setEditDelivery(null);
    fetchOrderDetails();
  };

  const handleOrderSaved = () => {
    setShowEditForm(false);
    fetchOrderDetails();
  };

  const handleAgencyCreated = (newAgency) => {
    setShowAgencyModal(false);
    fetchOrderDetails();
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const price = parseFloat(item.unit_price_usd) || 0;
      return total + (quantity * price);
    }, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 mb-4">La commande que vous recherchez n'existe pas.</p>
          <button 
            onClick={() => navigate('/admin/supplier-orders')}
            className="btn btn-primary"
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div>
          <button 
            onClick={() => navigate('/admin/supplier-orders')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux commandes
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Commande du {new Date(order.order_date).toLocaleDateString('fr-FR')}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowEditForm(true)}
            className="btn btn-secondary w-full sm:w-auto"
          >
            Éditer la commande
          </button>
          <button 
            onClick={() => setShowAgencyModal(true)}
            className="btn btn-outline w-full sm:w-auto"
          >
            + Nouvelle Agence
          </button>
          <button 
            onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
            className="btn btn-primary w-full sm:w-auto"
          >
            + Ajouter une livraison
          </button>
        </div>
      </div>

      {/* Informations générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h3 className="text-lg font-semibold mb-3 lg:mb-4">Informations générales</h3>
          <div className="space-y-2 lg:space-y-3">
            <div>
              <span className="text-sm text-gray-500">Date de commande:</span>
              <p className="font-medium">{new Date(order.order_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Montant total:</span>
              <p className="font-medium text-lg lg:text-xl text-green-600">${parseFloat(order.total_amount_usd).toFixed(2)} USD</p>
            </div>
            {order.notes && (
              <div>
                <span className="text-sm text-gray-500">Notes:</span>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h3 className="text-lg font-semibold mb-3 lg:mb-4">Résumé produits</h3>
          <div className="space-y-2 lg:space-y-3">
            <div>
              <span className="text-sm text-gray-500">Nombre de produits:</span>
              <p className="font-medium">{items.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Quantité totale:</span>
              <p className="font-medium">{getTotalItems()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Valeur totale:</span>
              <p className="font-medium text-lg lg:text-xl text-blue-600">${getTotalValue().toFixed(2)} USD</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Livraisons</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Nombre de livraisons:</span>
              <p className="font-medium">{deliveries.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Livrées:</span>
              <p className="font-medium text-green-600">
                {deliveries.filter(d => d.status === 'Livré').length}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">En cours:</span>
              <p className="font-medium text-orange-600">
                {deliveries.filter(d => d.status !== 'Livré' && d.status !== 'Annulé').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white rounded-lg shadow mb-6 lg:mb-8">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Produits commandés</h2>
            <button 
              onClick={() => setShowEditForm(true)}
              className="btn btn-sm btn-primary w-full sm:w-auto"
            >
              + Ajouter un produit
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                    Aucun produit dans cette commande
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">{item.product_name}</p>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.product_name} className="w-8 h-8 lg:w-12 lg:h-12 object-cover rounded mt-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      ${parseFloat(item.unit_price_usd).toFixed(2)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-medium text-gray-900">
                      ${(parseFloat(item.unit_price_usd) * parseInt(item.quantity)).toFixed(2)}
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Livraisons */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Livraisons</h2>
            <button 
              onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
              className="btn btn-sm btn-primary w-full sm:w-auto"
            >
              + Ajouter une livraison
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agence</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poids/CBM</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frais</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                    Aucune livraison pour cette commande
                  </td>
                </tr>
              ) : (
                deliveries.map(delivery => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">{delivery.shipping_agencies?.name || '-'}</p>
                        <p className="text-sm text-gray-500">{delivery.shipping_agencies?.phone || ''}</p>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        delivery.type === 'air' ? 'bg-blue-100 text-blue-800' :
                        delivery.type === 'sea' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {delivery.type}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        delivery.status === 'Livré' ? 'bg-green-100 text-green-800' :
                        delivery.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'Retardé' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {delivery.status || '-'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {delivery.weight_kg && `${delivery.weight_kg} kg`}
                      {delivery.cbm && `${delivery.cbm} CBM`}
                      {!delivery.weight_kg && !delivery.cbm && '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {delivery.shipping_fees_xof && `${parseFloat(delivery.shipping_fees_xof).toFixed(0)} F CFA`}
                      {!delivery.shipping_fees_xof && '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      <div>
                        {delivery.send_date && (
                          <p>Envoi: {new Date(delivery.send_date).toLocaleDateString('fr-FR')}</p>
                        )}
                        {delivery.receive_date && (
                          <p>Réception: {new Date(delivery.receive_date).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => { setEditDelivery(delivery); setShowDeliveryModal(true); }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeleteDelivery(delivery.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
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

      {/* Modals */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowEditForm(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <SupplierOrderForm 
              order={order} 
              onClose={handleOrderSaved} 
            />
          </div>
        </div>
      )}

      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
            <button 
              onClick={() => { setShowDeliveryModal(false); setEditDelivery(null); }} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <DeliveryForm 
              supplierOrderId={id} 
              delivery={editDelivery} 
              onSaved={handleDeliverySaved} 
              onClose={() => { setShowDeliveryModal(false); setEditDelivery(null); }} 
            />
          </div>
        </div>
      )}

      {showAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
            <button 
              onClick={() => setShowAgencyModal(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <ShippingAgencyForm 
              onCreated={handleAgencyCreated}
              onClose={() => setShowAgencyModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 