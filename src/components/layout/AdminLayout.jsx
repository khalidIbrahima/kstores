import { useState } from 'react';
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
  Tv
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../LanguageSelector';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { useTranslation } from 'react-i18next';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const userId = null; // ou l'id de l'admin connecté si besoin
  const { notifications, unreadCount, open, setOpen } = useRealtimeNotifications(userId);
  const { t } = useTranslation();

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
        { path: '/admin/inventory', icon: Boxes, label: 'Inventory' },
        { path: '/admin/iptv-plans', icon: Tv, label: 'IPTV Plans' }
      ]
    },
    {
      title: 'Customer Management',
      items: [
        { path: '/admin/customers', icon: Users, label: 'Customers' },
        { path: '/admin/customer-groups', icon: UserCog, label: 'Customer Groups' },
        { path: '/admin/payments', icon: Wallet, label: 'Payments' }
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
        { path: '/admin/support', icon: MessageSquare, label: 'Support' }
      ]
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link to="/admin" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin Panel</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-y-auto p-4">
            {menuSections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {section.title}
                </h3>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4" />
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
          <div className="border-t border-gray-200 p-4">
            <Link
              to="/"
              className="mb-4 flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
            >
              <Store className="h-5 w-5 text-gray-400" />
              <span>View Store</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-600 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <button
                className="relative text-gray-500 hover:text-gray-600"
                onClick={() => setOpen(!open)}
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-8">
          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b font-bold">{t('notifications.title')}</div>
              {notifications.length === 0 && (
                <div className="p-4 text-gray-500">{t('notifications.no_notifications')}</div>
              )}
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${!n.is_read ? 'font-bold' : ''}`}
                >
                  {t(`notifications.${n.type}_title`)}
                  <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;