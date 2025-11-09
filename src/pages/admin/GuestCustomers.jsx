import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getGuestCustomers, getGuestCustomerStats, getGuestContactStats } from '../../services/guestCustomerService';
import { useTranslation } from 'react-i18next';

const GuestCustomers = () => {
  const [loading, setLoading] = useState(true);
  const [guestCustomers, setGuestCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalGuests: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    abandonedOrders: 0,
    pendingOrders: 0,
    conversionRate: 0
  });
  const [contactStats, setContactStats] = useState({
    totalOrders: 0,
    ordersWithPhone: 0,
    ordersWithEmail: 0,
    ordersWithBoth: 0,
    ordersWithNeither: 0,
    phoneOnlyPercentage: 0,
    emailOnlyPercentage: 0,
    bothPercentage: 0,
    neitherPercentage: 0
  });
  const [filter, setFilter] = useState('all'); // all, completed, abandoned, mixed, pending
  const { t } = useTranslation();

  useEffect(() => {
    fetchGuestCustomers();
  }, []);

  const fetchGuestCustomers = async () => {
    try {
      setLoading(true);

      // Fetch guest customers and stats using the service
      const [customers, customerStats, contactStatsData] = await Promise.all([
        getGuestCustomers(),
        getGuestCustomerStats(),
        getGuestContactStats()
      ]);

      setGuestCustomers(customers);
      setStats(customerStats);
      setContactStats(contactStatsData);

    } catch (error) {
      console.error('Error fetching guest customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCustomers = () => {
    if (filter === 'all') return guestCustomers;
    return guestCustomers.filter(customer => customer.status === filter);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Commandes Complétées', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'abandoned':
        return { label: 'Paniers Abandonnés', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'mixed':
        return { label: 'Mixte', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
      case 'pending':
        return { label: 'En Attente', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle };
      default:
        return { label: 'Inconnu', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  const getCustomerValue = (customer) => {
    if (customer.completed_orders > 0) {
      return { label: 'Client Valorisé', color: 'text-green-600', bg: 'bg-green-50' };
    } else if (customer.abandoned_carts > 0) {
      return { label: 'Potentiel de Récupération', color: 'text-orange-600', bg: 'bg-orange-50' };
    } else {
      return { label: 'Nouveau Client', color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const getContactTypeBadge = (contactType) => {
    switch (contactType) {
      case 'both':
        return { label: '📞📧', color: 'bg-purple-100 text-purple-800', tooltip: 'Téléphone + Email' };
      case 'phone_only':
        return { label: '📞', color: 'bg-blue-100 text-blue-800', tooltip: 'Téléphone uniquement' };
      case 'email_only':
        return { label: '📧', color: 'bg-green-100 text-green-800', tooltip: 'Email uniquement' };
      case 'none':
        return { label: '❌', color: 'bg-red-100 text-red-800', tooltip: 'Aucun contact' };
      default:
        return { label: '❓', color: 'bg-gray-100 text-gray-800', tooltip: 'Contact inconnu' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filteredCustomers = getFilteredCustomers();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Clients Invités
        </h1>
        <p className="mt-2 text-gray-600">
          Gestion des clients qui ont passé des commandes sans compte
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients Invités</p>
              <h3 className="text-2xl font-bold">{stats.totalGuests}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes Complétées</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.completedOrders}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paniers Abandonnés</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.abandonedOrders}</h3>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de Conversion</p>
              <h3 className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="text-center">
            <p className="text-sm text-gray-600">Revenu Total</p>
            <h3 className="text-xl font-bold text-green-600">{stats.totalRevenue.toFixed(2)} {t('common.currency')}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="text-center">
            <p className="text-sm text-gray-600">Valeur Moyenne</p>
            <h3 className="text-xl font-bold">{stats.averageOrderValue.toFixed(2)} {t('common.currency')}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="text-center">
            <p className="text-sm text-gray-600">Commandes en Attente</p>
            <h3 className="text-xl font-bold text-yellow-600">{stats.pendingOrders}</h3>
          </div>
        </motion.div>
      </div>

      {/* Contact Statistics */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statistiques des Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{contactStats.ordersWithPhone}</div>
            <div className="text-sm text-gray-600">Avec Téléphone</div>
            <div className="text-xs text-gray-500">{contactStats.phoneOnlyPercentage.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{contactStats.ordersWithEmail}</div>
            <div className="text-sm text-gray-600">Avec Email</div>
            <div className="text-xs text-gray-500">{contactStats.emailOnlyPercentage.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{contactStats.ordersWithBoth}</div>
            <div className="text-sm text-gray-600">Téléphone + Email</div>
            <div className="text-xs text-gray-500">{contactStats.bothPercentage.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{contactStats.ordersWithNeither}</div>
            <div className="text-sm text-gray-600">Aucun Contact</div>
            <div className="text-xs text-gray-500">{contactStats.neitherPercentage.toFixed(1)}%</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 <strong>Conseil :</strong> Encouragez les clients à fournir leur téléphone pour un meilleur suivi et des communications plus efficaces.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="all">Tous les clients</option>
          <option value="completed">Commandes complétées</option>
          <option value="abandoned">Paniers abandonnés</option>
          <option value="mixed">Mixte (complétées + abandonnées)</option>
          <option value="pending">En attente</option>
        </select>
      </div>

      {/* Guest Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Liste des Clients Invités</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur Client
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const statusBadge = getStatusBadge(customer.status);
                const StatusIcon = statusBadge.icon;
                const customerValue = getCustomerValue(customer);
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Client Invité
                            </span>
                            {(() => {
                              const contactBadge = getContactTypeBadge(customer.contact_type);
                              return (
                                <span 
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${contactBadge.color}`}
                                  title={contactBadge.tooltip}
                                >
                                  {contactBadge.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.email && (
                          <div className="flex items-center mb-1">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            <span className={`text-xs ${customer.has_real_email ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                              {customer.email}
                              {!customer.has_real_email && (
                                <span className="ml-1 text-xs text-orange-600">(généré)</span>
                              )}
                            </span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-xs font-medium text-gray-900">{customer.phone}</span>
                          </div>
                        )}
                        {!customer.phone && !customer.has_real_email && (
                          <div className="text-xs text-red-500 italic">
                            Aucun contact disponible
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.address && (
                          <div className="flex items-start mb-1">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                            <span className="text-xs">{customer.address}</span>
                          </div>
                        )}
                        {(customer.city || customer.state || customer.zip_code) && (
                          <div className="text-xs text-gray-500">
                            {[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">{customer.completed_orders} complétées</span>
                          {customer.abandoned_carts > 0 && (
                            <span className="text-red-600 font-medium">{customer.abandoned_carts} abandonnées</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: {customer.total_orders}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.total_spent.toFixed(2)} {t('common.currency')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(customer.last_order).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(customer.last_order).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${customerValue.bg} ${customerValue.color}`}>
                        {customerValue.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun client invité trouvé</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'completed' ? 'Aucun client avec commandes complétées' : 
               filter === 'abandoned' ? 'Aucun client avec paniers abandonnés' : 
               filter === 'mixed' ? 'Aucun client avec statut mixte' : 
               filter === 'pending' ? 'Aucun client en attente' : 
               'Aucun client invité pour le moment'}
            </p>
          </div>
        )}
      </div>

      {/* Conversion Insights */}
      {filteredCustomers.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Insights de Conversion
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Taux de Conversion</h4>
              <p className="text-2xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">
                {stats.completedOrders} commandes complétées sur {stats.totalOrders} total
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Valeur Moyenne</h4>
              <p className="text-2xl font-bold text-blue-600">{stats.averageOrderValue.toFixed(2)} {t('common.currency')}</p>
              <p className="text-sm text-gray-600">
                Valeur moyenne des commandes complétées
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Potentiel de Récupération</h4>
              <p className="text-2xl font-bold text-orange-600">{stats.abandonedOrders}</p>
              <p className="text-sm text-gray-600">
                Paniers abandonnés à récupérer
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestCustomers; 