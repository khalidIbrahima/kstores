import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { sendOrderNotificationToAdmin, sendOrderConfirmationToCustomer } from '../../services/whatsappService';

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
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

    if (!orderData.customerName || !orderData.customerEmail) {
      toast.error('Please fill in customer name and email');
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
          state: orderData.customerState,
          zip_code: orderData.customerZipCode
        },
        notes: orderData.notes
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
        await sendOrderNotificationToAdmin(order);
        
        // Confirmation au client (si numéro de téléphone disponible)
        if (orderData.customerPhone) {
          await sendOrderConfirmationToCustomer(order);
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
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={orderData.customerName}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={orderData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={orderData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="customerAddress"
                  value={orderData.customerAddress}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="customerCity"
                    value={orderData.customerCity}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

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
            </form>
          </motion.div>

          {/* Products Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Add Product */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Add Products</h2>
              
              <div className="flex space-x-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    id="product-select"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price} (Stock: {product.inventory})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addProductToOrder}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products added yet</p>
              ) : (
                <div className="space-y-4">
                  {selectedProducts.map((item) => (
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
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center"
                        />
                        <button
                          onClick={() => removeProductFromOrder(item.id)}
                          className="text-red-500 hover:text-red-700"
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
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-semibold">${calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
    </>
  );
};

export default CreateOrderPage; 