import { supabase } from '../lib/supabase';

// Générer un email unique basé sur le téléphone ou un ID
const generateUniqueEmail = (phone, orderId) => {
  if (phone) {
    // Nettoyer le numéro de téléphone et créer un email unique
    const cleanPhone = phone.replace(/\D/g, '');
    return `guest_${cleanPhone}@kstores.local`;
  }
  return `guest_${orderId}@kstores.local`;
};

// Récupérer les statistiques des contacts des clients invités
export const getGuestContactStats = async () => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('shipping_address')
      .is('user_id', null);

    if (error) throw error;

    let totalOrders = 0;
    let ordersWithPhone = 0;
    let ordersWithEmail = 0;
    let ordersWithBoth = 0;
    let ordersWithNeither = 0;

    orders?.forEach(order => {
      totalOrders++;
      const hasPhone = !!order.shipping_address?.phone;
      const hasEmail = !!order.shipping_address?.email;
      
      if (hasPhone && hasEmail) {
        ordersWithBoth++;
      } else if (hasPhone) {
        ordersWithPhone++;
      } else if (hasEmail) {
        ordersWithEmail++;
      } else {
        ordersWithNeither++;
      }
    });

    return {
      totalOrders,
      ordersWithPhone,
      ordersWithEmail,
      ordersWithBoth,
      ordersWithNeither,
      phoneOnlyPercentage: totalOrders > 0 ? (ordersWithPhone / totalOrders) * 100 : 0,
      emailOnlyPercentage: totalOrders > 0 ? (ordersWithEmail / totalOrders) * 100 : 0,
      bothPercentage: totalOrders > 0 ? (ordersWithBoth / totalOrders) * 100 : 0,
      neitherPercentage: totalOrders > 0 ? (ordersWithNeither / totalOrders) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching guest contact stats:', error);
    return {
      totalOrders: 0,
      ordersWithPhone: 0,
      ordersWithEmail: 0,
      ordersWithBoth: 0,
      ordersWithNeither: 0,
      phoneOnlyPercentage: 0,
      emailOnlyPercentage: 0,
      bothPercentage: 0,
      neitherPercentage: 0
    };
  }
};

// Récupérer tous les clients invités
export const getGuestCustomers = async () => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Grouper les commandes par client (utiliser le téléphone comme identifiant principal)
    const customerMap = new Map();

    orders?.forEach(order => {
      const phone = order.shipping_address?.phone;
      const email = order.shipping_address?.email || generateUniqueEmail(phone, order.id);
      const name = order.shipping_address?.name || 'Guest Customer';
      
      // Utiliser le téléphone comme clé principale, sinon l'email généré
      const customerKey = phone || email;
      
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: `guest_${customerKey}`,
          email: email,
          phone: phone || '',
          name: name,
          address: order.shipping_address?.address || '',
          city: order.shipping_address?.city || '',
          state: order.shipping_address?.state || '',
          zip_code: order.shipping_address?.zip_code || '',
          first_order: order.created_at,
          last_order: order.created_at,
          total_orders: 0,
          total_spent: 0,
          orders: [],
          completed_orders: 0,
          abandoned_carts: 0,
          status: 'completed', // sera mis à jour selon les commandes
          has_real_email: !!order.shipping_address?.email,
          has_phone: !!phone,
          contact_type: phone && order.shipping_address?.email ? 'both' : 
                       phone ? 'phone_only' : 
                       order.shipping_address?.email ? 'email_only' : 'none'
        });
      }

      const customer = customerMap.get(customerKey);
      customer.total_orders++;
      customer.total_spent += order.total;
      customer.orders.push(order);
      
      // Compter les commandes complétées vs abandonnées
      if (order.status === 'delivered' || order.status === 'shipped' || order.status === 'processing') {
        customer.completed_orders++;
      } else if (order.status === 'pending' || order.status === 'cancelled') {
        customer.abandoned_carts++;
      }
      
      if (new Date(order.created_at) > new Date(customer.last_order)) {
        customer.last_order = order.created_at;
      }
      if (new Date(order.created_at) < new Date(customer.first_order)) {
        customer.first_order = order.created_at;
      }
    });

    // Déterminer le statut final du client
    customerMap.forEach(customer => {
      if (customer.completed_orders > 0 && customer.abandoned_carts === 0) {
        customer.status = 'completed';
      } else if (customer.completed_orders > 0 && customer.abandoned_carts > 0) {
        customer.status = 'mixed';
      } else if (customer.completed_orders === 0 && customer.abandoned_carts > 0) {
        customer.status = 'abandoned';
      } else {
        customer.status = 'pending';
      }
    });

    return Array.from(customerMap.values());
  } catch (error) {
    console.error('Error fetching guest customers:', error);
    return [];
  }
};

// Récupérer les clients invités par statut
export const getGuestCustomersByStatus = async (status) => {
  try {
    const allCustomers = await getGuestCustomers();
    return allCustomers.filter(customer => customer.status === status);
  } catch (error) {
    console.error('Error fetching guest customers by status:', error);
    return [];
  }
};

// Fonction pour récupérer tous les paniers abandonnés
export const getAbandonedCarts = async () => {
  try {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select(`
        *,
        abandoned_cart_items (
          *,
          products (
            name,
            price,
            image_url
          )
        )
      `)
      .order('last_abandoned', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    throw error;
  }
};

// Fonction pour récupérer les statistiques des paniers abandonnés
export const getAbandonedCartStats = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_abandoned_cart_stats');

    if (error) throw error;
    return data[0] || {
      total_abandoned_customers: 0,
      total_abandoned_orders: 0,
      total_abandoned_value: 0,
      average_abandoned_value: 0
    };
  } catch (error) {
    console.error('Error fetching abandoned cart stats:', error);
    return {
      total_abandoned_customers: 0,
      total_abandoned_orders: 0,
      total_abandoned_value: 0,
      average_abandoned_value: 0
    };
  }
};

// Fonction pour ajouter ou mettre à jour un panier abandonné
export const addOrUpdateAbandonedCart = async (cartData) => {
  try {
    const { data, error } = await supabase
      .rpc('add_or_update_abandoned_cart', {
        p_name: cartData.name,
        p_email: cartData.email,
        p_phone: cartData.phone,
        p_address: cartData.address,
        p_city: cartData.city,
        p_state: cartData.state,
        p_zip_code: cartData.zip_code,
        p_total_value: cartData.total_value || 0,
        p_has_real_email: cartData.has_real_email || false
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding/updating abandoned cart:', error);
    throw error;
  }
};

// Fonction pour ajouter des articles à un panier abandonné
export const addAbandonedCartItems = async (cartId, items) => {
  try {
    const cartItems = items.map(item => ({
      cart_id: cartId,
      product_id: item.product_id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity
    }));

    const { data, error } = await supabase
      .from('abandoned_cart_items')
      .insert(cartItems);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding abandoned cart items:', error);
    throw error;
  }
};

// Fonction pour supprimer un panier abandonné
export const deleteAbandonedCart = async (cartId) => {
  try {
    const { error } = await supabase
      .from('abandoned_carts')
      .delete()
      .eq('id', cartId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting abandoned cart:', error);
    throw error;
  }
};

// Fonction pour récupérer un panier abandonné par ID
export const getAbandonedCartById = async (cartId) => {
  try {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select(`
        *,
        abandoned_cart_items (
          *,
          products (
            name,
            price,
            image_url
          )
        )
      `)
      .eq('id', cartId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching abandoned cart by ID:', error);
    throw error;
  }
};

// Fonction pour nettoyer les anciens paniers abandonnés (optionnel)
export const cleanupOldAbandonedCarts = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('abandoned_carts')
      .delete()
      .lt('last_abandoned', cutoffDate.toISOString());

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error cleaning up old abandoned carts:', error);
    throw error;
  }
};

// Fonction pour obtenir les paniers abandonnés avec contact
export const getAbandonedCartsWithContact = async () => {
  try {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .or('phone.is.not.null,email.is.not.null')
      .order('last_abandoned', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching abandoned carts with contact:', error);
    throw error;
  }
};

// Fonction pour marquer un panier comme récupéré (quand une commande est créée)
export const markCartAsRecovered = async (cartId) => {
  try {
    // Optionnel : marquer le panier comme récupéré ou le supprimer
    const { error } = await supabase
      .from('abandoned_carts')
      .delete()
      .eq('id', cartId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking cart as recovered:', error);
    throw error;
  }
};

// Récupérer les statistiques des clients invités
export const getGuestCustomerStats = async () => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null);

    if (error) throw error;

    // Compter les clients uniques par téléphone (priorité) ou email
    const uniqueCustomers = new Set();
    let totalRevenue = 0;
    let completedOrders = 0;
    let abandonedOrders = 0;
    let pendingOrders = 0;

    orders?.forEach(order => {
      const phone = order.shipping_address?.phone;
      const email = order.shipping_address?.email || generateUniqueEmail(phone, order.id);
      
      // Utiliser le téléphone comme identifiant principal, sinon l'email généré
      const customerKey = phone || email;
      uniqueCustomers.add(customerKey);
      
      if (order.status === 'delivered' || order.status === 'shipped' || order.status === 'processing') {
        totalRevenue += order.total;
        completedOrders++;
      } else if (order.status === 'pending' || order.status === 'cancelled') {
        abandonedOrders++;
      } else {
        pendingOrders++;
      }
    });

    return {
      totalGuests: uniqueCustomers.size,
      totalOrders: orders?.length || 0,
      totalRevenue,
      averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
      completedOrders,
      abandonedOrders,
      pendingOrders,
      conversionRate: orders?.length > 0 ? (completedOrders / orders.length) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching guest customer stats:', error);
    return {
      totalGuests: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      abandonedOrders: 0,
      pendingOrders: 0,
      conversionRate: 0
    };
  }
};

// Récupérer les nouveaux clients invités dans une période donnée
export const getNewGuestCustomers = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Compter les nouveaux clients uniques par téléphone ou email généré
    const newCustomers = new Set();
    orders?.forEach(order => {
      const phone = order.shipping_address?.phone;
      const email = order.shipping_address?.email || generateUniqueEmail(phone, order.id);
      const customerKey = phone || email;
      newCustomers.add(customerKey);
    });

    return newCustomers.size;
  } catch (error) {
    console.error('Error fetching new guest customers:', error);
    return 0;
  }
};

// Récupérer les clients invités actifs dans une période donnée
export const getActiveGuestCustomers = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Compter les clients actifs uniques par téléphone ou email généré
    const activeCustomers = new Set();
    orders?.forEach(order => {
      const phone = order.shipping_address?.phone;
      const email = order.shipping_address?.email || generateUniqueEmail(phone, order.id);
      const customerKey = phone || email;
      activeCustomers.add(customerKey);
    });

    return activeCustomers.size;
  } catch (error) {
    console.error('Error fetching active guest customers:', error);
    return 0;
  }
};

// Convertir un client invité en client authentifié
export const convertGuestToCustomer = async (guestKey, userData) => {
  try {
    // Mettre à jour les commandes du client invité avec le nouvel user_id
    const { error } = await supabase
      .from('orders')
      .update({ user_id: userData.id })
      .is('user_id', null)
      .or(`shipping_address->phone.eq.${guestKey},shipping_address->email.eq.${guestKey}`);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error converting guest to customer:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer l'historique des commandes d'un client invité
export const getGuestCustomerOrders = async (customerKey) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (
            name,
            image_url
          )
        )
      `)
      .is('user_id', null)
      .or(`shipping_address->phone.eq.${customerKey},shipping_address->email.eq.${customerKey}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return orders || [];
  } catch (error) {
    console.error('Error fetching guest customer orders:', error);
    return [];
  }
}; 