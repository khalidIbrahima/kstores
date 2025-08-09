import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import ShippingAgencyForm from './ShippingAgencyForm';
import DeliveryForm from './DeliveryForm';

const emptyItem = { product_name: '', unit_price_usd: '', quantity: '', image_url: '' };

export default function SupplierOrderForm({ order, onClose }) {
  const isEdit = !!order;
  const [form, setForm] = useState({
    order_date: '',
    total_amount_usd: '',
    bank_fees_usd: '',
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (idx, e) => {
    const items = [...form.items];
    items[idx][e.target.name] = e.target.value;
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
    const { items, ...orderData } = form;
    let orderId = order?.id;
    let error = null;
    if (!form.order_date || !form.total_amount_usd || form.items.some(i => !i.product_name || !i.unit_price_usd || !i.quantity)) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      setLoading(false);
      return;
    }
    if (isEdit) {
      ({ error } = await supabase
        .from('supplier_orders')
        .update(orderData)
        .eq('id', orderId));
      await supabase.from('supplier_order_items').delete().eq('supplier_order_id', orderId);
    } else {
      const { data, error: insertError } = await supabase
        .from('supplier_orders')
        .insert([orderData])
        .select('id')
        .single();
      error = insertError;
      orderId = data?.id;
    }
    if (error) {
      setErrorMsg('Erreur lors de la sauvegarde de la commande');
      setLoading(false);
      return;
    }
    for (const item of items) {
      await supabase.from('supplier_order_items').insert({
        supplier_order_id: orderId,
        ...item
      });
    }
    setLoading(false);
    onClose(true);
  };

  return (
    <div
      ref={modalRef}
      className="max-w-2xl mx-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 id="modal-title" className="text-2xl font-bold text-primary">{isEdit ? 'Éditer' : 'Nouvelle'} Commande Fournisseur</h1>
        <button
          onClick={() => onClose(false)}
          className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
          aria-label="Fermer"
        >
          &times;
        </button>
      </div>
      {errorMsg && <div className="text-red-600 font-medium mb-2">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
        <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <legend className="font-semibold text-lg text-gray-700 px-2">Informations générales</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Date commande <span className="text-red-500">*</span></label>
              <input type="date" name="order_date" value={form.order_date} onChange={handleChange} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary w-full" required />
            </div>
            <div>
              <label className="block font-medium mb-1">Montant total (USD) <span className="text-red-500">*</span></label>
              <input type="number" name="total_amount_usd" value={form.total_amount_usd} onChange={handleChange} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary w-full" min="0" required />
            </div>
            <div>
              <label className="block font-medium mb-1">Frais de transaction (USD)</label>
              <input type="number" name="bank_fees_usd" value={form.bank_fees_usd} onChange={handleChange} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary w-full" min="0" step="0.01" />
            </div>
            <div className="col-span-2">
              <label className="block font-medium mb-1">Image (URL)</label>
              <input type="text" name="image_url" value={form.image_url} onChange={handleChange} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary w-full" />
            </div>
            <div className="col-span-2">
              <label className="block font-medium mb-1">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary w-full" />
            </div>
          </div>
        </fieldset>
        <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <legend className="font-semibold text-lg text-gray-700 px-2">Produits inclus <span className="text-red-500">*</span></legend>
          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-center bg-white rounded shadow-sm p-2 hover:bg-blue-50">
                <input type="text" name="product_name" placeholder="Nom du produit" value={item.product_name} onChange={e => handleItemChange(idx, e)} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary" required />
                <input type="number" name="unit_price_usd" placeholder="Prix unitaire (USD)" value={item.unit_price_usd} onChange={e => handleItemChange(idx, e)} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary" min="0" step="0.01" required />
                <input type="number" name="quantity" placeholder="Quantité" value={item.quantity} onChange={e => handleItemChange(idx, e)} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary" min="1" required />
                <input type="text" name="image_url" placeholder="Image (URL)" value={item.image_url} onChange={e => handleItemChange(idx, e)} className="input input-bordered rounded-lg shadow-sm focus:ring-2 focus:ring-primary" />
                <div className="flex gap-1">
                  <button type="button" onClick={() => addItem()} className="btn btn-xs btn-secondary rounded-full" title="Ajouter une ligne">+</button>
                  <button type="button" onClick={() => removeItem(idx)} className="btn btn-xs btn-danger rounded-full" title="Supprimer" disabled={form.items.length === 1}>-</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="btn btn-primary w-full mt-2 rounded-lg">+ Ajouter un produit</button>
        </fieldset>
        {order?.id && (
          <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-8">
            <legend className="font-semibold text-lg text-gray-700 px-2">Livraisons</legend>
            <div className="flex justify-end mb-2">
              <button type="button" className="btn btn-primary" onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}>+ Ajouter une livraison</button>
            </div>
            <table className="min-w-full bg-white border rounded shadow text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">Agence</th>
                  <th className="px-2 py-1 border">Type</th>
                  <th className="px-2 py-1 border">Statut</th>
                  <th className="px-2 py-1 border">Envoi</th>
                  <th className="px-2 py-1 border">Réception</th>
                  <th className="px-2 py-1 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-2 text-gray-400">Aucune livraison</td></tr>
                ) : deliveries.map(delivery => (
                  <tr key={delivery.id}>
                    <td className="px-2 py-1 border">{delivery.shipping_agencies?.name || ''}</td>
                    <td className="px-2 py-1 border">{delivery.type}</td>
                    <td className="px-2 py-1 border">{delivery.status}</td>
                    <td className="px-2 py-1 border">{delivery.send_date || '-'}</td>
                    <td className="px-2 py-1 border">{delivery.receive_date || '-'}</td>
                    <td className="px-2 py-1 border flex gap-2">
                      <button type="button" className="btn btn-xs btn-secondary" onClick={() => handleEditDelivery(delivery)}>Éditer</button>
                      <button type="button" className="btn btn-xs btn-danger" onClick={() => handleDeleteDelivery(delivery.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {showDeliveryModal && (
              <DeliveryForm 
                supplierOrderId={order.id} 
                delivery={editDelivery} 
                onSaved={handleDeliverySaved} 
                onClose={() => { setShowDeliveryModal(false); setEditDelivery(null); }} 
              />
            )}
          </fieldset>
        )}
        <div className="flex justify-end gap-4 sticky bottom-0 bg-white py-4 border-t border-gray-200">
          <button type="button" className="btn btn-outline rounded-lg" onClick={() => onClose(false)}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary rounded-lg px-8" disabled={loading}>
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-t-2 border-blue-500 rounded-full"></span>
            ) : isEdit ? 'Enregistrer les modifications' : 'Enregistrer la commande'}
          </button>
        </div>
      </form>
    </div>
  );
} 