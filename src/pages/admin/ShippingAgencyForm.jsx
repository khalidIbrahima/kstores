import { useState } from 'react';
import { supabase } from '../../lib/supabase';

function cleanNumericFields(obj, numericFields) {
  const cleaned = { ...obj };
  numericFields.forEach(field => {
    if (cleaned[field] === '' || cleaned[field] === undefined) {
      cleaned[field] = null;
    }
  });
  return cleaned;
}

export default function ShippingAgencyForm({ onCreated, onClose }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    air_price_per_kg: '',
    sea_price_per_cbm: '',
    express_cost_per_kg: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!form.name) {
      setError('Le nom de l\'agence est obligatoire.');
      setLoading(false);
      return;
    }
    const numericFields = ['air_price_per_kg', 'sea_price_per_cbm', 'express_cost_per_kg'];
    const cleanedForm = cleanNumericFields(form, numericFields);
    const { data, error: err } = await supabase
      .from('shipping_agencies')
      .insert([cleanedForm])
      .select('*')
      .single();
    if (err) {
      setError('Erreur lors de la création de l\'agence.');
      setLoading(false);
      return;
    }
    setLoading(false);
    onCreated(data);
    if (onClose) onClose();
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-lg lg:text-xl font-bold mb-4">Nouvelle Agence d'expédition</h2>
      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Nom <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" required />
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Téléphone</label>
          <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Prix aérien (F/kg)</label>
            <input type="number" name="air_price_per_kg" value={form.air_price_per_kg} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm lg:text-base">Prix maritime (F/CBM)</label>
            <input type="number" name="sea_price_per_cbm" value={form.sea_price_per_cbm} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Prix express (F/kg)</label>
          <input type="number" name="express_cost_per_kg" value={form.express_cost_per_kg} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" min="0" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm lg:text-base">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="input input-bordered w-full rounded text-sm lg:text-base" rows="3"></textarea>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <button type="button" className="btn btn-outline w-full sm:w-auto text-sm lg:text-base" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary w-full sm:w-auto text-sm lg:text-base" disabled={loading}>{loading ? 'Enregistrement...' : 'Créer'}</button>
        </div>
      </form>
    </div>
  );
} 