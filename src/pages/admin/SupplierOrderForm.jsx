import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import ShippingAgencyForm from './ShippingAgencyForm';
import DeliveryForm from './DeliveryForm';

const emptyItem = { product_name: '', unit_price_usd: '', quantity: '', unit_weight: '', image_url: '' };

export default function SupplierOrderForm({ order, onClose }) {
  const isEdit = !!order;
  const [form, setForm] = useState({
    order_date: '',
    total_amount_usd: '',
    bank_fees_usd: '',
    shipping_fees_usd: '',
    usd_xof_value: '',
    image_url: '',
    notes: '',
    items: [ { ...emptyItem } ]
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editDelivery, setEditDelivery] = useState(null);
  const modalRef = useRef();

  useEffect(() => {
    if (order) {
      setForm({
        order_date: order.order_date || '',
        total_amount_usd: order.total_amount_usd || '',
        bank_fees_usd: order.bank_fees_usd || '',
        shipping_fees_usd: order.shipping_fees_usd || '',
        usd_xof_value: order.usd_xof_value || '',
        image_url: order.image_url || '',
        notes: order.notes || '',
        items: []
      });
      fetchItems(order.id);
      fetchDeliveries(order.id);
    }
    // Trap focus in modal
    const focusableEls = modalRef.current?.querySelectorAll('input, button, textarea, select, [tabindex]:not([tabindex="-1"])');
    focusableEls?.[0]?.focus();
  }, [order]);

  const fetchItems = async (orderId) => {
    const { data } = await supabase
      .from('supplier_order_items')
      .select('*')
      .eq('supplier_order_id', orderId);
    setForm(f => ({ ...f, items: data && data.length ? data : [ { ...emptyItem } ] }));
  };

  const fetchDeliveries = async (orderId) => {
    const { data } = await supabase
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
      .eq('supplier_order_id', orderId)
      .order('created_at', { ascending: false });
    setDeliveries(data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields - convert empty strings to null
    if (['total_amount_usd', 'bank_fees_usd', 'shipping_fees_usd', 'usd_xof_value'].includes(name)) {
      const numValue = value === '' ? '' : parseFloat(value);
      if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
        setForm({ ...form, [name]: value === '' ? '' : numValue.toString() });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    const items = [...form.items];
    
    // Handle numeric fields in items
    if (['unit_price_usd', 'quantity', 'unit_weight'].includes(name)) {
      if (name === 'quantity') {
        const intValue = value === '' ? '' : parseInt(value);
        if (value === '' || (!isNaN(intValue) && intValue > 0)) {
          items[idx][name] = value === '' ? '' : intValue.toString();
        }
      } else {
        const numValue = value === '' ? '' : parseFloat(value);
        if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
          items[idx][name] = value === '' ? '' : numValue.toString();
        }
      }
    } else {
      items[idx][name] = value;
    }
    
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  };

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    if (window.confirm('Supprimer ce produit ?')) {
      const items = form.items.filter((_, i) => i !== idx);
      setForm({ ...form, items });
    }
  };

  const handleDeliverySaved = () => {
    setShowDeliveryModal(false);
    setEditDelivery(null);
    fetchDeliveries(order.id);
  };

  const handleEditDelivery = (delivery) => {
    setEditDelivery(delivery);
    setShowDeliveryModal(true);
  };

  const handleDeleteDelivery = async (deliveryId) => {
    if (window.confirm('Supprimer cette livraison ?')) {
      await supabase.from('deliveries').delete().eq('id', deliveryId);
      fetchDeliveries(order.id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Clean and validate form data
    const cleanedForm = {
      ...form,
      total_amount_usd: form.total_amount_usd ? parseFloat(form.total_amount_usd) : null,
      bank_fees_usd: form.bank_fees_usd ? parseFloat(form.bank_fees_usd) : 0,
      shipping_fees_usd: form.shipping_fees_usd ? parseFloat(form.shipping_fees_usd) : 0,
      usd_xof_value: form.usd_xof_value ? parseFloat(form.usd_xof_value) : null,
      items: form.items.map(item => ({
        ...item,
        unit_price_usd: item.unit_price_usd ? parseFloat(item.unit_price_usd) : null,
        quantity: item.quantity ? parseInt(item.quantity) : null,
        unit_weight: item.unit_weight ? parseFloat(item.unit_weight) : null
      }))
    };
    
    const { items, ...orderData } = cleanedForm;
    let orderId = order?.id;
    let error = null;
    
    // Enhanced validation
    if (!cleanedForm.order_date) {
      setErrorMsg('La date de commande est obligatoire.');
      setLoading(false);
      return;
    }
    
    if (!cleanedForm.total_amount_usd || cleanedForm.total_amount_usd <= 0) {
      setErrorMsg('Le montant total doit être supérieur à 0.');
      setLoading(false);
      return;
    }
    
    if (!cleanedForm.usd_xof_value || cleanedForm.usd_xof_value <= 0) {
      setErrorMsg('Le taux de change doit être supérieur à 0.');
      setLoading(false);
      return;
    }
    
    // Validate items
    const validItems = items.filter(item => item.product_name && item.unit_price_usd && item.quantity);
    if (validItems.length === 0) {
      setErrorMsg('Au moins un produit valide est requis.');
      setLoading(false);
      return;
    }
    
    // Check for invalid items
    const invalidItems = items.filter(item => 
      (item.product_name && (!item.unit_price_usd || !item.quantity)) ||
      (!item.product_name && (item.unit_price_usd || item.quantity))
    );
    
    if (invalidItems.length > 0) {
      setErrorMsg('Veuillez remplir complètement tous les champs des produits ou supprimer les lignes vides.');
      setLoading(false);
      return;
    }
    
    try {
    if (isEdit) {
      ({ error } = await supabase
        .from('supplier_orders')
        .update(orderData)
        .eq('id', orderId));
        
        if (error) throw error;
        
        // Delete existing items
      await supabase.from('supplier_order_items').delete().eq('supplier_order_id', orderId);
    } else {
      const { data, error: insertError } = await supabase
        .from('supplier_orders')
        .insert([orderData])
        .select('id')
        .single();
        
        if (insertError) throw insertError;
      orderId = data?.id;
    }
      
      // Insert only valid items
      for (const item of validItems) {
        const { error: itemError } = await supabase.from('supplier_order_items').insert({
          supplier_order_id: orderId,
          product_name: item.product_name,
          unit_price_usd: item.unit_price_usd,
          quantity: item.quantity,
          unit_weight: item.unit_weight || null,
          image_url: item.image_url || null
        });
        
        if (itemError) throw itemError;
      }
      
      setLoading(false);
      onClose(true);
    } catch (err) {
      console.error('Error saving order:', err);
      setErrorMsg(`Erreur lors de la sauvegarde: ${err.message || 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[95vh] bg-white rounded-lg shadow-lg flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h1 id="modal-title" className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Modifier' : 'Nouvelle'} Commande Fournisseur
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {form.items.filter(i => i.product_name && i.unit_price_usd && i.quantity).length} produits valides
            </p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="supplier-order-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-base font-medium text-gray-900 mb-4">Informations générales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date commande <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="order_date" 
                    value={form.order_date} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant total (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input 
                      type="number" 
                      name="total_amount_usd" 
                      value={form.total_amount_usd} 
                      onChange={handleChange} 
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0.01" 
                      step="0.01"
                      placeholder="0.00"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frais bancaires (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input 
                      type="number" 
                      name="bank_fees_usd" 
                      value={form.bank_fees_usd} 
                      onChange={handleChange} 
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      min="0" 
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frais de livraison (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input 
                      type="number" 
                      name="shipping_fees_usd" 
                      value={form.shipping_fees_usd} 
                      onChange={handleChange} 
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      min="0" 
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux USD → CFA <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    name="usd_xof_value" 
                    value={form.usd_xof_value} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0.01" 
                    step="0.01" 
                    placeholder="620" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image (URL)
                  </label>
                  <input 
                    type="url" 
                    name="image_url" 
                    value={form.image_url} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="https://exemple.com/image.jpg"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea 
                    name="notes" 
                    value={form.notes} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" 
                    rows="3"
                    placeholder="Notes sur cette commande..."
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-gray-900">
                  Produits ({form.items.filter(i => i.product_name).length})
                </h2>
                <button 
                  type="button" 
                  onClick={addItem} 
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  + Ajouter
                </button>
              </div>
              
              <div className="space-y-4">
                {form.items.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Product Name */}
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nom du produit</label>
                        <input 
                          type="text" 
                          name="product_name" 
                          placeholder="Nom du produit" 
                          value={item.product_name} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                        />
                      </div>
                      
                      {/* Price */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Prix USD</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                          <input 
                            type="number" 
                            name="unit_price_usd" 
                            placeholder="0.00" 
                            value={item.unit_price_usd} 
                            onChange={e => handleItemChange(idx, e)} 
                            className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            min="0.01" 
                            step="0.01" 
                          />
                        </div>
                      </div>
                      
                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                        <input 
                          type="number" 
                          name="quantity" 
                          placeholder="1" 
                          value={item.quantity} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="1" 
                        />
                      </div>
                      
                      {/* Weight */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Poids (kg)</label>
                        <input 
                          type="number" 
                          name="unit_weight" 
                          placeholder="0.5" 
                          value={item.unit_weight} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                          min="0" 
                          step="0.01"
                        />
                      </div>
                      
                      {/* Actions */}
                      <div className="md:col-span-2 flex items-end gap-2">
                        <button 
                          type="button" 
                          onClick={() => addItem()} 
                          className="px-2 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                          title="Ajouter un produit"
                        >
                          +
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx)} 
                          className="px-2 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                          title="Supprimer ce produit"
                          disabled={form.items.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    {/* Image URL */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Image (URL)</label>
                      <input 
                        type="url" 
                        name="image_url" 
                        placeholder="https://exemple.com/image.jpg" 
                        value={item.image_url} 
                        onChange={e => handleItemChange(idx, e)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliveries */}
            {order?.id && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-gray-900">
                    Livraisons ({deliveries.length})
                  </h2>
                  <button 
                    type="button" 
                    onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    + Ajouter
                  </button>
                </div>
                
                {deliveries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune livraison</p>
                    <button 
                      type="button" 
                      onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Ajouter la première livraison
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Agence</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Statut</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Coût</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {deliveries.map(delivery => (
                            <tr key={delivery.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3 text-sm">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {delivery.shipping_agencies?.name || 'N/A'}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {delivery.shipping_agencies?.phone || ''}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-sm">
                                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                  {delivery.type}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  delivery.status === 'Livré' ? 'bg-green-100 text-green-800' :
                                  delivery.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {delivery.status || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm">
                                {delivery.shipping_fees_xof ? 
                                  `${parseFloat(delivery.shipping_fees_xof).toLocaleString('fr-FR')} F` : 
                                  'N/A'
                                }
                              </td>
                              <td className="px-3 py-3 text-sm">
                                <div className="flex gap-1">
                                  <button 
                                    type="button" 
                                    onClick={() => handleEditDelivery(delivery)}
                                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    Modifier
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleDeleteDelivery(delivery.id)}
                                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {showDeliveryModal && (
                  <DeliveryForm 
                    supplierOrderId={order.id} 
                    delivery={editDelivery} 
                    onSaved={handleDeliverySaved} 
                    onClose={() => { setShowDeliveryModal(false); setEditDelivery(null); }} 
                  />
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Champs obligatoires • {form.items.filter(i => i.product_name && i.unit_price_usd && i.quantity).length} produits valides
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={() => onClose(false)}
                className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                form="supplier-order-form"
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}