import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ImageCarousel = ({ images, onImageChange }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(index, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <div className="relative h-64 bg-background-light rounded-lg overflow-hidden">
        {images[currentIndex] ? (
          <img
            src={images[currentIndex]}
            alt={`Product image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-light">
            {t('products.noImage')}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 text-text-dark p-2 rounded-full hover:bg-background transition-colors"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 text-text-dark p-2 rounded-full hover:bg-background transition-colors"
          >
            →
          </button>
        </>
      )}

      <div className="mt-4 grid grid-cols-5 gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <div className="aspect-square bg-background-light rounded-lg overflow-hidden">
              {image ? (
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-light text-xs">
                  {t('products.addImage')}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, index)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel; 