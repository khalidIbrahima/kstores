import { supabase } from '../lib/supabase';

// Fonction pour générer des données de test pour les analytics
export const generateTestAnalyticsData = async () => {
  try {
    console.log('Génération des données de test pour les analytics...');

    // Récupérer tous les produits
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('isActive', true);

    if (!products || products.length === 0) {
      console.log('Aucun produit trouvé pour générer des données de test');
      return;
    }

    // Générer des vues de produits pour les 30 derniers jours
    const now = new Date();
    const testData = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      
      // Générer 5-20 vues par jour
      const dailyViews = Math.floor(Math.random() * 16) + 5;
      
      for (let j = 0; j < dailyViews; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        
        testData.push({
          product_id: randomProduct.id,
          user_id: null, // Utilisateur anonyme
          session_id: `test_session_${i}_${j}`,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Test Browser)',
          created_at: date.toISOString()
        });
      }
    }

    // Générer des visites de pages
    const pages = ['/', '/products', '/about', '/contact', '/cart'];
    const pageVisits = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      
      // Générer 10-30 visites par jour
      const dailyVisits = Math.floor(Math.random() * 21) + 10;
      
      for (let j = 0; j < dailyVisits; j++) {
        const randomPage = pages[Math.floor(Math.random() * pages.length)];
        
        pageVisits.push({
          page_path: randomPage,
          user_id: null,
          session_id: `test_page_session_${i}_${j}`,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://google.com',
          created_at: date.toISOString()
        });
      }
    }

    // Insérer les données de test
    if (testData.length > 0) {
      const { error: productViewsError } = await supabase
        .from('product_views')
        .insert(testData);

      if (productViewsError) {
        console.error('Erreur lors de l\'insertion des vues de produits:', productViewsError);
      } else {
        console.log(`${testData.length} vues de produits générées`);
      }
    }

    if (pageVisits.length > 0) {
      const { error: pageVisitsError } = await supabase
        .from('page_visits')
        .insert(pageVisits);

      if (pageVisitsError) {
        console.error('Erreur lors de l\'insertion des visites de pages:', pageVisitsError);
      } else {
        console.log(`${pageVisits.length} visites de pages générées`);
      }
    }

    console.log('Génération des données de test terminée !');
  } catch (error) {
    console.error('Erreur lors de la génération des données de test:', error);
  }
};

// Fonction pour nettoyer les données de test
export const clearTestAnalyticsData = async () => {
  try {
    console.log('Nettoyage des données de test...');

    const { error: productViewsError } = await supabase
      .from('product_views')
      .delete()
      .like('session_id', 'test_session_%');

    const { error: pageVisitsError } = await supabase
      .from('page_visits')
      .delete()
      .like('session_id', 'test_page_session_%');

    if (productViewsError) {
      console.error('Erreur lors du nettoyage des vues de produits:', productViewsError);
    }

    if (pageVisitsError) {
      console.error('Erreur lors du nettoyage des visites de pages:', pageVisitsError);
    }

    console.log('Nettoyage terminé !');
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}; 