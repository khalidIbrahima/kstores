import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProductImageInput from '../../components/ProductImageInput';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Percent, Calendar, Tag } from 'lucide-react';

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
  isActive: true,
  colors: [],
  // Promotion fields
  promotion_active: false,
  promotion_percentage: '',
  promotion_start_date: '',
  promotion_end_date: ''
};

const ProductForm = ({ product, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [calculatedPrice, setCalculatedPrice] = useState('');

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
        isActive: product.isActive !== undefined ? product.isActive : true,
        colors: product.colors || [],
        // Promotion fields
        promotion_active: product.promotion_active || false,
        promotion_percentage: product.promotion_percentage?.toString() || '',
        promotion_start_date: product.promotion_start_date ? new Date(product.promotion_start_date).toISOString().slice(0, 16) : '',
        promotion_end_date: product.promotion_end_date ? new Date(product.promotion_end_date).toISOString().slice(0, 16) : ''
      });
    } else {
      setFormData(initialState);
    }
  }, [product]);

  // Calculate new price when promotion percentage changes
  useEffect(() => {
    if (formData.promotion_active && formData.promotion_percentage && formData.price) {
      const originalPrice = parseFloat(formData.price);
      const percentage = parseFloat(formData.promotion_percentage);
      const newPrice = originalPrice * (1 - percentage / 100);
      setCalculatedPrice(newPrice.toFixed(2));
    } else {
      setCalculatedPrice('');
    }
  }, [formData.promotion_active, formData.promotion_percentage, formData.price]);

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

  const handleColorChange = (index, field, value) => {
    setFormData(prev => {
      const newColors = [...(prev.colors || [])];
      if (!newColors[index]) {
        newColors[index] = { name: '', hex: '#000000', available: true };
      }
      newColors[index][field] = value;
      return { ...prev, colors: newColors };
    });
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...(prev.colors || []), { name: '', hex: '#000000', available: true }]
    }));
  };

  const removeColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        inventory: parseInt(formData.inventory),
        promotion_percentage: formData.promotion_percentage ? parseInt(formData.promotion_percentage) : null,
        promotion_start_date: formData.promotion_start_date || null,
        promotion_end_date: formData.promotion_end_date || null
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
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('products.price')}</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
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
            <div className="flex items-center gap-2">
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

            {/* Promotion Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-medium text-gray-900">Promotion</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="promotion_active"
                    checked={formData.promotion_active}
                    onChange={handleChange}
                    id="promotion_active"
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="promotion_active" className="text-sm font-medium text-gray-700">
                    Activer la promotion
                  </label>
                </div>

                {formData.promotion_active && (
                  <div className="space-y-4 pl-6 border-l-2 border-orange-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <Percent className="inline h-4 w-4 mr-1" />
                        Pourcentage de réduction (%)
                      </label>
                      <input
                        type="number"
                        name="promotion_percentage"
                        value={formData.promotion_percentage}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Ex: 20"
                      />
                    </div>

                    {calculatedPrice && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800">
                          <span className="font-medium">Nouveau prix calculé :</span> {calculatedPrice} FCFA
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Date de début
                        </label>
                        <input
                          type="datetime-local"
                          name="promotion_start_date"
                          value={formData.promotion_start_date}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Date de fin
                        </label>
                        <input
                          type="datetime-local"
                          name="promotion_end_date"
                          value={formData.promotion_end_date}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <p>• Laissez les dates vides pour une promotion permanente</p>
                      <p>• Le prix original sera automatiquement sauvegardé</p>
                      <p>• La promotion sera visible sur le site si elle est active</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colors Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleurs disponibles</label>
              <div className="space-y-3">
                {formData.colors?.map((color, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="color"
                      value={color.hex || '#000000'}
                      onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Nom de la couleur"
                      value={color.name || ''}
                      onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={color.available !== false}
                        onChange={(e) => handleColorChange(index, 'available', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">Disponible</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColor}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  + Ajouter une couleur
                </button>
              </div>
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
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? t('products.saving') : product ? t('common.save') : t('products.create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 