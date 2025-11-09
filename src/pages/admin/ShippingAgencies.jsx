import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Package, Phone, MapPin } from 'lucide-react';
import ShippingAgencyForm from './ShippingAgencyForm';

const ShippingAgencies = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_agencies')
        .select('*')
        .order('name');

      if (error) throw error;
      setAgencies(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) return;

    try {
      const { error } = await supabase
        .from('shipping_agencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAgencies();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'agence');
    }
  };

  const handleEdit = (agency) => {
    setEditingAgency(agency);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAgency(null);
  };

  const handleFormSaved = () => {
    fetchAgencies();
    handleFormClose();
  };

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'air' && agency.air_price_per_kg) ||
                         (filterType === 'sea' && agency.sea_price_per_cbm) ||
                         (filterType === 'express' && agency.express_cost_per_kg);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Gestion des Agences d'Expédition
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos partenaires d'expédition et leurs tarifs
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher une agence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="air">Transport aérien</option>
            <option value="sea">Transport maritime</option>
            <option value="express">Express</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nouvelle Agence</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Agencies Grid */}
      {filteredAgencies.length === 0 ? (
        <div className="text-center py-12">
          <Package size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm || filterType !== 'all' ? 'Aucune agence trouvée' : 'Aucune agence configurée'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre première agence d\'expédition'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Ajouter une agence
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <div
              key={agency.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {agency.name}
                    </h3>
                    {agency.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <Phone size={16} />
                        <span className="text-sm">{agency.phone}</span>
                      </div>
                    )}
                    {agency.address && (
                      <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 mb-3">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{agency.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(agency)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(agency.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Tarifs */}
                <div className="space-y-2">
                  {agency.air_price_per_kg && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prix aérien:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{agency.air_price_per_kg} F CFA/kg</span>
                    </div>
                  )}
                  {agency.sea_price_per_cbm && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prix maritime:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{agency.sea_price_per_cbm} F CFA/CBM</span>
                    </div>
                  )}
                  {agency.express_cost_per_kg && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prix express:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{agency.express_cost_per_kg} F CFA/kg</span>
                    </div>
                  )}
                </div>

                {/* Services disponibles */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {agency.air_price_per_kg && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        Aérien
                      </span>
                    )}
                    {agency.sea_price_per_cbm && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                        Maritime
                      </span>
                    )}
                    {agency.express_cost_per_kg && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                        Express
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour le formulaire */}
      {showForm && (
        <div className="modal-overlay" onClick={handleFormClose}>
          <div className="modal-content-large bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {editingAgency ? 'Modifier l\'agence' : 'Nouvelle agence d\'expédition'}
                </h2>
                <button
                  onClick={handleFormClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  &times;
                </button>
              </div>
              <ShippingAgencyForm
                agency={editingAgency}
                onCreated={handleFormSaved}
                onUpdated={handleFormSaved}
                onClose={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAgencies;