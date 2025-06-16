import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/currency';
import ProductImageCarousel from './ProductImageCarousel';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();

  const images = [
    product.image_url,
    product.image_url1,
    product.image_url2,
    product.image_url3,
    product.image_url4
  ];

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-w-1 aspect-h-1">
          <ProductImageCarousel images={images} />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-primary">
              {formatPrice(product.price)}
              {product.inventory === 0 && (
                <span className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">Rupture de stock</span>
              )}
            </p>
            <span className={`text-sm ${
              product.inventory > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.inventory > 0 ? t('products.inStock') : t('products.outOfStock')}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;