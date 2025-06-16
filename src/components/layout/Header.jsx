import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  ChevronDown,
  User,
  LogOut,
  Package,
  Heart,
  Tv
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close menus when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
          <Link to="/" className="flex items-center text-xl font-bold text-blue-800 md:text-2xl">
            <ShoppingCart className="mr-2" />
            <span>Kapital Stores</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <Link to="/" className="text-gray-700 hover:text-blue-700">{t('nav.home')}</Link>
              </li>
              <li className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center text-gray-700 hover:text-blue-700"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {t('nav.categories')} <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md bg-white p-2 shadow-lg">
                    <Link 
                      to="/category/electronics" 
                      className="block rounded p-2 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {t('categories.electronics')}
                    </Link>
                    <Link 
                      to="/category/clothing" 
                      className="block rounded p-2 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {t('categories.clothing')}
                    </Link>
                    <Link 
                      to="/category/home" 
                      className="block rounded p-2 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {t('categories.home')}
                    </Link>
                    <Link 
                      to="/category/beauty" 
                      className="block rounded p-2 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {t('categories.beauty')}
                    </Link>
                  </div>
                )}
              </li>
              <li>
                <Link to="/products" className="text-gray-700 hover:text-blue-700">{t('nav.allProducts')}</Link>
              </li>
              <li>
                <Link to="/iptv" className="text-gray-700 hover:text-blue-700">IPTV</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-700 hover:text-blue-700">{t('nav.about')}</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-700 hover:text-blue-700">{t('nav.contact')}</Link>
              </li>
            </ul>
          </nav>

          {/* Search, Cart, Language, User */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher - Hidden on mobile */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Search Bar - Hidden on mobile */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
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
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 rounded-full bg-gray-100 p-2 hover:bg-gray-200"
                >
                  <User className="h-5 w-5 text-gray-700" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md bg-white p-2 shadow-lg">
                    <div className="mb-2 border-b border-gray-100 px-2 pb-2">
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                    <Link
                      to="/orders"
                      className="flex items-center rounded p-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center rounded p-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center rounded p-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Tv className="mr-2 h-4 w-4" />
                        {t('common.admin')}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded p-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('common.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:block"
              >
                {t('common.signIn')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 md:hidden"
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
              {/* Mobile Search */}
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
              
              {/* Mobile Navigation */}
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
                    <Link to="/iptv" className="block py-2 text-gray-700 hover:text-blue-700">IPTV</Link>
                  </li>
                  <li>
                    <Link to="/about" className="block py-2 text-gray-700 hover:text-blue-700">{t('nav.about')}</Link>
                  </li>
                  <li>
                    <Link to="/contact" className="block py-2 text-gray-700 hover:text-blue-700">{t('nav.contact')}</Link>
                  </li>
                  {user ? (
                    <>
                      <li>
                        <Link to="/orders" className="flex items-center py-2 text-gray-700 hover:text-blue-700">
                          <Package className="mr-2 h-4 w-4" />
                          Orders
                        </Link>
                      </li>
                      <li>
                        <Link to="/favorites" className="flex items-center py-2 text-gray-700 hover:text-blue-700">
                          <Heart className="mr-2 h-4 w-4" />
                          Favorites
                        </Link>
                      </li>
                      {isAdmin && (
                        <li>
                          <Link to="/admin" className="flex items-center py-2 text-gray-700 hover:text-blue-700">
                            <Tv className="mr-2 h-4 w-4" />
                            {t('common.admin')}
                          </Link>
                        </li>
                      )}
                      <li>
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center py-2 text-red-600 hover:text-red-700"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t('common.signOut')}
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link
                        to="/login"
                        className="block rounded-md bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('common.signIn')}
                      </Link>
                    </li>
                  )}
                  {/* Mobile Language Switcher */}
                  <li className="pt-4">
                    <LanguageSwitcher />
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