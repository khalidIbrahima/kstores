import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/currency';
import ProductImageCarousel from './ProductImageCarousel';
import { formatDescriptionForCard } from '../utils/formatDescription.jsx';

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
    <div className="card group bg-background hover:bg-background-light transition-colors">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-w-1 aspect-h-1 h-40">
          <ProductImageCarousel images={images} />
        </div>
        <div className="p-2">
          <h3 className="text-base font-medium text-text-dark mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-text-light mb-1 line-clamp-2">
            {formatDescriptionForCard(product.description)}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-primary">
              {formatPrice(product.price)}
              {product.inventory === 0 && (
                <span className="ml-2 px-2 py-1 rounded bg-accent-light text-accent text-xs font-semibold">
                  {t('products.outOfStock')}
                </span>
              )}
            </p>
            <span className={`text-xs ${
              product.inventory > 0 ? 'text-accent' : 'text-accent'
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