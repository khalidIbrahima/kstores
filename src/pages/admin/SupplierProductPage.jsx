import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Package, Link, User, Hash, Tag, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';

const SupplierProductPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    supplier_name: '',
    supplier_profile_url: '',
    ref: '',
    sku: '',
    images: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageAdd = (imageUrl) => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Fetch product data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchProduct();
    }
  }, [id, isEditMode]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_product')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        url: data.url || '',
        supplier_name: data.supplier_name || '',
        supplier_profile_url: data.supplier_profile_url || '',
        ref: data.ref || '',
        sku: data.sku || '',
        images: data.images || []
      });
    } catch (error) {
      console.error('Error fetching supplier product:', error);
      toast.error('Failed to fetch supplier product');
      navigate('/admin/supplier-products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.supplier_name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isEditMode) {
        // Update existing product
        const { data, error } = await supabase
          .from('supplier_product')
          .update(formData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Supplier product updated successfully!');
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('supplier_product')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Supplier product created successfully!');
      }
      
      // Clear form only if creating new product
      if (!isEditMode) {
        setFormData({
          name: '',
          url: '',
          supplier_name: '',
          supplier_profile_url: '',
          ref: '',
          sku: '',
          images: []
        });
      }
      
      navigate('/admin/supplier-products');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} supplier product:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} supplier product`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditMode ? 'Edit Supplier Product' : 'Create Supplier Product'} - Admin</title>
      </Helmet>

      <div className="container mx-auto px-4 py-4 sm:py-8 pb-24 sm:pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/admin/supplier-products')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Supplier Products</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isEditMode ? 'Edit Supplier Product' : 'Create Supplier Product'}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-4 sm:p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Information */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Link className="inline h-4 w-4 mr-1" />
                    Alibaba URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                    placeholder="https://www.alibaba.com/product-detail/..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Hash className="inline h-4 w-4 mr-1" />
                      Reference
                    </label>
                    <input
                      type="text"
                      name="ref"
                      value={formData.ref}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                      placeholder="Product reference"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Tag className="inline h-4 w-4 mr-1" />
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                      placeholder="Stock keeping unit"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Supplier Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Supplier Profile URL
                  </label>
                  <input
                    type="url"
                    name="supplier_profile_url"
                    value={formData.supplier_profile_url}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                    placeholder="https://www.alibaba.com/company/..."
                  />
                </div>
               </div>

               {/* Images Section */}
               <div className="space-y-4">
                 <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                   <Package className="h-5 w-5 mr-2" />
                   Product Images
                 </h2>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Add Image URL
                   </label>
                   <div className="flex space-x-2">
                     <input
                       type="url"
                       placeholder="https://example.com/image.jpg"
                       className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none text-base"
                       onKeyPress={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault();
                           handleImageAdd(e.target.value);
                           e.target.value = '';
                         }
                       }}
                     />
                     <button
                       type="button"
                       onClick={(e) => {
                         const input = e.target.previousElementSibling;
                         handleImageAdd(input.value);
                         input.value = '';
                       }}
                       className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       Add
                     </button>
                   </div>
                 </div>

                 {/* Images Display */}
                 {formData.images.length > 0 && (
                   <div className="space-y-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Current Images ({formData.images.length})
                     </label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {formData.images.map((imageUrl, index) => (
                         <div key={index} className="relative group">
                           <img
                             src={imageUrl}
                             alt={`Product image ${index + 1}`}
                             className="w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                             onError={(e) => {
                               e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                             }}
                           />
                           <button
                             type="button"
                             onClick={() => handleImageRemove(index)}
                             className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             ×
                           </button>
                           <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                             {imageUrl}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => navigate('/admin/supplier-products')}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{isEditMode ? 'Update Supplier Product' : 'Create Supplier Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SupplierProductPage;
