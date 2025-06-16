import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const ProductImageInput = ({ value, onChange, index }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (value) {
      // Vérifier si l'URL est valide
      const img = new Image();
      img.onload = () => {
        setPreview(value);
        setError('');
      };
      img.onerror = () => {
        setPreview('');
        setError(t('admin.products.invalidImageUrl'));
      };
      img.src = value;
    } else {
      setPreview('');
      setError('');
    }
  }, [value, t]);

  const handleChange = (e) => {
    const url = e.target.value;
    onChange(url);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {t('admin.products.image')} {index + 1}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-800"
            aria-label={t('admin.products.removeImage')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="url"
            value={value}
            onChange={handleChange}
            placeholder={t('admin.products.imageUrlPlaceholder')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        {preview && (
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageInput; 