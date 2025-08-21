import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { StoreSettingsProvider } from './hooks/useStoreSettings.jsx';
import GoogleAuthPopup from './components/GoogleAuthPopup';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import AnalyticsTracker from './components/AnalyticsTracker';
import MaintenanceGuard from './components/MaintenanceGuard';
import MaintenancePage from './pages/MaintenancePage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductPage from './pages/ProductPage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import IPTVPage from './pages/IPTVPage';
import IPTVCheckoutPage from './pages/IPTVCheckoutPage';
import OrdersPage from './pages/OrdersPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
//import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import NotFoundPage from './pages/NotFoundPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import CategoriesPage from './pages/CategoriesPage';
import OrderConfirmationPage from './pages/checkout/OrderConfirmationPage';
import ErrorPage from './pages/checkout/ErrorPage';
import SuccessPage from './pages/checkout/SuccessPage';
import DynamicFavicon from './components/DynamicFavicon';
import SocialMetaManager from './components/SocialMetaManager';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminStore from './pages/admin/Store';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminInventory from './pages/admin/Inventory';
import AdminCustomers from './pages/admin/Customers';
import AdminCustomerGroups from './pages/admin/CustomerGroups';
import AdminPayments from './pages/admin/Payments';
import AdminSalesReports from './pages/admin/reports/Sales';
import AdminCustomerAnalytics from './pages/admin/reports/CustomerAnalytics';
import AdminInventoryReports from './pages/admin/reports/Inventory';
import AdminNotifications from './pages/admin/Notifications';
import AdminSettings from './pages/admin/Settings';
import AdminSupport from './pages/admin/Support';
import AdminIPTVPlans from './pages/admin/IPTVPlans';
import ProductDetailPage from './pages/admin/ProductDetailPage';
import AdminOrderPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import CreateOrderPage from './pages/admin/CreateOrderPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import TestData from './pages/admin/TestData';
import GuestCustomers from './pages/admin/GuestCustomers';
import AbandonedCarts from './pages/admin/AbandonedCarts';
import WhatsAppSettings from './pages/admin/WhatsAppSettings';
import WhatsAppDebug from './pages/admin/WhatsAppDebug';
import SupplierOrders from './pages/admin/SupplierOrders';
import SupplierOrderDetail from './pages/admin/SupplierOrderDetail';
import ShippingAgencies from './pages/admin/ShippingAgencies';

const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <AuthProvider>
      <StoreSettingsProvider>
        <FavoritesProvider>
          <CartProvider>
            <DynamicFavicon />
            <Router {...router}>
              <AnalyticsTracker />
              <SocialMetaManager />
              <Toaster position="top-center" />
              <GoogleAuthPopup />
              <Routes>
                {/* Checkout Routes - Outside Layout */}
                <Route path="checkout/confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route path="checkout/error" element={<ErrorPage />} />
                <Route path="checkout/success" element={<SuccessPage />} />
                
                {/* Auth Callback Route - Outside Layout */}
        
                
                {/* Maintenance Route - Direct Access */}
                <Route path="/maintenance" element={<MaintenancePage />} />
                
                {/* Public Routes */}
                <Route path="/" element={
                  <MaintenanceGuard>
                    <Layout />
                  </MaintenanceGuard>
                }>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="product/:id" element={<ProductPage />} />
                  <Route path="category/:slug" element={<CategoryPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="cart" element={<CartPage />} />
                  {/* <Route path="about" element={<AboutPage />} /> */}
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="privacy" element={<PrivacyPolicyPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="returns" element={<ReturnPolicyPage />} />
                  <Route path="iptv" element={<IPTVPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="checkout" element={
                    <ProtectedRoute requireAuth={false}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } />
                  <Route path="iptv-checkout" element={
                    <ProtectedRoute requireAuth={false}>
                      <IPTVCheckoutPage />
                    </ProtectedRoute>
                  } />
                  <Route path="orders" element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="favorites" element={
                    <ProtectedRoute>
                      <FavoritesPage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="store" element={<AdminStore />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />
                  <Route path="create-order" element={<CreateOrderPage />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="customer-groups" element={<AdminCustomerGroups />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="reports/sales" element={<AdminSalesReports />} />
                  <Route path="reports/customers" element={<AdminCustomerAnalytics />} />
                  <Route path="reports/inventory" element={<AdminInventoryReports />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="whatsapp-settings" element={<WhatsAppSettings />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="iptv-plans" element={<AdminIPTVPlans />} />
                  <Route path="orders-page/:id" element={<AdminOrderPage />} />
                  <Route path="test-data" element={<TestData />} />
                  <Route path="guest-customers" element={<GuestCustomers />} />
                  <Route path="abandoned-carts" element={<AbandonedCarts />} />
                  <Route path="whatsapp-debug" element={<WhatsAppDebug />} />
                  <Route path="supplier-orders" element={<SupplierOrders />} />
                  <Route path="supplier-orders/:id" element={<SupplierOrderDetail />} />
                  <Route path="shipping-agencies" element={<ShippingAgencies />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </CartProvider>
        </FavoritesProvider>
      </StoreSettingsProvider>
    </AuthProvider>
  );
}

export default App;