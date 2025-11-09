import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import ProductImageInput from '../../components/ProductImageInput';
import ProductVariantsManager from '../../components/ProductVariantsManager';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
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
  X,
  AlertTriangle
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
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [calculatedPrice, setCalculatedPrice] = useState('');
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product && product.id) {
      console.log('ProductForm: Loading product data for', product.id);
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
      // Load existing variants
      console.log('ProductForm: Fetching variants for product', product.id);
      fetchProductVariants(product.id);
    } else {
      console.log('ProductForm: No product, resetting form');
      setFormData(initialState);
      setCalculatedPrice('');
      setVariants([]);
    }
  }, [product]);

  const fetchProductVariants = async (productId) => {
    if (!productId) return;
    setVariantsLoading(true);
    try {
      // Fetch variants with their options
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*, product_variant_options(id, name, image_url, display_order, stock)')
        .eq('product_id', productId)
        .order('display_order');

      if (variantsError) throw variantsError;
      
      // Transform the data structure: product_variant_options -> options
      const transformedVariants = (variantsData || []).map(variant => ({
        ...variant,
        options: (variant.product_variant_options || []).map(opt => ({
          id: opt.id,
          name: opt.name,
          image_url: opt.image_url || '',
          display_order: opt.display_order || 0,
          stock: typeof opt.stock === 'number' ? opt.stock : ''
        }))
      }));
      
      console.log('fetchProductVariants: Loaded variants:', transformedVariants.length, transformedVariants);
      setVariants(transformedVariants);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast.error('Erreur lors du chargement des variantes');
    } finally {
      setVariantsLoading(false);
    }
  };

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



  const saveVariants = async (productId) => {
    try {
      // Check authentication and admin status
      if (!user) {
        console.error('❌ User not authenticated');
        toast.error('Vous devez être connecté pour sauvegarder des variantes');
        throw new Error('User not authenticated');
      }
      
      if (!isAdmin) {
        console.error('❌ User is not admin');
        toast.error('Vous devez être administrateur pour sauvegarder des variantes');
        throw new Error('User is not admin');
      }
      
      console.log('✅ User authenticated as admin:', user.email);
      
      if (!productId) {
        console.log('saveVariants: No productId provided');
        return;
      }
      
      if (!variants || variants.length === 0) {
        console.log('saveVariants: No variants to save, cleaning up existing variants');
        // If no variants, delete all existing variants for this product
        if (product?.id) {
          const { data: allVariants, error: fetchError } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId);
          
          if (fetchError) {
            console.error('❌ Error fetching existing variants for cleanup:', fetchError);
            throw fetchError;
          }
          
          if (allVariants && allVariants.length > 0) {
            const variantIds = allVariants.map(v => v.id);
            const { error: deleteError } = await supabase
              .from('product_variants')
              .delete()
              .in('id', variantIds);
            
            if (deleteError) {
              console.error('❌ Error deleting old variants:', deleteError);
              throw deleteError;
            }
          }
        }
        return;
      }

      console.log('saveVariants: Saving variants', variants.length, JSON.stringify(variants, null, 2));

      const variantsMissingName = variants.filter((variant) => !variant.name || variant.name.trim() === '');
      const optionsMissingName = variants.flatMap((variant) =>
        (variant.options || []).filter((option) => !option.name || option.name.trim() === '')
      );
      const variantsWithoutOptions = variants.filter(
        (variant) => (variant.options || []).length === 0
      );

      if (variantsMissingName.length > 0 || optionsMissingName.length > 0 || variantsWithoutOptions.length > 0) {
        let message;
        if (variantsMissingName.length > 0 && optionsMissingName.length > 0) {
          message = "Veuillez nommer toutes les variantes et leurs options avant d'enregistrer.";
        } else if (variantsMissingName.length > 0) {
          message = "Veuillez nommer chaque variante avant d'enregistrer.";
        } else if (optionsMissingName.length > 0) {
          message = "Veuillez nommer chaque option de variante avant d'enregistrer.";
        } else {
          message = "Chaque variante doit comporter au moins une option.";
        }
        throw new Error(message);
      }

      let savedCount = 0;
      const variantIdMap = {};
      const persistedVariantIds = new Set();

      for (const variant of variants) {
        // Skip variants without a name
        if (!variant.name || variant.name.trim() === '') {
          console.log('⚠️ Skipping variant without name:', variant);
          continue;
        }
        
        console.log(`📦 Processing variant: ${variant.name}, id: ${variant.id}, options: ${variant.options?.length || 0}`);
        
        let variantId = variant.id;
        const originalVariantId = variantId;
        
        // Skip temp IDs that start with "temp-"
        if (variantId && variantId.startsWith('temp-')) {
          console.log(`🔄 Converting temp ID to null for variant: ${variant.name}`);
          variantId = null;
        }

        // Save or update variant
        if (variantId) {
          // Update existing variant
          console.log(`✏️ Updating existing variant with id: ${variantId}`);
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({
              name: variant.name,
              display_order: variant.display_order
            })
            .eq('id', variantId);
          if (updateError) {
            console.error('❌ Error updating variant:', updateError);
            throw updateError;
          }
          console.log(`✅ Updated variant: ${variant.name}`);
        } else {
          // Create new variant
          console.log(`➕ Creating new variant: ${variant.name} for product: ${productId}`);
          const { data: newVariant, error: insertError } = await supabase
            .from('product_variants')
            .insert([{
              product_id: productId,
              name: variant.name,
              display_order: variant.display_order || 0
            }])
            .select()
            .single();
          if (insertError) {
            console.error('❌ Error inserting variant:', insertError);
            console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
            throw insertError;
          }
          variantId = newVariant.id;
          console.log(`✅ Created variant with id: ${variantId}`);
        }

        if (originalVariantId && originalVariantId.startsWith('temp-')) {
          variantIdMap[originalVariantId] = variantId;
        }
        persistedVariantIds.add(variantId);

        // Save variant options
        console.log(`📝 Variant ${variant.name} has ${variant.options?.length || 0} options`);
        if (variant.options && variant.options.length > 0) {
          const existingOptionIds = [];
          
          for (const option of variant.options) {
            // Skip options without a name
            if (!option.name || option.name.trim() === '') {
              console.log('⚠️ Skipping option without name:', option);
              continue;
            }
            
            let optionId = option.id;
            
            if (optionId && optionId.startsWith('temp-')) {
              console.log(`🔄 Converting temp option ID to null: ${option.name}`);
              optionId = null;
            }

            let stockValue = null;
            if (option.stock !== '' && option.stock !== null && option.stock !== undefined) {
              const parsedStock = Number(option.stock);
              if (Number.isFinite(parsedStock)) {
                stockValue = Math.max(0, Math.floor(parsedStock));
              }
            }

            if (optionId) {
              // Update existing option
              console.log(`✏️ Updating option: ${option.name} (id: ${optionId})`);
              const { error: updateError } = await supabase
                .from('product_variant_options')
                .update({
                  name: option.name,
                  image_url: option.image_url || null,
                  display_order: option.display_order || 0,
                  stock: Number.isFinite(stockValue) ? stockValue : null
                })
                .eq('id', optionId);
              if (updateError) {
                console.error('❌ Error updating option:', updateError);
                throw updateError;
              }
              existingOptionIds.push(optionId);
              console.log(`✅ Updated option: ${option.name}`);
            } else {
              // Create new option
              console.log(`➕ Creating new option: ${option.name} for variant: ${variantId}`);
              const { data: newOption, error: insertError } = await supabase
                .from('product_variant_options')
                .insert([{
                  variant_id: variantId,
                  name: option.name,
                  image_url: option.image_url || null,
                  display_order: option.display_order || 0,
                  stock: Number.isFinite(stockValue) ? stockValue : null
                }])
                .select()
                .single();
              if (insertError) {
                console.error('❌ Error inserting option:', insertError);
                console.error('❌ Insert option error details:', JSON.stringify(insertError, null, 2));
                throw insertError;
              }
              existingOptionIds.push(newOption.id);
              console.log(`✅ Created option: ${option.name} with id: ${newOption.id}`);
            }
          }

          console.log(`✅ Saved ${existingOptionIds.length} options for variant ${variant.name}`);

          // Delete options that were removed
          const { data: allOptions, error: fetchOptionsError } = await supabase
            .from('product_variant_options')
            .select('id')
            .eq('variant_id', variantId);
          
          if (fetchOptionsError) {
            console.error('❌ Error fetching options for cleanup:', fetchOptionsError);
            throw fetchOptionsError;
          }
          
          if (allOptions) {
            const optionsToDelete = allOptions
              .filter(opt => !existingOptionIds.includes(opt.id))
              .map(opt => opt.id);
            
            if (optionsToDelete.length > 0) {
              console.log(`🗑️ Deleting ${optionsToDelete.length} old options`);
              const { error: deleteOptionsError } = await supabase
                .from('product_variant_options')
                .delete()
                .in('id', optionsToDelete);
              
              if (deleteOptionsError) {
                console.error('❌ Error deleting old options:', deleteOptionsError);
                throw deleteOptionsError;
              }
            }
          }
        }
        
        savedCount++;
      }
      
      console.log(`✅ saveVariants: Successfully saved ${savedCount} variants`);

      // Delete variants that were removed
      if (product?.id) {
        console.log('🧹 Cleaning up removed variants...');
        const resolvedVariantIds = variants
          .map((v) => {
            if (v.id && v.id.startsWith('temp-')) {
              return variantIdMap[v.id] || null;
            }
            return v.id;
          })
          .filter(Boolean);

        // Include any variant IDs created during this save operation (in case variants array was empty or reset)
        persistedVariantIds.forEach((id) => resolvedVariantIds.push(id));
        const resolvedVariantIdSet = new Set(resolvedVariantIds);

        const { data: allVariants, error: fetchAllError } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId);
        
        if (fetchAllError) {
          console.error('❌ Error fetching all variants for cleanup:', fetchAllError);
          throw fetchAllError;
        }
        
        if (allVariants) {
          const variantsToDelete = allVariants
            .filter(v => !resolvedVariantIdSet.has(v.id))
            .map(v => v.id);
          
          if (variantsToDelete.length > 0) {
            console.log(`🗑️ Deleting ${variantsToDelete.length} removed variants`);
            const { error: deleteVariantsError } = await supabase
              .from('product_variants')
              .delete()
              .in('id', variantsToDelete);
            
            if (deleteVariantsError) {
              console.error('❌ Error deleting removed variants:', deleteVariantsError);
              throw deleteVariantsError;
            }
          }
        }
      }
      
      console.log('✅ saveVariants: Complete!');
    } catch (error) {
      console.error('❌ FATAL ERROR in saveVariants:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  const handleVariantsChange = useCallback((newVariants) => {
    setVariants(newVariants);
  }, []);

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
      
      let productId;
      let error;
      if (product) {
        productId = product.id;
        const { error: updateError } = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', product.id);
        error = updateError;
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([dataToSave])
          .select()
          .single();
        error = insertError;
        if (newProduct) productId = newProduct.id;
      }
      if (error) throw error;

      // Save variants after product is saved
      if (productId) {
        console.log('About to save variants:', variants);
        await saveVariants(productId);
        console.log('Variants saved successfully');
      } else {
        console.error('No productId available to save variants');
      }

      toast.success(product ? t('products.save_success') : t('products.create_success'));
      
      // Reset form state after successful save
      setFormData(initialState);
      setCalculatedPrice('');
      setVariants([]);
      
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(t('products.save_error') + ': ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                {product ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                {product ? 'Modifiez les informations de votre produit' : 'Remplissez les informations ci-dessous pour ajouter un nouveau produit à votre catalogue'}
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          
          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Basic Information Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 sm:p-6 border border-blue-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. Informations de base</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Commencez par les informations essentielles</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: T-shirt en coton bio"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Décrivez votre produit en détail..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 sm:p-6 border border-green-200 dark:border-gray-600 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. Prix et stock</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Définissez le prix et la quantité disponible</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock disponible *
                  </label>
                  <input
                    type="number"
                    name="inventory"
                    value={formData.inventory}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
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

            {/* Promotion and Variants Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Promotion Section */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 sm:p-6 border border-orange-200 dark:border-orange-800 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Percent className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">3. Promotion</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Optionnel - Offrez une réduction</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="promotion_active"
                    checked={formData.promotion_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activer une promotion sur ce produit</span>
                </label>

                {formData.promotion_active && (
                  <div className="space-y-4 bg-white dark:bg-gray-600 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-500 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date de début
                        </label>
                        <input
                          type="datetime-local"
                          name="promotion_start_date"
                          value={formData.promotion_start_date}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-500 dark:text-gray-100 px-4 py-3 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date de fin
                        </label>
                        <input
                          type="datetime-local"
                          name="promotion_end_date"
                          value={formData.promotion_end_date}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-500 dark:text-gray-100 px-4 py-3 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
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

            </div>

            {/* Variants Section - Full Width */}
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">4. Variantes</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Optionnel - Ajoutez des options (couleurs, tailles, motifs)</p>
                  </div>
                </div>
              </div>
              
              {/* Authentication Warning */}
              {(!user || !isAdmin) && (
                <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        ⚠️ Authentification requise
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Vous devez être connecté en tant qu'administrateur pour enregistrer des variantes. Les variantes ne seront pas sauvegardées.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <ProductVariantsManager
                productId={product?.id}
                variants={variants}
                onVariantsChange={handleVariantsChange}
              />
            </div>

            {/* Images & Média Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 sm:p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">5. Images & Média</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ajoutez jusqu'à 5 images ou vidéos</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <ProductImageInput value={formData.image_url} onChange={url => handleImageChange('image_url', url)} index={0} />
                <ProductImageInput value={formData.image_url1} onChange={url => handleImageChange('image_url1', url)} index={1} />
                <ProductImageInput value={formData.image_url2} onChange={url => handleImageChange('image_url2', url)} index={2} />
                <ProductImageInput value={formData.image_url3} onChange={url => handleImageChange('image_url3', url)} index={3} />
                <ProductImageInput value={formData.image_url4} onChange={url => handleImageChange('image_url4', url)} index={4} />
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  💡 <strong>Conseil :</strong> Ajoutez plusieurs images pour montrer votre produit sous différents angles. Vous pouvez aussi ajouter des vidéos !
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 sm:pt-8 border-t-2 border-gray-200 dark:border-gray-700 mt-8">
          <button 
            type="button" 
            onClick={() => {
              setFormData(initialState);
              setCalculatedPrice('');
              setVariants([]);
              if (onClose) onClose();
            }} 
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium text-base shadow-sm hover:shadow-md"
          >
            <X className="h-5 w-5" />
            Annuler
          </button>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] min-w-[180px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Sauvegarde en cours...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{product ? 'Mettre à jour le produit' : 'Créer le produit'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 