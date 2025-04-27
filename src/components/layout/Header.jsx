import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  ShoppingBag, 
  LayoutDashboard 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import LanguageSwitcher from '../LanguageSwitcher';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Close menus when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center text-2xl font-bold text-blue-800">
            <ShoppingBag className="mr-2" />
            <span>ShopWave</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <Link to="/" className="text-gray-700 hover:text-blue-700">{t('nav.home')}</Link>
              </li>
              <li className="relative group">
                <button className="flex items-center text-gray-700 hover:text-blue-700">
                  {t('nav.categories')} <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 hidden w-48 rounded-md bg-white p-2 shadow-lg group-hover:block">
                  <Link to="/category/electronics" className="block rounded p-2 hover:bg-gray-100">{t('categories.electronics')}</Link>
                  <Link to="/category/clothing" className="block rounded p-2 hover:bg-gray-100">{t('categories.clothing')}</Link>
                  <Link to="/category/home" className="block rounded p-2 hover:bg-gray-100">{t('categories.home')}</Link>
                  <Link to="/category/beauty" className="block rounded p-2 hover:bg-gray-100">{t('categories.beauty')}</Link>
                </div>
              </li>
              <li>
                <Link to="/products" className="text-gray-700 hover:text-blue-700">{t('nav.allProducts')}</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-700 hover:text-blue-700">{t('nav.about')}</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-700 hover:text-blue-700">{t('nav.contact')}</Link>
              </li>
            </ul>
          </nav>

          {/* Search, Cart, User */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden relative md:block">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-full border border-gray-300 pl-9 pr-4 py-1.5 text-sm lg:w-60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </form>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-blue-700" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-1"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5"
                    >
                      <div className="border-b border-gray-100 px-4 py-2">
                        <p className="text-sm font-medium">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link to="/profile" className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <User className="mr-2 h-4 w-4" /> {t('common.profile')}
                      </Link>
                      <Link to="/orders" className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <ShoppingBag className="mr-2 h-4 w-4" /> {t('common.orders')}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <LayoutDashboard className="mr-2 h-4 w-4" /> {t('common.admin')}
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> {t('common.signOut')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="flex items-center text-gray-700 hover:text-blue-700">
                <User className="mr-1 h-5 w-5" />
                <span className="hidden md:inline">{t('common.signIn')}</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-2 text-gray-700 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-white md:hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </form>
              
              <nav>
                <ul className="space-y-3">
                  <li>
                    <Link to="/" className="block py-2 text-gray-700 hover:text-blue-700">{t('nav.home')}</Link>
                  </li>
                  <li>
                    <div className="py-2">
                      <div className="mb-2 font-medium">{t('nav.categories')}</div>
                      <div className="ml-4 space-y-2">
                        <Link to="/category/electronics" className="block text-gray-600 hover:text-blue-700">{t('categories.electronics')}</Link>
                        <Link to="/category/clothing" className="block text-gray-600 hover:text-blue-700">{t('categories.clothing')}</Link>
                        <Link to="/category/home" className="block text-gray-600 hover:text-blue-700">{t('categories.home')}</Link>
                        <Link to="/category/beauty" className="block text-gray-600 hover:text-blue-700">{t('categories.beauty')}</Link>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link to="/products" className="block py-2 text-gray-700 hover:text-blue-700">{t('nav.allProducts')}</Link>
                  </li>
                  <li>
                    <Link to="/about" className="block py-2 text-gray-700 hover:text-blue-700">{t('nav.about')}</Link>
                  </li>
                  <li>
                    <Link to="/contact" className="block py-2 text-gray-700 hover:text-blue-700">{t('nav.contact')}</Link>
                  </li>
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;