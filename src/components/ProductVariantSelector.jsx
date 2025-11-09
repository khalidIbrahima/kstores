import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const ProductVariantSelector = ({
  variants = [],
  selectedVariants = {},
  onVariantChange,
  optionImageSize = 50,
  colorDotSize = 40,
  previewSize = 250
}) => {
  const [localSelections, setLocalSelections] = useState(selectedVariants);

  useEffect(() => {
    setLocalSelections(selectedVariants);
  }, [selectedVariants]);

  const handleOptionSelect = (variantName, optionName, optionId, optionImage, optionStock) => {
    const newSelections = {
      ...localSelections,
      [variantName]: {
        name: optionName,
        id: optionId,
        image_url: optionImage,
        stock: optionStock
      }
    };
    setLocalSelections(newSelections);
    if (onVariantChange) {
      onVariantChange(newSelections);
    }
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {variants.map((variant) => {
        const selectedOption = localSelections[variant.name];
        const options = variant.product_variant_options || [];
        
        if (options.length === 0) return null;

        return (
          <div key={variant.id} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
              {variant.name}
              {selectedOption && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({selectedOption.name})
                </span>
              )}
            </label>
            
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selectedOption?.id === option.id;
                const isColorVariant = variant.name.toLowerCase().includes('couleur') || 
                                     variant.name.toLowerCase().includes('color');
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionSelect(
                      variant.name, 
                      option.name, 
                      option.id, 
                      option.image_url,
                      option.stock ?? null
                    )}
                    className={`
                      group relative flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                      }
                    `}
                  >
                    {option.image_url && (
                      <div className="flex-shrink-0">
                        {isColorVariant ? (
                          <div
                            className="rounded-full border-2 border-gray-300 dark:border-gray-500"
                            style={{ 
                              width: colorDotSize,
                              height: colorDotSize,
                              backgroundColor: option.name.toLowerCase() === option.image_url ? option.image_url : 'transparent',
                              backgroundImage: option.name.toLowerCase() !== option.image_url ? `url(${option.image_url})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        ) : (
                          <img
                            src={option.image_url}
                            alt={option.name}
                            className="rounded object-cover border border-gray-200 dark:border-gray-600"
                            style={{ width: optionImageSize, height: optionImageSize }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    )}
                    {option.image_url && (
                      <div className="pointer-events-none absolute inset-0 hidden group-hover:flex justify-center items-start">
                        <div
                          className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-full -translate-y-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-2xl bg-white/95 dark:bg-gray-900/95 p-4"
                          style={{ width: previewSize, height: previewSize }}
                        >
                          <img
                            src={option.image_url}
                            alt={`${option.name} aperçu`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                    <span className="text-sm">{option.name}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductVariantSelector;





