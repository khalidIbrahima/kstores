import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import ImageCarousel from './ImageCarousel';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    status: 'active',
    image_url: '',
    image_url1: '',
    image_url2: '',
    image_url3: '',
    image_url4: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        category: product.category || '',
        status: product.status || 'active',
        image_url: product.image_url || '',
        image_url1: product.image_url1 || '',
        image_url2: product.image_url2 || '',
        image_url3: product.image_url3 || '',
        image_url4: product.image_url4 || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, imageUrl) => {
    const imageField = index === 0 ? 'image_url' : `image_url${index}`;
    setFormData(prev => ({
      ...prev,
      [imageField]: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }

      onSubmit();
    } catch (error) {
      setError(t('products.error'));
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const images = [
    formData.image_url,
    formData.image_url1,
    formData.image_url2,
    formData.image_url3,
    formData.image_url4
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-accent-light border border-accent text-accent px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-dark">
          {t('products.images')}
        </label>
        <div className="mt-2">
          <ImageCarousel
            images={images}
            onImageChange={handleImageChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-dark">
          {t('products.name')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="input mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-dark">
          {t('products.description')}
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="input mt-1 block w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-text-dark">
            {t('products.price')}
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="input mt-1 block w-full"
          />
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-text-dark">
            {t('products.stock')}
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min="0"
            className="input mt-1 block w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-dark">
          {t('products.category')}
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="input mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-text-dark">
          {t('products.status')}
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="input mt-1 block w-full"
        >
          <option value="active">{t('products.statuses.active')}</option>
          <option value="inactive">{t('products.statuses.inactive')}</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-background-dark rounded-md text-sm font-medium text-text-dark hover:bg-background-light transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? t('common.saving') : (product ? t('common.update') : t('common.create'))}
        </button>
      </div>
    </form>
  );
};

export default ProductForm; 