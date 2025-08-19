import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ProductImageCarousel = ({ images }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaTypes, setMediaTypes] = useState({});

  // Filtrer les images vides
  const validImages = images.filter(image => image);

  // Détecter le type de chaque média
  useEffect(() => {
    const detectMediaTypes = async () => {
      const types = {};
      
      for (let i = 0; i < validImages.length; i++) {
        const url = validImages[i];
        if (url) {
          // Essayer d'abord comme image
          const img = new window.Image();
          img.onload = () => {
            types[url] = 'image';
            setMediaTypes(prev => ({ ...prev, [url]: 'image' }));
          };
          img.onerror = () => {
            // Si ce n'est pas une image, considérer comme vidéo
            types[url] = 'video';
            setMediaTypes(prev => ({ ...prev, [url]: 'video' }));
          };
          img.src = url;
        }
      }
    };

    if (validImages.length > 0) {
      detectMediaTypes();
    }
  }, [validImages]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (validImages.length === 0) {
    return (
      <div className="relative aspect-square w-full bg-background-light rounded-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-text-light">
          {t('products.noImage')}
        </div>
      </div>
    );
  }

  const currentUrl = validImages[currentIndex];
  const currentMediaType = mediaTypes[currentUrl] || 'image';

  return (
    <div className="relative">
      <div className="relative aspect-square w-full bg-background-light rounded-lg overflow-hidden">
        {currentMediaType === 'video' ? (
          <video
            src={currentUrl}
            className="w-full h-full object-contain"
            controls
            muted
            preload="metadata"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <img
            src={currentUrl}
            alt={`Product media ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        )}
        <div 
          className="w-full h-full flex items-center justify-center text-text-light"
          style={{ display: 'none' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Média non disponible</span>
          </div>
        </div>
      </div>

      {validImages.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 text-text-dark p-2 rounded-full hover:bg-background transition-colors"
            aria-label="Previous media"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 text-text-dark p-2 rounded-full hover:bg-background transition-colors"
            aria-label="Next media"
          >
            →
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-background-dark hover:bg-background'
                }`}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductImageCarousel; 