import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ShippingAgencyForm from './ShippingAgencyForm';

export default function DeliveryForm({ supplierOrderId, delivery, onSaved, onClose }) {
  const isEdit = !!delivery;
  const [form, setForm] = useState({
    shipping_agency_id: '',
    type: 'air',
    is_express: false,
    weight_kg: '',
    cbm: '',
    shipping_fees_xof: '',
    other_fees_xof: '',
    send_date: '',
    receive_date: '',
    tracking_number: '',
    status: '',
    notes: ''
  });
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [showAgencyModal, setShowAgencyModal] = useState(false);

  useEffect(() => {
    fetchAgencies();
    if (delivery) {
      // S'assurer que toutes les valeurs sont des chaînes vides au lieu de null
      setForm({
        shipping_agency_id: delivery.shipping_agency_id || '',
        type: delivery.type || 'air',
        is_express: delivery.is_express || false,
        weight_kg: delivery.weight_kg?.toString() || '',
        cbm: delivery.cbm?.toString() || '',
        shipping_fees_xof: delivery.shipping_fees_xof?.toString() || '',
        other_fees_xof: delivery.other_fees_xof?.toString() || '',
        send_date: delivery.send_date || '',
        receive_date: delivery.receive_date || '',
        tracking_number: delivery.tracking_number || '',
        status: delivery.status || '',
        notes: delivery.notes || ''
      });
    }
  }, [delivery]);

  const fetchAgencies = async () => {
    const { data } = await supabase.from('shipping_agencies').select('*').order('name');
    setAgencies(data || []);
  };

  const handleAgencyCreated = (newAgency) => {
    setShowAgencyModal(false);
    fetchAgencies().then(() => {
      setForm(f => ({ ...f, shipping_agency_id: newAgency.id }));
      setSelectedAgency(newAgency);
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newForm = { ...form, [name]: type === 'checkbox' ? checked : value };
    
    // Si on change l'agence, récupérer ses informations
    if (name === 'shipping_agency_id') {
      const agency = agencies.find(ag => ag.id === value);
      setSelectedAgency(agency);
    }
    
    setForm(newForm);
    
    // Calculer automatiquement les frais d'expédition
    calculateShippingFees(newForm, name === 'shipping_agency_id' ? agencies.find(ag => ag.id === value) : selectedAgency);
  };

  const calculateShippingFees = (formData, agency) => {
    if (!agency) return;
    
    let calculatedFees = 0;
    
    if (formData.type === 'air' && formData.weight_kg) {
      calculatedFees = parseFloat(formData.weight_kg) * parseFloat(agency.air_price_per_kg || 0);
    } else if (formData.type === 'sea' && formData.cbm) {
      calculatedFees = parseFloat(formData.cbm) * parseFloat(agency.sea_price_per_cbm || 0);
    } else if (formData.type === 'express' && formData.weight_kg) {
      // Use the express cost per kg if available, otherwise fallback to air price with multiplier
      const expressPrice = agency.express_cost_per_kg || (agency.air_price_per_kg * 1.5);
      calculatedFees = parseFloat(formData.weight_kg) * parseFloat(expressPrice || 0);
    }
    
    // Apply express multiplier only if it's not already an express delivery type
    if (formData.is_express && formData.type !== 'express') {
      calculatedFees *= 1.3; // 30% supplement for express
    }
    
    setForm(prev => ({
      ...prev,
      shipping_fees_xof: calculatedFees > 0 ? calculatedFees.toFixed(2) : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Préparer les données pour l'envoi
    const cleanedForm = {
      shipping_agency_id: form.shipping_agency_id || null,
      type: form.type,
      is_express: form.is_express,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      cbm: form.cbm ? parseFloat(form.cbm) : null,
      shipping_fees_xof: form.shipping_fees_xof ? parseFloat(form.shipping_fees_xof) : null,
      other_fees_xof: form.other_fees_xof ? parseFloat(form.other_fees_xof) : null,
      send_date: form.send_date || null,
      receive_date: form.receive_date || null,
      tracking_number: form.tracking_number || null,
      status: form.status || null,
      notes: form.notes || null,
      supplier_order_id: supplierOrderId
    };
    
    let error = null;
    if (isEdit) {
      ({ error } = await supabase.from('deliveries').update(cleanedForm).eq('id', delivery.id));
    } else {
      ({ error } = await supabase.from('deliveries').insert([cleanedForm]));
    }
    
    if (error) {
      console.error('Erreur Supabase:', error);
      setError('Erreur lors de la sauvegarde de la livraison');
      setLoading(false);
      return;
    }
    
    setLoading(false);
    onSaved();
    if (onClose) onClose();
  };

  const getTotalFees = () => {
    const shipping = parseFloat(form.shipping_fees_xof) || 0;
    const other = parseFloat(form.other_fees_xof) || 0;
    return (shipping + other).toFixed(2);
  };

  return (
    <div
      className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-4 lg:p-6 relative max-h-[80vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
      tabIndex={-1}
    >
      <h2 id="delivery-modal-title" className="text-lg lg:text-xl font-bold mb-4">{isEdit ? 'Éditer Livraison' : 'Nouvelle Livraison'}</h2>
      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Agence d'expédition <span className="text-red-500">*</span></label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <select name="shipping_agency_id" value={form.shipping_agency_id} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" required>
              <option value="">Sélectionner une agence</option>
              {agencies.map(ag => (
                <option key={ag.id} value={ag.id}>{ag.name}</option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-primary w-full sm:w-auto text-sm" onClick={() => setShowAgencyModal(true)}>
              + Nouvelle agence
            </button>
          </div>
          {selectedAgency && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs lg:text-sm">
              <p><strong>Prix Air:</strong> {selectedAgency.air_price_per_kg} F CFA/kg</p>
              <p><strong>Prix Maritime:</strong> {selectedAgency.sea_price_per_cbm} F CFA/CBM</p>
              <p><strong>Prix Express:</strong> {selectedAgency.express_cost_per_kg} F CFA/kg</p>
              <p><strong>Téléphone:</strong> {selectedAgency.phone}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Type de fret</label>
          <select name="type" value={form.type} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base">
            <option value="air">Air</option>
            <option value="sea">Maritime</option>
            <option value="express">Express</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_express" checked={form.is_express} onChange={handleChange} id="is_express" className="mr-2" />
          <label htmlFor="is_express" className="font-medium text-sm lg:text-base">Livraison express (+30%)</label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Poids (kg)</label>
            <input type="number" name="weight_kg" value={form.weight_kg} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" step="0.01" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">CBM (si maritime)</label>
            <input type="number" name="cbm" value={form.cbm} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" step="0.01" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Frais d'expédition (F CFA)</label>
            <input type="number" name="shipping_fees_xof" value={form.shipping_fees_xof} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" step="0.01" />
            <p className="text-xs text-gray-500 mt-1">Calculé automatiquement selon le poids/CBM et l'agence</p>
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Autres frais (F CFA)</label>
            <input type="number" name="other_fees_xof" value={form.other_fees_xof} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" step="0.01" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Date d'envoi</label>
            <input type="date" name="send_date" value={form.send_date} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Date de réception</label>
            <input type="date" name="receive_date" value={form.receive_date} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Numéro de suivi</label>
          <input type="text" name="tracking_number" value={form.tracking_number} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Statut</label>
          <select name="status" value={form.status} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base">
            <option value="">Sélectionner un statut</option>
            <option value="En cours">En cours</option>
            <option value="Livré">Livré</option>
            <option value="Retardé">Retardé</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" rows="3"></textarea>
        </div>
        
        {getTotalFees() > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm lg:text-base font-medium text-blue-900">
              Total des frais: <span className="text-lg">{getTotalFees()} F CFA</span>
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <button type="button" className="btn btn-outline w-full sm:w-auto text-sm lg:text-base" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary w-full sm:w-auto text-sm lg:text-base" disabled={loading}>
            {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
          </button>
        </div>
      </div>
      
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