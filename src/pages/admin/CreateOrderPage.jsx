import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import { Plus, Trash2, Save, ArrowLeft, Search, User, Mail, Phone, MapPin } from 'lucide-react';
=======
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
<<<<<<< HEAD
import { sendOrderWhatsappNotificationToAdmin, sendOrderWhatsappConfirmationToCustomer } from '../../services/whatsappService';
=======
import { sendOrderNotificationToAdmin, sendOrderConfirmationToCustomer } from '../../services/whatsappService';
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)

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
<<<<<<< HEAD
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)

  useEffect(() => {
    fetchProducts();
  }, []);

<<<<<<< HEAD
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

=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
<<<<<<< HEAD
      setFilteredProducts(data || []);
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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

<<<<<<< HEAD
    if (!orderData.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }


=======
    if (!orderData.customerName || !orderData.customerEmail) {
      toast.error('Please fill in customer name and email');
      return;
    }

>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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
<<<<<<< HEAD
          state: orderData.customerState        },
=======
          state: orderData.customerState,
          zip_code: orderData.customerZipCode
        },
        notes: orderData.notes
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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
<<<<<<< HEAD
        await sendOrderWhatsappNotificationToAdmin(order);
        
        // Confirmation au client (si numéro de téléphone disponible)
        if (orderData.customerPhone) {
          await sendOrderWhatsappConfirmationToCustomer(order);
=======
        await sendOrderNotificationToAdmin(order);
        
        // Confirmation au client (si numéro de téléphone disponible)
        if (orderData.customerPhone) {
          await sendOrderConfirmationToCustomer(order);
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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
<<<<<<< HEAD
      
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
      
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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

<<<<<<< HEAD
      <div className="container mx-auto px-4 py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Orders</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold">Create New Order</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
=======
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Orders</span>
            </button>
            <h1 className="text-3xl font-bold">Create New Order</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
<<<<<<< HEAD
            className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Customer Information</h2>
=======
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
<<<<<<< HEAD
                  <User className="inline h-4 w-4 mr-1" />
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={orderData.customerName}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
<<<<<<< HEAD
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
=======
                  Email *
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={orderData.customerEmail}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
<<<<<<< HEAD
                  <Phone className="inline h-4 w-4 mr-1" />
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={orderData.customerPhone}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
<<<<<<< HEAD
                  <MapPin className="inline h-4 w-4 mr-1" />
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  Address
                </label>
                <input
                  type="text"
                  name="customerAddress"
                  value={orderData.customerAddress}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
=======
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="customerCity"
                    value={orderData.customerCity}
                    onChange={handleInputChange}
<<<<<<< HEAD
                    className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="customerState"
                    value={orderData.customerState}
                    onChange={handleInputChange}
<<<<<<< HEAD
                    className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="customerZipCode"
                    value={orderData.customerZipCode}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select
                  name="status"
                  value={orderData.status}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

<<<<<<< HEAD
              
=======
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={orderData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Any additional notes about this order..."
                />
              </div>
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
            </form>
          </motion.div>

          {/* Products Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
<<<<<<< HEAD
            className="space-y-4 sm:space-y-6"
          >
            {/* Add Product */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Add Products</h2>
              
              {/* Product Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-3 sm:py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-base"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
=======
            className="space-y-6"
          >
            {/* Add Product */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Add Products</h2>
              
              <div className="flex space-x-4 mb-4">
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    id="product-select"
<<<<<<< HEAD
                    className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
                  >
                    <option value="">Select a product</option>
                    {filteredProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price.toLocaleString()} FCFA (Stock: {product.inventory})
=======
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price} (Stock: {product.inventory})
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                      </option>
                    ))}
                  </select>
                </div>
<<<<<<< HEAD
                <div className="w-full sm:w-24">
=======
                <div className="w-24">
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    id="quantity-input"
                    min="1"
<<<<<<< HEAD
                    className="w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 focus:border-blue-500 focus:outline-none text-base"
=======
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addProductToOrder}
<<<<<<< HEAD
                    className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Add Product</span>
=======
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Products */}
<<<<<<< HEAD
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Items</h2>
=======
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
              
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products added yet</p>
              ) : (
                <div className="space-y-4">
                  {selectedProducts.map((item) => (
<<<<<<< HEAD
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.price.toLocaleString()} FCFA</p>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label className="text-sm font-medium text-gray-700 sm:hidden">Qty:</label>
=======
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">${item.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value))}
<<<<<<< HEAD
                          className="w-20 sm:w-16 rounded-md border border-gray-300 px-2 py-1 text-center"
                        />
                        <button
                          onClick={() => removeProductFromOrder(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
=======
                          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center"
                        />
                        <button
                          onClick={() => removeProductFromOrder(item.id)}
                          className="text-red-500 hover:text-red-700"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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
                <div className="mt-6 pt-4 border-t">
<<<<<<< HEAD
                  <div className="space-y-2 mb-4">
                    {selectedProducts.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate flex-1 mr-2">{item.name} x {item.quantity}</span>
                        <span className="flex-shrink-0">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-base sm:text-lg font-semibold">Total:</span>
                    <span className="text-base sm:text-lg font-semibold text-green-600">{calculateTotal().toLocaleString()} FCFA</span>
=======
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-semibold">${calculateTotal().toFixed(2)}</span>
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
                  </div>
                  
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
<<<<<<< HEAD
                    className="w-full mt-4 bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base sm:hidden"
=======
                    className="w-full mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
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
<<<<<<< HEAD

      {/* Mobile Sticky Bottom Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 sm:hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-lg font-semibold text-green-600">{calculateTotal().toLocaleString()} FCFA</span>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
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
=======
>>>>>>> 5450a43 (Merge branch 'main' of https://github.com/khalidIbrahima/kstores)
    </>
  );
};

export default CreateOrderPage; 