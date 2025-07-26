import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Search, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
<<<<<<< HEAD
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';
=======
import SocialMetaTags from '../components/SocialMetaTags';
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
import SocialShareButtons from '../components/SocialShareButtons';
import SocialMediaSection from '../components/SocialMediaSection';
import { formatDescriptionForCard } from '../utils/formatDescription.jsx';
import { toast } from 'react-hot-toast';
import ProductPrice from '../components/ProductPrice';
import PromotionBadge from '../components/PromotionBadge';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedColorForProduct, setSelectedColorForProduct] = useState({});
  const { addItem } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch active products only
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories(*),
            reviews(
              rate
            ),
            order_items(count)
          `)
          .eq('isActive', true);
        
        if (productsError) throw productsError;
        
        // Fetch views count for each product
        const productsWithViews = await Promise.all(
          products?.map(async (product) => {
            const { data: viewsCount } = await supabase
              .rpc('get_product_views_count', { p_product_id: product.id });
            return {
              ...product,
              views_count: viewsCount || 0
            };
          }) || []
        );
        
        if (productsError) throw productsError;
        
        // Fetch categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        
        // Calculer la moyenne des notes pour chaque produit
        const productsWithStats = productsWithViews?.map(product => {
          const avgRating = product.reviews?.length > 0 
            ? product.reviews.reduce((acc, review) => acc + review.rate, 0) / product.reviews.length 
            : 0;
          return {
            ...product,
            reviews: {
              count: product.reviews?.length || 0,
              avg: avgRating
            }
          };
        }) || [];
        
        setProducts(productsWithStats);
        setCategories(categories || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default: // newest
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    if (product.inventory > 0) {
      const selectedColor = selectedColorForProduct[product.id];
      
      // Vérifier si une couleur est requise mais non sélectionnée
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast.error(t('product.colorRequired'));
        return;
      }
      
      addItem(product, 1, selectedColor);
      // Réinitialiser la couleur sélectionnée pour ce produit
      setSelectedColorForProduct(prev => ({
        ...prev,
        [product.id]: null
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
<<<<<<< HEAD
      <DynamicSocialMetaTags 
        pageType="products"
        title={`${t('product.allProducts')} - KStores`}
        description={t('product.browseDescription')}
=======
      <SocialMetaTags 
        title={`${t('product.allProducts')} - KStores`}
        description={t('product.browseDescription')}
        keywords="produits, boutique en ligne, tech, électronique, livraison rapide, KStores"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `${t('product.allProducts')} - KStores`,
          "description": t('product.browseDescription'),
          "url": window.location.href,
          "publisher": {
            "@type": "Organization",
            "name": "KStores",
            "logo": {
              "@type": "ImageObject",
              "url": "/src/assets/logo-transparent.png"
            }
          },
          "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": filteredProducts.length,
            "itemListElement": filteredProducts.slice(0, 10).map((product, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Product",
                "name": product.name,
                "description": product.description,
                "image": product.image_url,
                "url": `${window.location.origin}/product/${product.id}`,
                "offers": {
                  "@type": "Offer",
                  "price": product.price,
                  "priceCurrency": "XOF",
                  "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              }
            }))
          }
        }}
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
      />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('product.allProducts')}</h1>
            <p className="text-gray-600">{t('product.browseDescription')}</p>
          </div>
          {/* <div className="mt-4 md:mt-0">
            <SocialShareButtons 
              title={`${t('product.allProducts')} - KStores`}
              description={t('product.browseDescription')}
              showTitle={false}
            />
          </div> */}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">{t('categories.all')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="newest">{t('product.sortBy.newest')}</option>
            <option value="price-low">{t('product.sortBy.priceLow')}</option>
            <option value="price-high">{t('product.sortBy.priceHigh')}</option>
            <option value="name">{t('product.sortBy.name')}</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-medium">{t('product.noProducts')}</h2>
          <p className="mt-2 text-gray-600">{t('product.adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
            >
              <Link to={`/product/${product.id}`} className="block overflow-hidden">
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span>Image non disponible</span>
                    </div>
                  </div>
                  {product.inventory === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        Écoulé
                      </span>
                    </div>
                  )}
                  <PromotionBadge product={product} size="sm" showEndDate={false} />
                </div>
                <div className="p-2">
                  <div className="mb-1 text-xs text-blue-600">{product.categories?.name}</div>
                  <h3 className="mb-1 text-base font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  
                  {/* Colors Display */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1">
                        {product.colors.filter(color => color.available !== false).slice(0, 5).map((color, index) => (
                          <div
                            key={index}
                            className={`w-4 h-4 rounded-full border cursor-pointer transition-colors ${
                              selectedColorForProduct[product.id]?.name === color.name 
                                ? 'border-primary ring-1 ring-primary' 
                                : 'border-gray-300 hover:border-primary'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedColorForProduct(prev => ({
                                ...prev,
                                [product.id]: color
                              }));
                            }}
                          />
                        ))}
                        {product.colors.filter(color => color.available !== false).length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{product.colors.filter(color => color.available !== false).length - 5}
                          </span>
                        )}
                      </div>
                      {selectedColorForProduct[product.id] && (
                        <p className="text-xs text-primary font-medium mt-1">
                          {selectedColorForProduct[product.id].name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-1 flex items-center">
                    <div className="flex text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(product.reviews?.avg || 0) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-xs text-gray-600">
                      ({product.reviews?.count || 0} {t('product.reviews')})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <ProductPrice product={product} size="base" showEndDate={false} />
                    </div>
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.inventory === 0}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${
                        product.inventory === 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {product.inventory === 0 ? 'Indisponible' : t('product.addToCart')}
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Section des réseaux sociaux */}
      <SocialMediaSection 
        variant="compact"
        className="mt-12 pt-8 border-t border-gray-200"
      />
    </div>
  );
};

export default ProductsPage;