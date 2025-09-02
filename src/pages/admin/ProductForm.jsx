import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ProductImageInput from '../../components/ProductImageInput';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  DollarSign, 
  Tag, 
  Image as ImageIcon, 
  Percent, 
  Calendar, 
  Palette, 
  Settings,
  Info,
  Save,
  X
} from 'lucide-react';

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
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <p className="text-gray-600 mt-1">
            {product ? 'Modifiez les informations de votre produit' : 'Ajoutez un nouveau produit à votre catalogue'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: T-shirt en coton bio"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Décrivez votre produit en détail..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Prix et stock</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock disponible *
                  </label>
                  <input
                    type="number"
                    name="inventory"
                    value={formData.inventory}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Produit actif (visible sur le site)</span>
                </label>
              </div>
            </div>

            {/* Promotion Section */}
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Promotion</h3>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="promotion_active"
                    checked={formData.promotion_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Activer une promotion sur ce produit</span>
                </label>

                {formData.promotion_active && (
                  <div className="space-y-4 bg-white rounded-lg p-4 border border-orange-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Réduction (%)
                      </label>
                      <input
                        type="number"
                        name="promotion_percentage"
                        value={formData.promotion_percentage}
                        onChange={handleChange}
                        min="1"
                        max="99"
                        placeholder="20"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                      />
                    </div>

                    {calculatedPrice && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          💰 Nouveau prix : {calculatedPrice} FCFA
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de début
                        </label>
                        <input
                          type="datetime-local"
                          name="promotion_start_date"
                          value={formData.promotion_start_date}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de fin
                        </label>
                        <input
                          type="datetime-local"
                          name="promotion_end_date"
                          value={formData.promotion_end_date}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                      <p>💡 <strong>Astuce :</strong> Laissez les dates vides pour une promotion permanente</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colors Section */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Couleurs disponibles</h3>
              </div>
              
              <div className="space-y-3">
                {formData.colors?.map((color, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-purple-200 rounded-lg">
                    <input
                      type="color"
                      value={color.hex || '#000000'}
                      onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Nom de la couleur"
                      value={color.name || ''}
                      onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={color.available !== false}
                        onChange={(e) => handleColorChange(index, 'available', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-gray-600">Disponible</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColor}
                  className="w-full py-3 px-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-colors font-medium"
                >
                  + Ajouter une couleur
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Images */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Images & Vidéos</h3>
              </div>
              
              <div className="space-y-4">
                <ProductImageInput value={formData.image_url} onChange={url => handleImageChange('image_url', url)} index={0} />
                <ProductImageInput value={formData.image_url1} onChange={url => handleImageChange('image_url1', url)} index={1} />
                <ProductImageInput value={formData.image_url2} onChange={url => handleImageChange('image_url2', url)} index={2} />
                <ProductImageInput value={formData.image_url3} onChange={url => handleImageChange('image_url3', url)} index={3} />
                <ProductImageInput value={formData.image_url4} onChange={url => handleImageChange('image_url4', url)} index={4} />
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Conseil :</strong> Ajoutez plusieurs images pour montrer votre produit sous différents angles. Vous pouvez aussi ajouter des vidéos !
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
          >
            <X className="h-4 w-4" />
            Annuler
          </button>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[140px] justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {product ? 'Mettre à jour' : 'Créer le produit'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 