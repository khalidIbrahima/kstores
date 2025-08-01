import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronUp,
  BarChart3,
  Settings,
  Tags,
  Bell,
  CreditCard,
  HelpCircle,
  Store,
  LineChart,
  Boxes,
  UserCog,
  Wallet,
  Cog,
  MessageSquare,
  Tv,
  UserX,
  ShoppingBag,
  MessageCircle,
  Bug
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../LanguageSelector';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import ScrollToTop from '../ScrollToTop';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Fermé par défaut sur mobile
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const userId = null; // ou l'id de l'admin connecté si besoin
  const { unreadNotifications, unreadCount, open, setOpen } = useRealtimeNotifications(userId);
  const { t } = useTranslation();
  const { settings } = useStoreSettings();

  // Fermer le menu quand on change de page sur mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Initialiser l'état selon la taille d'écran
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer le menu quand on navigue sur mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/analytics', icon: LineChart, label: 'Analytics' }
      ]
    },
    {
      title: 'Store Management',
      items: [
        { path: '/admin/store', icon: Store, label: 'Store Overview' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/categories', icon: Tags, label: 'Categories' },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/admin/supplier-orders', icon: ShoppingBag, label: 'Commandes Fournisseur' },
        { path: '/admin/inventory', icon: Boxes, label: 'Inventory' },
        { path: '/admin/iptv-plans', icon: Tv, label: 'IPTV Plans' }
      ]
    },
    {
      title: 'Customer Management',
      items: [
        { path: '/admin/customers', icon: Users, label: 'Customers' },
        { path: '/admin/guest-customers', icon: UserX, label: 'Guest Customers' },
        { path: '/admin/customer-groups', icon: UserCog, label: 'Customer Groups' },
        { path: '/admin/payments', icon: Wallet, label: 'Payments' },
        { path: '/admin/abandoned-carts', icon: ShoppingBag, label: 'Abandoned Carts' }
      ]
    },
    {
      title: 'Analytics & Reports',
      items: [
        { path: '/admin/reports/sales', icon: BarChart3, label: 'Sales Reports' },
        { path: '/admin/reports/customers', icon: LineChart, label: 'Customer Analytics' },
        { path: '/admin/reports/inventory', icon: BarChart3, label: 'Inventory Reports' }
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { path: '/admin/settings', icon: Cog, label: 'Settings' },
        { path: '/admin/whatsapp-settings', icon: MessageCircle, label: 'WhatsApp Settings' },
        { path: '/admin/whatsapp-debug', icon: Bug, label: 'WhatsApp Debug' },
        { path: '/admin/support', icon: MessageSquare, label: 'Support' }
      ]
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Fermer le menu sur mobile quand on clique sur un lien
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-background-light overflow-hidden">
      {/* Overlay pour fermer le menu sur mobile */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: isSidebarOpen ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg lg:relative lg:translate-x-0 lg:flex-shrink-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-background-dark px-4">
            <Link to="/admin" className="flex items-center justify-center">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Store Logo" 
                  className="h-12 w-auto max-w-48 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-text-light hover:text-text-dark transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-y-auto p-4">
            {menuSections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-text-light">
                  {section.title}
                </h3>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-light text-primary'
                          : 'text-text-dark hover:bg-background-light hover:text-primary'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-text-light'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-2">
            <LanguageSelector />
          </div>
          <div className="border-t border-background-dark p-4">
            <Link
              to="/"
              onClick={handleNavClick}
              className="mb-4 flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-text-dark hover:bg-background-light hover:text-primary transition-colors"
            >
              <Store className="h-5 w-5 text-text-light" />
              <span>View Store</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-accent hover:bg-accent-light transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex-shrink-0 bg-background shadow-sm border-b border-background-dark">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-text-light hover:text-text-dark transition-colors lg:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="relative text-text-light hover:text-text-dark transition-colors"
                onClick={() => navigate('/admin/notifications')}
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="rounded-full bg-background-light p-2 text-text-light hover:text-text-dark hover:bg-background-dark transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-8">
            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-background shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-background-dark font-bold text-text-dark">{t('notifications.title')}</div>
                {unreadNotifications.length === 0 && (
                  <div className="p-4 text-text-light">{t('notifications.no_notifications')}</div>
                )}
                {unreadNotifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-background-dark cursor-pointer hover:bg-background-light transition-colors font-bold text-text-dark`}
                    onClick={() => {
                      if (n.type === 'order_received' && n.data?.orderId) {
                        navigate(`/admin/orders/${n.data.orderId}`);
                      }
                      // Ajoute d'autres types ici si besoin
                    }}
                  >
                    {t(`notifications.${n.type}_title`)}
                    <div className="text-xs text-text-light">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
};

export default AdminLayout;