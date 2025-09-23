import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, Search, User, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { sendOrderWhatsappNotificationToAdmin, sendOrderWhatsappConfirmationToCustomer } from '../../services/whatsappService';

const CreateOrderPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerState: '',
    customerZipCode: '',
    status: 'pending',
    notes: ''
  });
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.description?.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addProductToOrder = () => {
    const productSelect = document.getElementById('product-select');
    const quantityInput = document.getElementById('quantity-input');
    
    if (!productSelect.value || !quantityInput.value) {
      toast.error('Please select a product and quantity');
      return;
    }

    const productId = productSelect.value;
    const quantity = parseInt(quantityInput.value);
    const product = products.find(p => p.id === productId);

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (quantity > product.inventory) {
      toast.error(`Only ${product.inventory} items available in stock`);
      return;
    }

    // Check if product is already in the order
    const existingIndex = selectedProducts.findIndex(item => item.id === productId);
    if (existingIndex >= 0) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += quantity;
      setSelectedProducts(updatedProducts);
    } else {
      setSelectedProducts(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image_url: product.image_url
      }]);
    }

    // Reset inputs
    productSelect.value = '';
    quantityInput.value = '';
  };

  const removeProductFromOrder = (productId) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== productId));
  };

  const updateProductQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.inventory) {
      toast.error(`Only ${product.inventory} items available in stock`);
      return;
    }

    setSelectedProducts(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product to the order');
      return;
    }

    if (!orderData.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }


    setIsLoading(true);

    try {
      // Create order
      const orderToCreate = {
        user_id: null, // Manual order
        total: calculateTotal(),
        status: orderData.status,
        shipping_address: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone,
          address: orderData.customerAddress,
          city: orderData.customerCity,
          state: orderData.customerState        },
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderToCreate])
        .select()
        .single();

      if (orderError) throw orderError;

      // Envoyer les notifications WhatsApp
      try {
        // Notification à l'admin
        await sendOrderWhatsappNotificationToAdmin(order);
        
        // Confirmation au client (si numéro de téléphone disponible)
        if (orderData.customerPhone) {
          await sendOrderWhatsappConfirmationToCustomer(order);
        }
      } catch (error) {
        console.error('Error sending WhatsApp notifications:', error);
        // Ne pas bloquer le processus de commande si les notifications échouent
      }

      // Create order items
      const orderItems = selectedProducts.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product inventory
      for (const item of selectedProducts) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            inventory: products.find(p => p.id === item.id).inventory - item.quantity 
          })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      toast.success('Order created successfully!');
      
      // Clear form
      setOrderData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        status: 'pending',
      });
      setSelectedProducts([]);
      setProductSearch('');
      
      navigate('/admin/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Order - Admin</title>
      </Helmet>

      <div className="container mx-auto px-4 py-4 sm:py-8 pb-24 sm:pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Orders</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Order</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Customer Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={orderData.customerName}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={orderData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={orderData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  name="customerAddress"
                  value={orderData.customerAddress}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="customerCity"
                    value={orderData.customerCity}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="customerState"
                    value={orderData.customerState}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order Status
                </label>
                <select
                  name="status"
                  value={orderData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              
            </form>
          </motion.div>

          {/* Products Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Add Product */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Products</h2>
              
              {/* Product Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pl-10 pr-4 py-3 sm:py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product
                  </label>
                  <select
                    id="product-select"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                  >
                    <option value="">Select a product</option>
                    {filteredProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price.toLocaleString()} FCFA (Stock: {product.inventory})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-24">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addProductToOrder}
                    className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Add Product</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Products */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Order Items</h2>
              
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No products added yet</p>
              ) : (
                <div className="space-y-4">
                  {selectedProducts.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 border dark:border-gray-600 rounded-lg">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-gray-100">{item.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.price.toLocaleString()} FCFA</p>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:hidden">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value))}
                          className="w-20 sm:w-16 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1 text-center"
                        />
                        <button
                          onClick={() => removeProductFromOrder(item.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              {selectedProducts.length > 0 && (
                                  <div className="mt-6 pt-4 border-t dark:border-gray-600">
                  <div className="space-y-2 mb-4">
                    {selectedProducts.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-900 dark:text-gray-100">
                        <span className="truncate flex-1 mr-2">{item.name} x {item.quantity}</span>
                        <span className="flex-shrink-0">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center border-t dark:border-gray-600 pt-2">
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">{calculateTotal().toLocaleString()} FCFA</span>
                  </div>
                  
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full mt-4 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base sm:hidden"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Order...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Create Order</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50 sm:hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Total:</span>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">{calculateTotal().toLocaleString()} FCFA</span>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Order...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Create Order</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default CreateOrderPage; 