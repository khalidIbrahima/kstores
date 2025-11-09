import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MessageCircle, 
  Mail, 
  Settings, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendBulkAbandonedCartNotifications, getAbandonedCartNotificationStats } from '../services/abandonedCartService';
import toast from 'react-hot-toast';

const AbandonedCartCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    today: 0,
    recovery_rate: 0
  });

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    target_hours: 24,
    notification_type: 'whatsapp',
    message_template: '',
    is_active: true
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_recovery_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const notificationStats = await getAbandonedCartNotificationStats();
      setStats(notificationStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_recovery_campaigns')
        .insert([newCampaign])
        .select()
        .single();

      if (error) throw error;

      setCampaigns([data, ...campaigns]);
      setShowCreateModal(false);
      setNewCampaign({
        name: '',
        description: '',
        target_hours: 24,
        notification_type: 'whatsapp',
        message_template: '',
        is_active: true
      });
      toast.success('Campagne créée avec succès');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erreur lors de la création de la campagne');
    }
  };

  const handleUpdateCampaign = async () => {
    try {
      const { error } = await supabase
        .from('cart_recovery_campaigns')
        .update({
          ...editingCampaign,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCampaign.id);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === editingCampaign.id ? { ...c, ...editingCampaign } : c
      ));
      setEditingCampaign(null);
      toast.success('Campagne mise à jour avec succès');
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Erreur lors de la mise à jour de la campagne');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return;

    try {
      const { error } = await supabase
        .from('cart_recovery_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      toast.success('Campagne supprimée avec succès');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erreur lors de la suppression de la campagne');
    }
  };

  const handleToggleCampaign = async (campaign) => {
    try {
      const { error } = await supabase
        .from('cart_recovery_campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === campaign.id ? { ...c, is_active: !c.is_active } : c
      ));
      toast.success(`Campagne ${campaign.is_active ? 'désactivée' : 'activée'}`);
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleRunCampaign = async (campaign) => {
    try {
      // Récupérer les paniers abandonnés éligibles
      const { data: eligibleCarts, error } = await supabase
        .rpc('get_eligible_abandoned_carts', { hours_threshold: campaign.target_hours });

      if (error) throw error;

      if (eligibleCarts.length === 0) {
        toast.info('Aucun panier éligible pour cette campagne');
        return;
      }

      // Envoyer les notifications en lot
      const results = await sendBulkAbandonedCartNotifications(
        eligibleCarts, 
        campaign.notification_type
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      toast.success(`Campagne exécutée: ${successCount} succès, ${failureCount} échecs`);
      fetchStats();
    } catch (error) {
      console.error('Error running campaign:', error);
      toast.error('Erreur lors de l\'exécution de la campagne');
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campagnes de Récupération</h2>
          <p className="text-gray-600">Gérez les campagnes automatiques de récupération de paniers abandonnés</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Campagne
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Notifications</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Réussies</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.sent}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Échouées</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.failed}</h3>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de Succès</p>
              <h3 className="text-2xl font-bold text-blue-600">{stats.recovery_rate?.toFixed(1) || 0}%</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Campagnes Actives</h3>
        </div>
        
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune campagne configurée</p>
            <p className="text-sm text-gray-400 mt-1">
              Créez votre première campagne de récupération
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getNotificationTypeIcon(campaign.notification_type)}
                      <span className="text-sm text-gray-500">
                        {campaign.notification_type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-500">{campaign.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {campaign.target_hours}h après abandon
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRunCampaign(campaign)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      title="Exécuter la campagne"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Exécuter
                    </button>
                    
                    <button
                      onClick={() => handleToggleCampaign(campaign)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        campaign.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={campaign.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {campaign.is_active ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Activer
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setEditingCampaign(campaign)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouvelle Campagne</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de la campagne</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="Ex: Récupération 24h"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  rows="3"
                  placeholder="Description de la campagne"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Délai (heures)</label>
                  <input
                    type="number"
                    value={newCampaign.target_hours}
                    onChange={(e) => setNewCampaign({...newCampaign, target_hours: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    min="1"
                    max="168"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de notification</label>
                  <select
                    value={newCampaign.notification_type}
                    onChange={(e) => setNewCampaign({...newCampaign, notification_type: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Template de message</label>
                <textarea
                  value={newCampaign.message_template}
                  onChange={(e) => setNewCampaign({...newCampaign, message_template: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  rows="4"
                  placeholder="Template du message à envoyer..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Créer la campagne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier la Campagne</h3>
              <button
                onClick={() => setEditingCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de la campagne</label>
                <input
                  type="text"
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({...editingCampaign, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editingCampaign.description}
                  onChange={(e) => setEditingCampaign({...editingCampaign, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Délai (heures)</label>
                  <input
                    type="number"
                    value={editingCampaign.target_hours}
                    onChange={(e) => setEditingCampaign({...editingCampaign, target_hours: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    min="1"
                    max="168"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de notification</label>
                  <select
                    value={editingCampaign.notification_type}
                    onChange={(e) => setEditingCampaign({...editingCampaign, notification_type: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Template de message</label>
                <textarea
                  value={editingCampaign.message_template}
                  onChange={(e) => setEditingCampaign({...editingCampaign, message_template: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  rows="4"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbandonedCartCampaigns; 