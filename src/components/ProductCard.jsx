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
          
          {/* Colors and Properties Indicators */}
          <div className="mb-2 space-y-1">
            {/* Colors Display */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Couleurs:</span>
                <div className="flex gap-1">
                  {product.colors.filter(color => color.available !== false).slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                  {product.colors.filter(color => color.available !== false).length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{product.colors.filter(color => color.available !== false).length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Properties Display */}
            {product.properties && product.properties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.properties.slice(0, 2).map((property, index) => (
                  <div key={index} className="flex items-center">
                    {property.type === 'image' && property.imageOptions && property.imageOptions.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">{property.name}:</span>
                        <div className="flex gap-0.5">
                          {property.imageOptions.slice(0, 2).map((option, optionIndex) => (
                            <img
                              key={optionIndex}
                              src={option.url}
                              alt={option.name}
                              className="w-4 h-4 rounded border border-gray-300 object-cover"
                              title={option.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                          {property.imageOptions.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{property.imageOptions.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                        title={`${property.name}: ${property.type === 'select' ? property.values?.join(', ') : property.type}`}
                      >
                        {property.name}
                      </span>
                    )}
                  </div>
                ))}
                {product.properties.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    +{product.properties.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          
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