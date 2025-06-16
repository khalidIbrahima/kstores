import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProductImageInput from '../../components/ProductImageInput';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const initialState = {
  name: '',
  description: '',
  price: '',
  inventory: '',
  image_url: '',
  image_url1: '',
  image_url2: '',
  image_url3: '',
  image_url4: '',
  category_id: '',
  isActive: true
};

const ProductForm = ({ product, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        inventory: product.inventory?.toString() || '',
        image_url: product.image_url || '',
        image_url1: product.image_url1 || '',
        image_url2: product.image_url2 || '',
        image_url3: product.image_url3 || '',
        image_url4: product.image_url4 || '',
        category_id: product.category_id || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    } else {
      setFormData(initialState);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (key, url) => {
    setFormData(prev => ({ ...prev, [key]: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        inventory: parseInt(formData.inventory)
      };
      let error;
      if (product) {
        const { error: updateError } = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', product.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([dataToSave]);
        error = insertError;
      }
      if (error) throw error;
      toast.success(product ? t('products.save_success') : t('products.create_success'));
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      toast.error(t('products.save_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('products.name')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('products.description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('products.price')}</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('products.inventory')}</label>
              <input
                type="number"
                name="inventory"
                value={formData.inventory}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('products.category')}</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">{t('products.select_category')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              id="isActive"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">{t('products.active')}</label>
          </div>
        </div>
        <div className="space-y-4">
          <ProductImageInput value={formData.image_url} onChange={url => handleImageChange('image_url', url)} index={0} />
          <ProductImageInput value={formData.image_url1} onChange={url => handleImageChange('image_url1', url)} index={1} />
          <ProductImageInput value={formData.image_url2} onChange={url => handleImageChange('image_url2', url)} index={2} />
          <ProductImageInput value={formData.image_url3} onChange={url => handleImageChange('image_url3', url)} index={3} />
          <ProductImageInput value={formData.image_url4} onChange={url => handleImageChange('image_url4', url)} index={4} />
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
        <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('products.saving') : product ? t('common.save') : t('products.create')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm; 