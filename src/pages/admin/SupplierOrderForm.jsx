import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import ShippingAgencyForm from './ShippingAgencyForm';
import DeliveryForm from './DeliveryForm';

const emptyItem = { product_name: '', unit_price_usd: '', quantity: '', unit_weight: '', unit_cbm: '', image_url: '' };

export default function SupplierOrderForm({ order, onClose }) {
  const isEdit = !!order;
  const [form, setForm] = useState({
    order_date: '',
    title: '',
    order_number: '',
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
        title: order.title || '',
        order_number: order.order_number || '',
        total_amount_usd: order.total_amount_usd ? order.total_amount_usd.toString() : '',
        bank_fees_usd: order.bank_fees_usd ? order.bank_fees_usd.toString() : '',
        shipping_fees_usd: order.shipping_fees_usd ? order.shipping_fees_usd.toString() : '',
        usd_xof_value: order.usd_xof_value ? order.usd_xof_value.toString() : '',
        image_url: order.image_url || '',
        notes: order.notes || '',
        items: []
      });
      fetchItems(order.id);
      fetchDeliveries(order.id);
    } else {
      // Reset form when no order (new order)
      setForm({
        order_date: '',
        title: '',
        order_number: '',
        total_amount_usd: '',
        bank_fees_usd: '',
        shipping_fees_usd: '',
        usd_xof_value: '',
        image_url: '',
        notes: '',
        items: [ { ...emptyItem } ]
      });
      setErrorMsg('');
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
    
    // Convert numeric fields to strings for form inputs
    const processedItems = data && data.length ? data.map(item => ({
      ...item,
              unit_price_usd: item.unit_price_usd ? item.unit_price_usd.toString() : '',
        quantity: item.quantity ? item.quantity.toString() : '',
        unit_weight: item.unit_weight ? item.unit_weight.toString() : '',
        unit_cbm: item.unit_cbm ? item.unit_cbm.toString() : ''
    })) : [ { ...emptyItem } ];
    
    setForm(f => ({ ...f, items: processedItems }));
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
    
    // Handle numeric fields - store as string for input, will be converted on submit
    if (['total_amount_usd', 'bank_fees_usd', 'shipping_fees_usd', 'usd_xof_value'].includes(name)) {
      // Allow empty string or valid numbers
      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
        setForm({ ...form, [name]: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    const items = [...form.items];
    
    // Handle numeric fields in items - store as string for input
    if (['unit_price_usd', 'quantity', 'unit_weight', 'unit_cbm'].includes(name)) {
      if (name === 'quantity') {
        // Allow empty string or valid positive integers
        if (value === '' || (!isNaN(parseInt(value)) && parseInt(value) > 0)) {
          items[idx][name] = value;
        }
      } else {
        // Allow empty string or valid positive numbers
        if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
          items[idx][name] = value;
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
      total_amount_usd: (form.total_amount_usd && form.total_amount_usd !== '') ? parseFloat(form.total_amount_usd) : null,
      bank_fees_usd: (form.bank_fees_usd && form.bank_fees_usd !== '') ? parseFloat(form.bank_fees_usd) : 0,
      shipping_fees_usd: (form.shipping_fees_usd && form.shipping_fees_usd !== '') ? parseFloat(form.shipping_fees_usd) : 0,
      usd_xof_value: (form.usd_xof_value && form.usd_xof_value !== '') ? parseFloat(form.usd_xof_value) : null,
      items: form.items.map(item => ({
        ...item,
        unit_price_usd: (item.unit_price_usd && item.unit_price_usd !== '') ? parseFloat(item.unit_price_usd) : null,
        quantity: (item.quantity && item.quantity !== '') ? parseInt(item.quantity) : null,
        unit_weight: (item.unit_weight && item.unit_weight !== '') ? parseFloat(item.unit_weight) : null,
        unit_cbm: (item.unit_cbm && item.unit_cbm !== '') ? parseFloat(item.unit_cbm) : null
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
          unit_cbm: item.unit_cbm || null,
          image_url: item.image_url || null
        });
        
        if (itemError) throw itemError;
      }
      
      setLoading(false);
      
      // Reset form state after successful save
      setForm({
        order_date: '',
        title: '',
        order_number: '',
        total_amount_usd: '',
        bank_fees_usd: '',
        shipping_fees_usd: '',
        usd_xof_value: '',
        image_url: '',
        notes: '',
        items: [ { ...emptyItem } ]
      });
      setErrorMsg('');
      
      onClose(true);
    } catch (err) {
      console.error('Error saving order:', err);
      setErrorMsg(`Erreur lors de la sauvegarde: ${err.message || 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900">
        {/* Error Message */}
        {errorMsg && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            <span className="text-red-700 dark:text-red-400 text-sm sm:text-base">{errorMsg}</span>
          </div>
          </div>
        )}

        {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <form id="supplier-order-form" onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            
            {/* General Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informations générales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Date commande <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="order_date" 
                    value={form.order_date} 
                    onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                    required 
                  />
                </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Titre de la commande
                </label>
                <input 
                  type="text" 
                  name="title" 
                  value={form.title} 
                  onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                  placeholder="Ex: Commande smartphones iPhone"
                />
              </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Numéro de commande Alibaba
                </label>
                <input 
                  type="text" 
                  name="order_number" 
                  value={form.order_number} 
                  onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                  placeholder="Ex: 274578047001029792"
                />
              </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                    Montant total (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">$</span>
                    <input 
                      type="number" 
                      name="total_amount_usd" 
                      value={form.total_amount_usd} 
                      onChange={handleChange} 
                    className="w-full pl-8 pr-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
                      min="0.01" 
                      step="0.01"
                      placeholder="0.00"
                      required 
                    />
                  </div>
                </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Frais bancaires (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">$</span>
                  <input 
                    type="number" 
                    name="bank_fees_usd" 
                    value={form.bank_fees_usd} 
                    onChange={handleChange} 
                    className="w-full pl-8 pr-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                    min="0" 
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Frais de livraison (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">$</span>
                  <input 
                    type="number" 
                    name="shipping_fees_usd" 
                    value={form.shipping_fees_usd} 
                    onChange={handleChange} 
                    className="w-full pl-8 pr-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                    min="0" 
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Taux USD → CFA <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  name="usd_xof_value" 
                  value={form.usd_xof_value} 
                  onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
                  min="0.01" 
                  step="0.01" 
                  placeholder="620" 
                  required 
                />
              </div>
                
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Image (URL)
                </label>
                <input 
                  type="url" 
                  name="image_url" 
                  value={form.image_url} 
                  onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>
                
              <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors resize-none" 
                  rows="3"
                  placeholder="Notes sur cette commande..."
                />
              </div>
              </div>
            </div>

            {/* Products */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                  Produits ({form.items.filter(i => i.product_name).length})
                </h2>
                <button 
                  type="button" 
                  onClick={addItem} 
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full sm:w-auto flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Ajouter un produit</span>
                <span className="sm:hidden">Ajouter</span>
                </button>
              </div>
              
            <div className="space-y-4 sm:space-y-6">
                {form.items.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-4 sm:p-6 shadow-sm dark:shadow-md">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Product Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        Produit #{idx + 1}
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => addItem()} 
                          className="px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white text-xs sm:text-sm rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-1"
                          title="Ajouter un produit"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="hidden sm:inline">Ajouter</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx)} 
                          className="px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center gap-1"
                          title="Supprimer ce produit"
                          disabled={form.items.length === 1}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Product Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Product Name */}
                      <div className="sm:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Nom du produit
                        </label>
                        <input 
                          type="text" 
                          name="product_name" 
                          placeholder="Nom du produit" 
                          value={item.product_name} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                        />
                      </div>
                      
                      {/* Price */}
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Prix USD
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                          <input 
                            type="number" 
                            name="unit_price_usd" 
                            placeholder="0.00" 
                            value={item.unit_price_usd} 
                            onChange={e => handleItemChange(idx, e)} 
                            className="w-full pl-8 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
                            min="0" 
                            step="0.01" 
                          />
                        </div>
                      </div>
                      
                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Quantité
                        </label>
                        <input 
                          type="number" 
                          name="quantity" 
                          placeholder="1" 
                          value={item.quantity} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors"
                          min="1" 
                        />
                      </div>
                      
                      {/* Weight */}
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Poids (kg)
                        </label>
                        <input 
                          type="number" 
                          name="unit_weight" 
                          placeholder="0.5" 
                          value={item.unit_weight} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                          min="0" 
                          step="0.01"
                        />
                      </div>
                      
                      {/* CBM */}
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Volume (CBM)
                        </label>
                        <input 
                          type="number" 
                          name="unit_cbm" 
                          placeholder="0.1" 
                          value={item.unit_cbm} 
                          onChange={e => handleItemChange(idx, e)} 
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                          min="0" 
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    {/* Image URL */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Image (URL)
                      </label>
                      <input 
                        type="url" 
                        name="image_url" 
                        placeholder="https://example.com/image.jpg" 
                        value={item.image_url} 
                        onChange={e => handleItemChange(idx, e)} 
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors" 
                      />
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliveries */}
            {order?.id && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Livraisons ({deliveries.length})
                  </h2>
                  <button 
                    type="button" 
                    onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
                    className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    + Ajouter
                  </button>
                </div>
                
                {deliveries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Aucune livraison</p>
                    <button 
                      type="button" 
                      onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
                      className="mt-2 px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Ajouter la première livraison
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 overflow-hidden">
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Agence</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Statut</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Coût</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
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
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span className="text-red-500">*</span> Champs obligatoires • {form.items.filter(i => i.product_name && i.unit_price_usd && i.quantity).length} produits valides
            </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={() => {
                  // Reset form state when canceling
                  setForm({
                    order_date: '',
                    title: '',
                    order_number: '',
                    total_amount_usd: '',
                    bank_fees_usd: '',
                    shipping_fees_usd: '',
                    usd_xof_value: '',
                    image_url: '',
                    notes: '',
                    items: [ { ...emptyItem } ]
                  });
                  setErrorMsg('');
                  onClose(false);
                }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
                Annuler
              </button>
              <button 
                type="submit" 
                form="supplier-order-form"
                disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEdit ? 'Modifier' : 'Créer'}
                </>
              )}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}