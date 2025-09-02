import { supabase } from '../lib/supabase';
import { isProduction, devLog } from '../utils/environment';

// Générer un ID de session unique pour les utilisateurs anonymes
const getSessionId = () => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Obtenir l'adresse IP (approximative via un service externe)
const getIpAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Impossible d\'obtenir l\'adresse IP:', error);
    return 'unknown';
  }
};

// localisation ip user
const getLocation = async (ipAddress) => {
  try {
    const response = await fetch(`https://ipinfo.io/${ipAddress}/json`);
    const data = await response.json();
    return data.city;
  } catch (error) {
    console.warn('Impossible d\'obtenir la localisation:', error);
    return 'unknown';
  }
};

// Service pour tracker les vues de produits
export const trackProductView = async (productId) => {
  // Ne tracker que si en production
  if (!isProduction()) {
    devLog(`[ANALYTICS] Product view tracking skipped (dev mode): ${productId}`);
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Exclure les admins du tracking
    if (user?.user_metadata?.is_admin) return;
    const sessionId = getSessionId();
    const ipAddress = await getIpAddress();
    const userAgent = navigator.userAgent;
    // localisation ip user
    const location = await getLocation(ipAddress);

    const { error } = await supabase
      .from('product_views')
      .insert({
        product_id: productId,
        user_id: user?.id || null,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        location: location
      });

    if (error) {
      console.error('Erreur lors du tracking de la vue produit:', error);
    }
  } catch (error) {
    console.error('Erreur lors du tracking de la vue produit:', error);
  }
};

// Service pour tracker les visites de pages
export const trackPageVisit = async (pagePath, referrer = null) => {
  // Ne tracker que si en production
  if (!isProduction()) {
    devLog(`[ANALYTICS] Page visit tracking skipped (dev mode): ${pagePath}`);
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Exclure les admins du tracking
    if (user?.user_metadata?.is_admin) return;
    const sessionId = getSessionId();
    const ipAddress = await getIpAddress();
    const userAgent = navigator.userAgent;
    // localisation ip user
    const location = await getLocation(ipAddress);

    const { error } = await supabase
      .from('page_visits')
      .insert({
        page_path: pagePath,
        user_id: user?.id || null,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer || document.referrer,
        location: location
      });

    if (error) {
      console.error('Erreur lors du tracking de la visite de page:', error);
    }
  } catch (error) {
    console.error('Erreur lors du tracking de la visite de page:', error);
  }
};

// Obtenir le nombre de vues d'un produit
export const getProductViewsCount = async (productId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_product_views_count', { p_product_id: productId });

    if (error) {
      console.error('Erreur lors de la récupération du nombre de vues:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de vues:', error);
    return 0;
  }
};

// Obtenir le nombre de visites d'une page
export const getPageVisitsCount = async (pagePath) => {
  try {
    const { data, error } = await supabase
      .rpc('get_page_visits_count', { p_page_path: pagePath });

    if (error) {
      console.error('Erreur lors de la récupération du nombre de visites:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de visites:', error);
    return 0;
  }
};

// Obtenir les statistiques quotidiennes
export const getDailyVisitsStats = async (days = 7) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch page visits and product views for the period
    const [pageVisitsResult, productViewsResult] = await Promise.all([
      supabase
        .from('page_visits')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      supabase
        .from('product_views')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ]);

    if (pageVisitsResult.error || productViewsResult.error) {
      console.error('Erreur lors de la récupération des statistiques:', pageVisitsResult.error || productViewsResult.error);
      return [];
    }

    // Group by day
    const dailyStats = {};
    
    // Process page visits
    pageVisitsResult.data?.forEach(visit => {
      const date = new Date(visit.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { page_visits: 0, product_views: 0 };
      }
      dailyStats[date].page_visits++;
    });

    // Process product views
    productViewsResult.data?.forEach(view => {
      const date = new Date(view.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { page_visits: 0, product_views: 0 };
      }
      dailyStats[date].product_views++;
    });

    // Fill missing days with 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        page_visits: dailyStats[dateStr]?.page_visits || 0,
        product_views: dailyStats[dateStr]?.product_views || 0
      });
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return [];
  }
};

// Obtenir les produits les plus vus
export const getMostViewedProducts = async (limit = 10) => {
  try {
    // Récupérer les vues des 30 derniers jours pour plus de pertinence
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('product_views')
      .select(`
        product_id,
        created_at,
        products (
          id,
          name,
          image_url,
          price,
          inventory,
          isActive
        )
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des produits populaires:', error);
      return [];
    }

    // Grouper par produit et compter les vues
    const productViews = {};
    data?.forEach(view => {
      if (view.products && view.products.isActive) {
        const productId = view.product_id;
        if (!productViews[productId]) {
          productViews[productId] = {
            product: view.products,
            views: 0,
            recentViews: 0
          };
        }
        productViews[productId].views++;
        
        // Compter les vues récentes (7 derniers jours)
        const viewDate = new Date(view.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (viewDate >= sevenDaysAgo) {
          productViews[productId].recentViews++;
        }
      }
    });

    // Trier par nombre de vues et ajouter des métriques
    const sortedProducts = Object.values(productViews)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        popularityScore: Math.round((item.views / Math.max(...Object.values(productViews).map(p => p.views), 1)) * 100),
        trend: item.recentViews > 0 ? 'up' : 'stable'
      }));

    return sortedProducts;
  } catch (error) {
    console.error('Erreur lors de la récupération des produits populaires:', error);
    return [];
  }
};

// Hook personnalisé pour tracker automatiquement les visites de pages
export const usePageTracking = () => {
  const trackCurrentPage = () => {
    const currentPath = window.location.pathname;
    trackPageVisit(currentPath);
  };

  return { trackCurrentPage };
};

// Obtenir le nombre total de vues
export const getTotalViews = async () => {
  try {
    const { count, error } = await supabase
      .from('product_views')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Erreur lors de la récupération du total des vues:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du total des vues:', error);
    return 0;
  }
};

// Obtenir le nombre total de visites
export const getTotalVisits = async () => {
  try {
    const { count, error } = await supabase
      .from('page_visits')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Erreur lors de la récupération du total des visites:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération du total des visites:', error);
    return 0;
  }
};

// Obtenir les statistiques quotidiennes des vues
export const getDailyStats = async (days = 7) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('product_views')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Erreur lors de la récupération des statistiques quotidiennes:', error);
      return [];
    }

    // Grouper par jour
    const dailyStats = {};
    data?.forEach(view => {
      const date = new Date(view.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // Remplir les jours manquants avec 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      result.push({
        date: dateStr,
        views: dailyStats[dateStr] || 0
      });
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques quotidiennes:', error);
    return [];
  }
};

// Obtenir les visites quotidiennes
export const getDailyVisits = async (days = 7) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('page_visits')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Erreur lors de la récupération des visites quotidiennes:', error);
      return [];
    }

    // Grouper par jour
    const dailyVisits = {};
    data?.forEach(visit => {
      const date = new Date(visit.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      dailyVisits[date] = (dailyVisits[date] || 0) + 1;
    });

    // Remplir les jours manquants avec 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      result.push({
        date: dateStr,
        visits: dailyVisits[dateStr] || 0
      });
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des visites quotidiennes:', error);
    return [];
  }
};

// Obtenir les produits les plus vus (alias pour getMostViewedProducts)
export const getTopViewedProducts = async (limit = 10) => {
  return getMostViewedProducts(limit);
};

// Obtenir le nombre de visiteurs actuellement actifs
export const getCurrentActiveVisitors = async (timeWindowMinutes = 5) => {
  try {
    const now = new Date();
    const timeThreshold = new Date(now.getTime() - (timeWindowMinutes * 60 * 1000));

    // Compter les sessions uniques actives dans la fenêtre de temps
    const { data, error } = await supabase
      .from('page_visits')
      .select('session_id, user_id, created_at')
      .gte('created_at', timeThreshold.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des visiteurs actifs:', error);
      return 0;
    }

    // Compter les sessions uniques (utilisateurs et invités)
    const activeSessions = new Set();
    data?.forEach(visit => {
      // Utiliser l'ID utilisateur si disponible, sinon l'ID de session
      const identifier = visit.user_id || visit.session_id;
      if (identifier) {
        activeSessions.add(identifier);
      }
    });

    return activeSessions.size;
  } catch (error) {
    console.error('Erreur lors de la récupération des visiteurs actifs:', error);
    return 0;
  }
};

// Obtenir l'historique des visiteurs actifs pour un graphique en temps réel
export const getActiveVisitorsHistory = async (dataPoints = 12, intervalMinutes = 1) => {
  try {
    const now = new Date();
    const history = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timePoint = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
      const timeThreshold = new Date(timePoint.getTime() - (5 * 60 * 1000)); // 5 minutes window

      const { data, error } = await supabase
        .from('page_visits')
        .select('session_id, user_id')
        .gte('created_at', timeThreshold.toISOString())
        .lte('created_at', timePoint.toISOString());

      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        history.push({
          time: timePoint.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          visitors: 0
        });
        continue;
      }

      // Compter les sessions uniques
      const activeSessions = new Set();
      data?.forEach(visit => {
        const identifier = visit.user_id || visit.session_id;
        if (identifier) {
          activeSessions.add(identifier);
        }
      });

      history.push({
        time: timePoint.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        visitors: activeSessions.size
      });
    }

    return history;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des visiteurs actifs:', error);
    return Array.from({ length: dataPoints }, (_, i) => ({
      time: new Date(Date.now() - ((dataPoints - 1 - i) * intervalMinutes * 60 * 1000))
        .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      visitors: 0
    }));
  }
}; 