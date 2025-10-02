import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, ExternalLink, Package, User, Hash, Tag, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';

const SupplierProductsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchSupplierProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(supplierProducts);
    } else {
      const filtered = supplierProducts.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, supplierProducts]);

  const fetchSupplierProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_product')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupplierProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching supplier products:', error);
      toast.error('Failed to fetch supplier products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier product?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('supplier_product')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Supplier product deleted successfully');
      fetchSupplierProducts();
    } catch (error) {
      console.error('Error deleting supplier product:', error);
      toast.error('Failed to delete supplier product');
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
        <title>Supplier Products - Admin</title>
      </Helmet>

      <div className="container mx-auto px-4 py-4 sm:py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Supplier Products</h1>
          <button
            onClick={() => navigate('/admin/supplier-products/create')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier Product</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search supplier products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No supplier products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first supplier product'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/admin/supplier-products/create')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Supplier Product</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-10 w-10">
                             {product.images && product.images.length > 0 ? (
                               <img
                                 src={product.images[0]}
                                 alt={product.name || 'Product'}
                                 className="h-10 w-10 object-cover rounded-md"
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                   e.target.nextSibling.style.display = 'block';
                                 }}
                               />
                             ) : null}
                             <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" style={{ display: product.images && product.images.length > 0 ? 'none' : 'block' }} />
                           </div>
                           <div className="ml-4">
                             <button
                               onClick={() => navigate(`/admin/supplier-products/detail/${product.id}`)}
                               className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left"
                             >
                               {product.name || 'Unnamed Product'}
                             </button>
                             {product.images && product.images.length > 1 && (
                               <div className="text-xs text-gray-500 dark:text-gray-400">
                                 +{product.images.length - 1} more image{product.images.length - 1 > 1 ? 's' : ''}
                               </div>
                             )}
                             {product.url && (
                               <a
                                 href={product.url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                               >
                                 <ExternalLink className="h-3 w-3 mr-1" />
                                 View on Alibaba
                               </a>
                             )}
                           </div>
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {product.supplier_name || 'Unknown Supplier'}
                            </div>
                            {product.supplier_profile_url && (
                              <a
                                href={product.supplier_profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Profile
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {product.ref || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {product.sku || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/admin/supplier-products/detail/${product.id}`)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/supplier-products/edit/${product.id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SupplierProductsPage;
