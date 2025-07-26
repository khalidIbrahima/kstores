import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addItem } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        setFavorites(data || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast.error('Failed to fetch favorites');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const removeFavorite = async (id) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(favorites.filter(fav => fav.id !== id));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <div className="flex flex-col items-center">
          <Heart className="h-16 w-16 text-text-light" />
          <h2 className="mt-6 mb-4 text-2xl font-bold text-text-dark">No Favorites Yet</h2>
          <p className="mb-8 text-text-light">Start adding products to your favorites list</p>
          <Link
            to="/products"
            className="btn-primary inline-flex items-center"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-text-dark">Your Favorites</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((favorite) => (
          <motion.div
            key={favorite.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group overflow-hidden rounded-lg bg-background shadow-md transition-all hover:shadow-lg"
          >
            <Link to={`/product/${favorite.products.id}`} className="block overflow-hidden">
              <div className="h-64 overflow-hidden">
                <img
                  src={favorite.products.image_url}
                  alt={favorite.products.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-lg font-medium text-text-dark line-clamp-2">
                  {favorite.products.name}
                </h3>
                <div className="mb-2 flex items-center">
                  <div className="flex text-accent">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-text-light">
                    (27 {t('product.reviews')})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(favorite.products.price)}
                    {favorite.products.inventory === 0 && (
                      <span className="ml-2 px-2 py-1 rounded bg-accent-light text-accent text-xs font-semibold">Rupture de stock</span>
                    )}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addItem(favorite.products, 1);
                      }}
                      className="rounded-full bg-background-light p-2 text-text-dark transition-colors hover:bg-background hover:text-primary"
                      title="Add to Cart"
                      disabled={favorite.products.inventory === 0}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeFavorite(favorite.id);
                      }}
                      className="rounded-full bg-background-light p-2 text-accent transition-colors hover:bg-background hover:text-accent/80"
                      title="Remove from Favorites"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage