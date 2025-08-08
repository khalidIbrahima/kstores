import { useState, useEffect } from 'react';
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

export default function ShippingAgencyForm({ agency, onCreated, onUpdated, onClose }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    air_price_per_kg: '',
    sea_price_per_cbm: '',
    express_cost_per_kg: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pré-remplir le formulaire si on édite une agence existante
  useEffect(() => {
    if (agency) {
      setForm({
        name: agency.name || '',
        phone: agency.phone || '',
        address: agency.address || '',
        air_price_per_kg: agency.air_price_per_kg || '',
        sea_price_per_cbm: agency.sea_price_per_cbm || '',
        express_cost_per_kg: agency.express_cost_per_kg || '',
        notes: agency.notes || ''
      });
    }
  }, [agency]);

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

    try {
      let result;
      
      if (agency) {
        // Mode édition - mise à jour
        const { data, error: err } = await supabase
          .from('shipping_agencies')
          .update(cleanedForm)
          .eq('id', agency.id)
          .select('*')
          .single();
        
        if (err) throw err;
        result = data;
        
        if (onUpdated) onUpdated(result);
      } else {
        // Mode création - insertion
        const { data, error: err } = await supabase
          .from('shipping_agencies')
          .insert([cleanedForm])
          .select('*')
          .single();
        
        if (err) throw err;
        result = data;
        
        if (onCreated) onCreated(result);
      }

      setLoading(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Erreur:', err);
      setError(agency ? 'Erreur lors de la modification de l\'agence.' : 'Erreur lors de la création de l\'agence.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl lg:text-2xl font-bold mb-6 text-gray-900">
        {agency ? 'Modifier l\'agence' : 'Nouvelle agence d\'expédition'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
              Nom de l'agence <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
              placeholder="Ex: DHL Express"
              required 
            />
          </div>
          <div>
            <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
              Téléphone
            </label>
            <input 
              type="text" 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
              placeholder="+225 0123456789"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
            Adresse
          </label>
          <textarea 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
            rows="2"
            placeholder="Adresse complète de l'agence"
          />
        </div>

        {/* Tarifs */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Tarifs de transport</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
                Prix aérien (F CFA/kg)
              </label>
              <input 
                type="number" 
                name="air_price_per_kg" 
                value={form.air_price_per_kg} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
                min="0" 
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
                Prix maritime (F CFA/CBM)
              </label>
              <input 
                type="number" 
                name="sea_price_per_cbm" 
                value={form.sea_price_per_cbm} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
                min="0" 
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
                Prix express (F CFA/kg)
              </label>
              <input 
                type="number" 
                name="express_cost_per_kg" 
                value={form.express_cost_per_kg} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
                min="0" 
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2 text-sm lg:text-base text-gray-700">
            Notes additionnelles
          </label>
          <textarea 
            name="notes" 
            value={form.notes} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base" 
            rows="3"
            placeholder="Informations supplémentaires sur l'agence..."
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
          <button 
            type="button" 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base" 
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {agency ? 'Modification...' : 'Création...'}
              </span>
            ) : (
              agency ? 'Modifier l\'agence' : 'Créer l\'agence'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 