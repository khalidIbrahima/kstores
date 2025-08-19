import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    
    // Prix d'achat = prix unitaire × quantité
    const unitPriceCFA = parseFloat(item.unit_price_usd) * getUsdToCfaRate();
    const quantity = parseInt(item.quantity) || 0;
    const totalPurchasePrice = unitPriceCFA * quantity;
    
    // Coût de livraison direct pour cette ligne
    const shippingFees = getLineShippingCost(item);
    
    // Part des frais bancaires et de livraison pour cette ligne
    const feesPerProduct = getFeesPerProduct();
    const totalFeesPerLine = feesPerProduct * quantity;
    
    // Prix de revient total = prix d'achat + frais de livraison + part des frais
    const totalCostPrice = totalPurchasePrice + shippingFees + totalFeesPerLine;
    
    // Prix de revient unitaire = prix de revient total ÷ quantité
    return totalCostPrice / quantity;
  };

  const getLineCostPrice = (item) => {
    if (getUsdToCfaRate() === 0) return 0;
    
    // Prix d'achat = prix unitaire × quantité
    const unitPriceCFA = parseFloat(item.unit_price_usd) * getUsdToCfaRate();
    const quantity = parseInt(item.quantity) || 0;
    const totalPurchasePrice = unitPriceCFA * quantity;
    
    // Coût de livraison direct pour cette ligne
    const shippingFees = getLineShippingCost(item);
    
    // Part des frais bancaires et de livraison pour cette ligne
    const feesPerProduct = getFeesPerProduct();
    const totalFeesPerLine = feesPerProduct * quantity;
    
    // Prix de revient total de la ligne = prix d'achat + frais de livraison + part des frais
    return totalPurchasePrice + shippingFees + totalFeesPerLine;
  };

  const getLineShippingCost = (item) => {
    const unitWeight = parseFloat(item.unit_weight) || 0;
    const quantity = parseInt(item.quantity) || 0;
    const totalWeight = unitWeight * quantity;
    
    if (totalWeight === 0) return 0;
    
    // Trouver le prix par kg de l'agence de livraison
    let pricePerKg = 0;
    
    // Prendre le premier prix disponible des agences de livraison
    if (deliveries.length > 0 && deliveries[0].shipping_agencies) {
      const agency = deliveries[0].shipping_agencies;
      
      // Déterminer le prix par kg selon le type de livraison
      if (deliveries[0].type === 'air' && agency.air_price_per_kg) {
        pricePerKg = parseFloat(agency.air_price_per_kg);
      } else if (deliveries[0].type === 'sea' && agency.sea_price_per_cbm) {
        // Pour le transport maritime, on convertit CBM en kg (approximativement 1 CBM = 1000 kg)
        pricePerKg = parseFloat(agency.sea_price_per_cbm) / 1000;
      } else if (agency.express_cost_per_kg) {
        pricePerKg = parseFloat(agency.express_cost_per_kg);
      }
    }
    
    // Coût de livraison direct pour cette ligne = poids total × prix par kg
    return totalWeight * pricePerKg;
  };

  // Part des frais bancaires et de livraison par produit
  const getFeesPerProduct = () => {
    if (items.length === 0) return 0;
    
    const bankFees = parseFloat(order.bank_fees_usd || 0);
    const shippingFees = parseFloat(order.shipping_fees_usd || 0);
    const totalFees = bankFees + shippingFees;
    
    // Convertir en CFA si le taux est disponible
    if (getUsdToCfaRate() > 0) {
      return (totalFees * getUsdToCfaRate()) / items.length;
    }
    
    return 0;
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
        let pricePerKg = 0;
        
        // Déterminer le prix par kg selon le type de livraison
        if (delivery.type === 'air' && agency.air_price_per_kg) {
          pricePerKg = parseFloat(agency.air_price_per_kg);
        } else if (delivery.type === 'sea' && agency.sea_price_per_cbm) {
          // Pour le transport maritime, on convertit CBM en kg (approximativement 1 CBM = 1000 kg)
          pricePerKg = parseFloat(agency.sea_price_per_cbm) / 1000;
        } else if (agency.express_cost_per_kg) {
          pricePerKg = parseFloat(agency.express_cost_per_kg);
        }
        
        // Calculer le coût de livraison pour cette livraison
        if (pricePerKg > 0) {
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
  const getItemTotalCFA = (item) => {
    const usdTotal = parseFloat(item.unit_price_usd) * parseInt(item.quantity);
    const rate = getUsdToCfaRate();
    return usdTotal * rate;
  };

  // Total de tous les produits en CFA (sans frais bancaires)
  const getTotalProductsCFA = () => {
    if (getUsdToCfaRate() === 0) return 0;
    return items.reduce((total, item) => total + getItemTotalCFA(item), 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 mb-4">La commande que vous recherchez n'existe pas.</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
                    Commande #{order.id?.slice(0, 8)}
                  </h1>
                </div>
                <p className="text-sm lg:text-base text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  order.status === 'En cours' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  order.status === 'Livré' ? 'bg-green-50 text-green-700 border-green-200' :
                  order.status === 'Annulé' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {order.status || 'Non défini'}
                </span>
              </div>
            </div>
            
            {/* Résumé financier */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Valeur produits</p>
                  <p className="text-sm font-semibold text-gray-900">${getTotalValue().toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Frais bancaires</p>
                  <p className="text-sm font-semibold text-gray-900">${parseFloat(order.bank_fees_usd || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Frais livraison</p>
                  <p className="text-sm font-semibold text-gray-900">${parseFloat(order.shipping_fees_usd || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Total avec frais</p>
                  <p className="text-sm font-semibold text-gray-900">${getTotalValueWithFees().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informations complémentaires */}
          <div className="space-y-3">
            {/* Taux de change */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">Taux de change</h4>
              {order.usd_xof_value ? (
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">1 USD</p>
                  <p className="text-sm text-gray-600">=</p>
                  <p className="text-lg font-semibold text-gray-900">{parseFloat(order.usd_xof_value).toLocaleString('fr-FR')} F CFA</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-sm">Non défini</p>
                </div>
              )}
            </div>
            
            {/* Notes */}
            {order.notes && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">Notes</h4>
                <p className="text-sm text-gray-700 bg-white p-2 rounded border-l-2 border-gray-300">
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
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="text-base font-medium mb-3 text-gray-800">Résumé produits</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Nombre de produits:</span>
              <span className="font-medium text-gray-900">{items.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Quantité totale:</span>
              <span className="font-medium text-gray-900">{getTotalItems()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Valeur produits:</span>
              <span className="font-medium text-gray-900">${getTotalValue().toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Poids total:</span>
              <span className="font-medium text-gray-900">{getTotalWeight().toFixed(1)} kg</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Frais bancaires:</span>
                <span className="font-medium text-gray-900">${parseFloat(order.bank_fees_usd || 0).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600">Frais livraison:</span>
                <span className="font-medium text-gray-900">${parseFloat(order.shipping_fees_usd || 0).toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total avec frais:</span>
                  <span className="font-medium text-gray-900">${getTotalValueWithFees().toFixed(2)} USD</span>
                </div>
              </div>
            </div>
            {getUsdToCfaRate() > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Valeur en CFA:</span>
                  <span className="font-medium text-gray-900">{getTotalProductsCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">Total avec frais en CFA:</span>
                  <span className="font-medium text-gray-900">{(getTotalValueWithFees() * getUsdToCfaRate()).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résumé livraisons */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="text-base font-medium mb-3 text-gray-800">Livraisons</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Total livraisons:</span>
              <span className="font-medium text-gray-900">{deliveries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Livrées:</span>
              <span className="font-medium text-gray-900">
                {deliveries.filter(d => d.status === 'Livré').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">En cours:</span>
              <span className="font-medium text-gray-900">
                {deliveries.filter(d => d.status !== 'Livré' && d.status !== 'Annulé').length}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Coût total:</span>
                <span className="font-medium text-gray-900">{getTotalDeliveryFees().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coûts de livraison par poids */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="text-base font-medium mb-3 text-gray-800">Coûts livraison</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Poids total:</span>
              <span className="font-medium text-gray-900">{getTotalWeight().toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Prix par kg:</span>
              <span className="font-medium text-gray-900">
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
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Total coût:</span>
                <span className="font-medium text-gray-900">{getTotalShippingCostByWeight().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Résumé financier CFA */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
          <h3 className="text-base font-medium mb-3 text-green-800">Total en CFA</h3>
          <div className="space-y-2">
            {getUsdToCfaRate() > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Commande:</span>
                  <span className="font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">{getTotalOrderValueCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Frais livraison:</span>
                  <span className="font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">+{getTotalDeliveryFees().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Autres frais :</span>
                  <span className="font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">+{getTotalFeesCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                </div>
                <div className="pt-2 border-t border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total général:</span>
                    <span className="font-bold text-lg text-green-800 bg-green-50 px-3 py-1 rounded-full">{getTotalWithDeliveryAndFeesXOF().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Taux de change non défini</p>
                <p className="text-xs text-gray-400">Éditez la commande pour ajouter le taux USD/CFA</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Produits commandés</h2>
              <p className="text-xs text-gray-600 mt-1">
                Prix unitaire, Quantité, Poids, Coût livraison, Part des frais, Prix de revient
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poids total</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût livraison</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part des frais</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix revient/art</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix revient ligne</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total CFA</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                    Aucun produit dans cette commande
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">{item.product_name}</p>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.product_name} className="w-8 h-8 lg:w-12 lg:h-12 object-cover rounded mt-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      ${parseFloat(item.unit_price_usd).toFixed(2)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {item.unit_weight ? `${(parseFloat(item.unit_weight) * parseInt(item.quantity)).toFixed(1)} kg` : '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {getUsdToCfaRate() > 0 ? (
                        `${getLineShippingCost(item).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {getUsdToCfaRate() > 0 ? (
                        `${getFeesPerProduct().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {getUsdToCfaRate() > 0 ? (
                        `${getUnitCostPrice(item).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {getUsdToCfaRate() > 0 ? (
                        `${getLineCostPrice(item).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-medium text-green-700">
                      {getUsdToCfaRate() > 0 ? (
                        `${getItemTotalCFA(item).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                      ) : (
                        <span className="text-gray-400 text-xs">Taux non défini</span>
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {items.length > 0 && (
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900" colSpan={2}>
                    Total Produits
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900">
                    {getTotalItems()}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-gray-900">
                    {getTotalWeight().toFixed(1)} kg
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-indigo-700">
                    {getTotalShippingCostByWeight().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-blue-700">
                    {getUsdToCfaRate() > 0 ? (
                      `${(getFeesPerProduct() * getTotalItems()).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-purple-700">
                    {getUsdToCfaRate() > 0 ? (
                      `${(getTotalCostPrice() / getTotalItems()).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-purple-700">
                    {getUsdToCfaRate() > 0 ? (
                      `${getTotalCostPrice().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 text-xs">Taux non défini</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-bold text-green-700">
                    {getUsdToCfaRate() > 0 ? (
                      `${getTotalProductsCFA().toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F`
                    ) : (
                      <span className="text-gray-400 text-xs">Taux non défini</span>
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900">Livraisons</h2>
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agence</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poids/CBM</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frais</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                    Aucune livraison pour cette commande
                  </td>
                </tr>
              ) : (
                deliveries.map(delivery => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm lg:text-base">{delivery.shipping_agencies?.name || '-'}</p>
                        <p className="text-sm text-gray-500">{delivery.shipping_agencies?.phone || ''}</p>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        delivery.type === 'air' ? 'bg-blue-100 text-blue-800' :
                        delivery.type === 'sea' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {delivery.type}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        delivery.status === 'Livré' ? 'bg-green-100 text-green-800' :
                        delivery.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'Retardé' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {delivery.status || '-'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {delivery.weight_kg && `${delivery.weight_kg} kg`}
                      {delivery.cbm && `${delivery.cbm} CBM`}
                      {!delivery.weight_kg && !delivery.cbm && '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      {delivery.shipping_fees_xof && `${parseFloat(delivery.shipping_fees_xof).toFixed(0)} F CFA`}
                      {!delivery.shipping_fees_xof && '-'}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                      <div>
                        {delivery.send_date && (
                          <p>Envoi: {new Date(delivery.send_date).toLocaleDateString('fr-FR')}</p>
                        )}
                        {delivery.receive_date && (
                          <p>Réception: {new Date(delivery.receive_date).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => { setEditDelivery(delivery); setShowDeliveryModal(true); }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeleteDelivery(delivery.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
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
        <div className="modal-overlay">
          <div className="modal-content-large">
            <button 
              onClick={() => setShowEditForm(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <SupplierOrderForm 
              order={order} 
              onClose={handleOrderSaved} 
            />
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
        <div className="modal-overlay">
          <div className="modal-content">
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