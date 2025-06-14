import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg">
      <Link to={`/product/${product.id}`} className="block overflow-hidden">
        <div className="h-64 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <div className="mb-2 text-sm text-blue-600">{product.categories?.name}</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          <div className="mb-2 flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              (27 {t('product.reviews')})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-blue-700">
              ${product.price.toFixed(2)}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addItem(product, 1);
                }}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-blue-600 hover:text-white"
              >
                {t('product.addToCart')}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  isFavorite(product.id) ? removeFromFavorites(product.id) : addToFavorites(product);
                }}
                className={`rounded-full p-2 transition-colors ${
                  isFavorite(product.id)
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;