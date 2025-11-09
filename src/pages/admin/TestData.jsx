import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TestData = () => {
  const [data, setData] = useState({
    products: [],
    categories: [],
    orders: [],
    customers: [],
    loading: true,
    error: null,
    connectionInfo: {}
  });

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Test connection info
      const connectionInfo = {
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      };

      // Test products with detailed field info
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(3);

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }

      // Test categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }

      // Test orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(3);

      if (ordersError) {
        console.error('Orders error:', ordersError);
        throw ordersError;
      }

      // Test customers (profiles)
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);

      if (customersError) {
        console.error('Customers error:', customersError);
        throw customersError;
      }

      setData({
        products: products || [],
        categories: categories || [],
        orders: orders || [],
        customers: customers || [],
        loading: false,
        error: null,
        connectionInfo
      });

      console.log('Database test results:', {
        connectionInfo,
        products: products?.length || 0,
        categories: categories?.length || 0,
        orders: orders?.length || 0,
        customers: customers?.length || 0,
        sampleProduct: products?.[0],
        sampleOrder: orders?.[0]
      });

    } catch (error) {
      console.error('Database test failed:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  if (data.loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Testing Database Connection...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Database Connection Test</h1>
      
      {/* Connection Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Connection Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">URL:</span> 
            <span className={`ml-2 ${data.connectionInfo.url ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {data.connectionInfo.url ? '✓ Set' : '✗ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">API Key:</span> 
            <span className={`ml-2 ${data.connectionInfo.hasKey ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {data.connectionInfo.hasKey ? '✓ Set' : '✗ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">Key Length:</span> 
            <span className="ml-2 text-gray-900 dark:text-gray-100">{data.connectionInfo.keyLength} characters</span>
          </div>
        </div>
      </div>
      
      {data.error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {data.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Products</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.products.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Categories</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.categories.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Orders</h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.orders.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Customers</h3>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.customers.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products with field details */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Sample Products (with fields)</h3>
          {data.products.length > 0 ? (
            <div className="space-y-4">
              {data.products.map(product => (
                <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    <p>ID: {product.id}</p>
                    <p>Price: ${product.price}</p>
                    <p>Stock/Inventory: {product.stock || product.inventory || 'N/A'}</p>
                    <p>Category ID: {product.category_id}</p>
                    <p>Created: {new Date(product.created_at).toLocaleDateString()}</p>
                    <p>All fields: {Object.keys(product).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold mb-3">Categories</h3>
          {data.categories.length > 0 ? (
            <div className="space-y-2">
              {data.categories.map(category => (
                <div key={category.id} className="border-b pb-2">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-600">Slug: {category.slug}</p>
                  <p className="text-xs text-gray-500">Fields: {Object.keys(category).join(', ')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No categories found</p>
          )}
        </div>

        {/* Orders */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold mb-3">Sample Orders</h3>
          {data.orders.length > 0 ? (
            <div className="space-y-2">
              {data.orders.map(order => (
                <div key={order.id} className="border-b pb-2">
                  <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">
                    Total: ${order.total} | Status: {order.status}
                  </p>
                  <p className="text-xs text-gray-500">Fields: {Object.keys(order).join(', ')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No orders found</p>
          )}
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-lg">
          <h3 className="font-semibold mb-3">Sample Customers</h3>
          {data.customers.length > 0 ? (
            <div className="space-y-2">
              {data.customers.map(customer => (
                <div key={customer.id} className="border-b pb-2">
                  <p className="font-medium">{customer.full_name}</p>
                  <p className="text-sm text-gray-600">
                    Admin: {customer.is_admin ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-gray-500">Fields: {Object.keys(customer).join(', ')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No customers found</p>
          )}
        </div>
      </div>

      <button
        onClick={testDatabaseConnection}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Test
      </button>
    </div>
  );
};

export default TestData; 