import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

  const getTotalWeight = () => {
    return items.reduce((total, item) => {
      const weight = parseFloat(item.unit_weight) || 0;
      const qty = parseInt(item.quantity) || 0;
      return total + (weight * qty);
    }, 0);
  };

  const getTotalFees = () => {
    return (parseFloat(order?.bank_fees_usd || 0) + parseFloat(order?.shipping_fees_usd || 0));
  };

  const getUnitCostPrice = (item) => {
    if (getUsdToCfaRate() === 0) return 0;
    
    const quantity = parseInt(item.quantity) || 0;
    if (quantity === 0) return 0;
    
    // Prix article (CFA) = prix unitaire en USD × taux CFA
    const unitPriceCFA = parseFloat(item.unit_price_usd) * getUsdToCfaRate();
    
    // Coût livraison/article = coût de livraison total de la ligne / quantité
    const shippingCostPerUnit = getLineShippingCostPerUnit(item);
    
    // Part frais/article = part des frais par ligne / quantité
    const feesPerLine = getFeesPerLine();
    const feesPerUnit = feesPerLine / quantity;
    
    // Prix de revient unitaire = Prix article (CFA) + Coût livraison/article + Part frais/article
    return unitPriceCFA + shippingCostPerUnit + feesPerUnit;
  };

  const getLineCostPrice = (item) => {
    if (getUsdToCfaRate() === 0) return 0;
    
    const quantity = parseInt(item.quantity) || 0;
    
    // Prix de revient total de la ligne = prix de revient unitaire × quantité
    return getUnitCostPrice(item) * quantity;
  };

  // Coût de livraison total pour une ligne
  // Pour le maritime: basé sur CBM × prix CBM
  // Pour l'aérien/express: basé sur poids (kg) × prix par kg
  const getLineShippingCostTotal = (item) => {
    const unitWeight = parseFloat(item.unit_weight) || 0;
    const unitCbm = parseFloat(item.unit_cbm) || 0;
    const quantity = parseInt(item.quantity) || 0;
    
    // Prendre le premier prix disponible des agences de livraison
    if (deliveries.length > 0 && deliveries[0].shipping_agencies) {
      const agency = deliveries[0].shipping_agencies;
      const deliveryType = deliveries[0].type;
      
      // Calcul selon le type de transport
      if (deliveryType === 'sea' && unitCbm > 0 && agency.sea_price_per_cbm) {
        // Transport maritime: utiliser CBM × prix CBM
        const totalCbm = unitCbm * quantity;
        const pricePerCbm = parseFloat(agency.sea_price_per_cbm);
        return totalCbm * pricePerCbm;
      } else if (deliveryType === 'air' && unitWeight > 0 && agency.air_price_per_kg) {
        // Transport aérien: utiliser poids (kg) × prix par kg
        const totalWeight = unitWeight * quantity;
        const pricePerKg = parseFloat(agency.air_price_per_kg);
        return totalWeight * pricePerKg;
      } else if (deliveryType === 'express' && unitWeight > 0) {
        // Transport express: utiliser poids (kg) × prix par kg
        const totalWeight = unitWeight * quantity;
        const expressPrice = agency.express_cost_per_kg || (agency.air_price_per_kg ? parseFloat(agency.air_price_per_kg) * 1.5 : 0);
        if (expressPrice > 0) {
          return totalWeight * expressPrice;
        }
      } else if (deliveryType === 'sea' && unitCbm === 0 && unitWeight > 0 && agency.sea_price_per_cbm) {
        // Fallback: si pas de CBM mais poids disponible pour maritime, convertir poids en CBM
        // Approximation: 1 CBM ≈ 167 kg (poids volumétrique)
        const totalWeight = unitWeight * quantity;
        const totalCbm = totalWeight / 167;
        const pricePerCbm = parseFloat(agency.sea_price_per_cbm);
        return totalCbm * pricePerCbm;
      }
    }
    
    return 0;
  };
  
  // Coût de livraison par article pour une ligne
  const getLineShippingCostPerUnit = (item) => {
    const quantity = parseInt(item.quantity) || 0;
    if (quantity === 0) return 0;
    
    const totalShippingCost = getLineShippingCostTotal(item);
    return totalShippingCost / quantity;
  };
  
  // Coût de livraison total pour une ligne (ancienne fonction pour compatibilité)
  const getLineShippingCost = (item) => {
    return getLineShippingCostTotal(item);
  };

  // Part des frais (bancaires + livraison USD) par ligne de produit
  // Distribue les frais bancaires et shipping_fees_usd par nombre de lignes
  const getFeesPerLine = () => {
    if (items.length === 0) return 0;
    
    const bankFees = parseFloat(order.bank_fees_usd || 0);
    const shippingFees = parseFloat(order.shipping_fees_usd || 0);
    const totalFees = bankFees + shippingFees;
    
    // Convertir en CFA si le taux est disponible
    if (getUsdToCfaRate() > 0) {
      // Distribuer les frais par nombre de lignes de produits
      return (totalFees * getUsdToCfaRate()) / items.length;
    }
    
    return 0;
  };
  
  // Part des frais de livraison par ligne de produit
  const getShippingFeesPerLine = () => {
    if (items.length === 0) return 0;
    
    const shippingFees = parseFloat(order.shipping_fees_usd || 0);
    
    // Convertir en CFA si le taux est disponible
    if (getUsdToCfaRate() > 0) {
      // Distribuer les frais de livraison par nombre de lignes de produits
      return (shippingFees * getUsdToCfaRate()) / items.length;
    }
    
    return 0;
  };
  
  // Part des frais bancaires par ligne de produit
  const getBankFeesPerLine = () => {
    return getFeesPerLine() - getShippingFeesPerLine();
  };

  const getTotalCostPrice = () => {
    return items.reduce((total, item) => total + getLineCostPrice(item), 0);
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const price = parseFloat(item.unit_price_usd) || 0;
      return total + (quantity * price) ;
    }, 0);
  };

  // Valeur totale incluant les frais bancaires et de livraison
  const getTotalValueWithFees = () => {
    const productsValue = getTotalValue();
    const bankFees = parseFloat(order.bank_fees_usd || 0);
    const shippingFees = parseFloat(order.shipping_fees_usd || 0);
    return productsValue + bankFees + shippingFees;
  };

  // Calculs pour les conversions CFA
  const getTotalDeliveryFees = () => {
    return deliveries.reduce((total, delivery) => {
      return total + (parseFloat(delivery.shipping_fees_xof) || 0);
    }, 0);
  };

  const getTotalShippingCostByWeight = () => {
    let totalCost = 0;
    
    deliveries.forEach(delivery => {
      if (delivery.shipping_agencies) {
        const agency = delivery.shipping_agencies;
        
        // Déterminer le coût selon le type de livraison
        if (delivery.type === 'air' && agency.air_price_per_kg) {
          const pricePerKg = parseFloat(agency.air_price_per_kg);
          const deliveryWeight = parseFloat(delivery.weight_kg) || 0;
          const deliveryCost = deliveryWeight * pricePerKg;
          totalCost += deliveryCost;
        } else if (delivery.type === 'sea' && agency.sea_price_per_cbm) {
          const pricePerCbm = parseFloat(agency.sea_price_per_cbm);
          const deliveryCbm = parseFloat(delivery.cbm) || 0;
          const deliveryCost = deliveryCbm * pricePerCbm;
          totalCost += deliveryCost;
        } else if (agency.express_cost_per_kg) {
          const pricePerKg = parseFloat(agency.express_cost_per_kg);
          const deliveryWeight = parseFloat(delivery.weight_kg) || 0;
          const deliveryCost = deliveryWeight * pricePerKg;
          totalCost += deliveryCost;
        }
      }
    });
    
    return totalCost;
  };

  const getUsdToCfaRate = () => {
    return parseFloat(order.usd_xof_value) || 0;
  };

  const getTotalOrderValueCFA = () => {
    const usdTotal = getTotalValue();
    const rate = getUsdToCfaRate();
    return usdTotal * rate;
  };

  const getTotalWithDeliveryAndFeesXOF = () => {
    const orderValueCFA = getTotalOrderValueCFA();
    const deliveryFees = getTotalDeliveryFees();
    return orderValueCFA + deliveryFees + getTotalFeesCFA();
  };

  const getTotalFeesCFA = () => {
    const bankFees = parseFloat(order.bank_fees_usd || 0);
    const shippingFees = parseFloat(order.shipping_fees_usd || 0);
    return (bankFees + shippingFees)*getUsdToCfaRate();
  };

  // Calcul du total d'une ligne produit en CFA
  // Inclut : prix de l'article en dollar × nombre d'articles converti en CFA + coût livraison de la ligne + part des frais bancaires
  const getItemTotalCFA = (item) => {
    // Utiliser la même logique que getLineCostPrice qui inclut déjà tous les éléments
    return getLineCostPrice(item);
  };

  // Total de tous les produits en CFA (incluant livraison et frais bancaires)
  // Ce total devrait correspondre approximativement à : (valeur produits USD + shipping_fees_usd + bank_fees_usd) × taux
  // Mais utilise les coûts de livraison réels calculés par poids/CBM au lieu de shipping_fees_usd converti
  const getTotalProductsCFA = () => {
    if (getUsdToCfaRate() === 0) return 0;
    // Utiliser getLineCostPrice qui inclut prix + livraison réelle + frais bancaires
    return items.reduce((total, item) => total + getLineCostPrice(item), 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">La commande que vous recherchez n'existe pas.</p>
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
      {/* En-tête de la commande */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    Commande #{order.id?.slice(0, 8)}
                  </h1>
                </div>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-3 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(order.order_date).toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border ${
                  order.status === 'En cours' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                  order.status === 'Livré' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                  order.status === 'Annulé' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                  'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                }`}>
                  {order.status || 'Non défini'}
                </span>
              </div>
            </div>
            
            {/* Résumé financier */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valeur produits</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${getTotalValue().toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Frais bancaires</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${parseFloat(order.bank_fees_usd || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Frais livraison</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${parseFloat(order.shipping_fees_usd || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total avec frais</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${getTotalValueWithFees().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informations complémentaires */}
          <div className="space-y-3">
            {/* Taux de change */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">Taux de change</h4>
              {order.usd_xof_value ? (
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">1 USD</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">=</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{parseFloat(order.usd_xof_value).toLocaleString('fr-FR')} F CFA</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Non défini</p>
                </div>
              )}
            </div>
            
            {/* Notes */}
            {order.notes && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">Notes</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 p-2 rounded border-l-2 border-gray-300 dark:border-gray-500">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button 
            onClick={() => setShowEditForm(true)}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Éditer
          </button>
          <button 
            onClick={() => setShowAgencyModal(true)}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Agence
          </button>
          <button 
            onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Livraison
          </button>
        </div>
      </div>

      {/* Résumé des produits et livraisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Résumé produits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Résumé produits</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Nombre de produits:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{items.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Quantité totale:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{getTotalItems()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Valeur produits:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">${getTotalValue().toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Poids total:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{getTotalWeight()} kg</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Frais bancaires:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${parseFloat(order.bank_fees_usd || 0).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Frais livraison:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${parseFloat(order.shipping_fees_usd || 0).toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total avec frais:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${getTotalValueWithFees().toFixed(2)} USD</span>
                </div>
              </div>
            </div>
            {getUsdToCfaRate() > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total coût produits (CFA):</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{getTotalProductsCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Note: Inclut prix, livraison et frais</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résumé livraisons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Livraisons</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Total livraisons:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{deliveries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Livrées:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {deliveries.filter(d => d.status === 'Livré').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">En cours:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {deliveries.filter(d => d.status !== 'Livré' && d.status !== 'Annulé').length}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Coût total:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{getTotalDeliveryFees().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coûts de livraison par poids */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Coûts livraison</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Poids total:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{getTotalWeight()} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Prix par kg:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(() => {
                  if (deliveries.length === 0) return '0 F';
                  const delivery = deliveries[0];
                  if (!delivery.shipping_agencies) return '0 F';
                  
                  const agency = delivery.shipping_agencies;
                  let pricePerKg = 0;
                  
                  if (delivery.type === 'air' && agency.air_price_per_kg) {
                    pricePerKg = parseFloat(agency.air_price_per_kg);
                  } else if (delivery.type === 'sea' && agency.sea_price_per_cbm) {
                    // Pour le transport maritime, on convertit CBM en kg (approximativement 1 CBM = 1000 kg)
                    pricePerKg = parseFloat(agency.sea_price_per_cbm) / 1000;
                  } else if (agency.express_cost_per_kg) {
                    pricePerKg = parseFloat(agency.express_cost_per_kg);
                  }
                  
                  return `${pricePerKg.toLocaleString('fr-FR')} F`;
                })()}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Total coût:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{getTotalShippingCostByWeight().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Résumé financier CFA */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow-sm p-4 border border-green-200 dark:border-green-800">
          <h3 className="text-base font-medium mb-3 text-green-800 dark:text-green-400">Total en CFA</h3>
          <div className="space-y-2">
            {getUsdToCfaRate() > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Commande:</span>
                  <span className="font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">{getTotalOrderValueCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Frais livraison:</span>
                  <span className="font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">+{getTotalDeliveryFees().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Autres frais :</span>
                  <span className="font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">+{getTotalFeesCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="pt-2 border-t border-green-300 dark:border-green-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Total général:</span>
                    <span className="font-bold text-lg text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">{getTotalWithDeliveryAndFeesXOF().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Taux de change non défini</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Éditez la commande pour ajouter le taux USD/CFA</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-lg mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Produits commandés</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Quantité, Prix article, Poids, Part des frais, Prix de revient
              </p>
            </div>
            <button 
              onClick={() => setShowEditForm(true)}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produit</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantité</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prix article (CFA)</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Poids/Volume</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Part des frais</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Part frais/article</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prix revient/art</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total CFA</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 lg:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Aucun produit dans cette commande
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base">{item.product_name}</p>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.product_name} className="w-8 h-8 lg:w-12 lg:h-12 object-cover rounded mt-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {item.quantity}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {getUsdToCfaRate() > 0 ? (
                        `${(parseFloat(item.unit_price_usd) * getUsdToCfaRate()).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="space-y-1">
                        {item.unit_weight && (
                          <div>{`${(parseFloat(item.unit_weight) * parseInt(item.quantity))} kg`}</div>
                        )}
                        {item.unit_cbm && (
                          <div className="text-blue-600 dark:text-blue-400">{`${(parseFloat(item.unit_cbm) * parseInt(item.quantity))} CBM`}</div>
                        )}
                        {!item.unit_weight && !item.unit_cbm && '-'}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {getUsdToCfaRate() > 0 ? (
                        `${getFeesPerLine().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {getUsdToCfaRate() > 0 ? (
                        `${(getFeesPerLine() / parseInt(item.quantity || 1)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {getUsdToCfaRate() > 0 ? (
                        `${getUnitCostPrice(item).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-medium text-green-700 dark:text-green-400">
                      {getUsdToCfaRate() > 0 ? (
                        `${getItemTotalCFA(item).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Link
                          to={`/admin/supplier-order-items/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Détails
                        </Link>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {items.length > 0 && (
                <tr className="bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    Total Produits
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    {getTotalItems()}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    {getUsdToCfaRate() > 0 ? (
                      `${getTotalOrderValueCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    {getTotalWeight()} kg
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-blue-700 dark:text-blue-400">
                    {getUsdToCfaRate() > 0 ? (
                      `${(getFeesPerLine() * items.length).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-blue-700 dark:text-blue-400">
                    {getUsdToCfaRate() > 0 && getTotalItems() > 0 ? (
                      `${((getFeesPerLine() * items.length) / getTotalItems()).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-purple-700 dark:text-purple-400">
                    {getUsdToCfaRate() > 0 && getTotalItems() > 0 ? (
                      `${(getTotalCostPrice() / getTotalItems()).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-green-700 dark:text-green-400">
                    {getUsdToCfaRate() > 0 ? (
                      `${getTotalProductsCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Livraisons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Livraisons</h2>
            <button 
              onClick={() => { setEditDelivery(null); setShowDeliveryModal(true); }}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agence</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Poids/CBM</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Frais</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dates</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 lg:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune livraison pour cette commande
                  </td>
                </tr>
              ) : (
                deliveries.map(delivery => (
                  <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base">{delivery.shipping_agencies?.name || '-'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{delivery.shipping_agencies?.phone || ''}</p>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        delivery.type === 'air' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                        delivery.type === 'sea' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                        'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
                      }`}>
                        {delivery.type}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        delivery.status === 'Livré' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                        delivery.status === 'En cours' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                        delivery.status === 'Retardé' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {delivery.status || '-'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {delivery.weight_kg && `${delivery.weight_kg} kg`}
                      {delivery.cbm && `${delivery.cbm} CBM`}
                      {!delivery.weight_kg && !delivery.cbm && '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {delivery.shipping_fees_xof && `${parseFloat(delivery.shipping_fees_xof).toFixed(0)} F CFA`}
                      {!delivery.shipping_fees_xof && '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div>
                        {delivery.send_date && (
                          <p className="text-gray-900 dark:text-gray-100">Envoi: {new Date(delivery.send_date).toLocaleDateString('fr-FR')}</p>
                        )}
                        {delivery.receive_date && (
                          <p className="text-gray-900 dark:text-gray-100">Réception: {new Date(delivery.receive_date).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => { setEditDelivery(delivery); setShowDeliveryModal(true); }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeleteDelivery(delivery.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-2 lg:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-xl shadow-2xl dark:shadow-black/50 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-[75vw] lg:max-w-[70vw] xl:max-w-[65vw] 2xl:max-w-[60vw] overflow-hidden relative flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-none sm:rounded-t-xl">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {order ? 'Modifier' : 'Nouvelle'} Commande Fournisseur
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Gestion des commandes fournisseurs
                </p>
              </div>
              <button 
                onClick={() => setShowEditForm(false)} 
                className="p-2 sm:p-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-4"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <SupplierOrderForm 
                order={order} 
                onClose={handleOrderSaved} 
              />
            </div>
          </div>
        </div>
      )}

      {showDeliveryModal && (
        <DeliveryForm 
          supplierOrderId={id} 
          delivery={editDelivery} 
          onSaved={handleDeliverySaved} 
          onClose={() => { setShowDeliveryModal(false); setEditDelivery(null); }} 
        />
      )}

      {showAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowAgencyModal(false)} 
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
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