import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  Search, 
  LogOut,
  Settings,
  Heart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { supabase } from '../../lib/supabase';
import LanguageSwitcher from '../LanguageSwitcher';
import logoHorizontal from '../../assets/logo-horizontal.webp';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { itemCount } = useCart();
  const { user, logout, isLoading } = useUnifiedAuth();
  const { settings } = useStoreSettings();
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

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
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
      await logout();
      setUserDropdownOpen(false);
      // La redirection est gérée dans le hook logout
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Utiliser le nom du store depuis les paramètres ou un nom par défaut
  const storeName = settings?.store_name || 'Kapital Store';

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 bg-background ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={settings?.logo_url || logoHorizontal} 
              alt={`${storeName} Logo`} 
              className="h-12 w-auto lg:h-16" 
              style={{objectFit: 'contain', maxWidth: '180px'}} 
            />
          </Link>

          {/* Desktop Navigation - Changed from md: to lg: for better tablet experience */}
          <nav className="hidden lg:block">
            <ul className="flex space-x-6 xl:space-x-8">
              <li>
                <Link to="/" className="text-text-dark hover:text-primary font-medium transition-colors text-sm xl:text-base">{t('nav.home')}</Link>
              </li>
              <li className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center text-text-dark hover:text-primary font-medium transition-colors text-sm xl:text-base"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {t('nav.categories')} <ChevronDown className="ml-1 h-3 w-3 xl:h-4 xl:w-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 xl:w-64 rounded-md bg-background p-2 shadow-lg">
                    {categories.map((category) => (
                      <Link 
                        key={category.id}
                        to={`/category/${category.slug}`} 
                        className="flex items-center rounded p-2 text-text-dark hover:bg-accent-light hover:text-primary transition-colors text-sm"
                        onClick={() => setDropdownOpen(false)}
                      >
                        {category.cover_image_url ? (
                          <img 
                            src={category.cover_image_url} 
                            alt={category.name}
                            className="w-6 h-6 xl:w-8 xl:h-8 object-cover rounded mr-2 xl:mr-3"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 xl:w-8 xl:h-8 bg-gray-200 rounded mr-2 xl:mr-3 flex items-center justify-center">
                            <span className="text-xs text-gray-500">{category.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="text-sm">{category.name}</span>
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">
                        {t('categories.no_categories')}
                      </div>
                    )}
                  </div>
                )}
              </li>
              <li>
                <Link to="/products" className="text-text-dark hover:text-primary font-medium transition-colors text-sm xl:text-base">{t('nav.allProducts')}</Link>
              </li>
              <li>
                <Link to="/iptv" className="text-text-dark hover:text-primary font-medium transition-colors text-sm xl:text-base">IPTV</Link>
              </li>
            </ul>
          </nav>

          {/* Search, Cart, Language, User */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Language Switcher - Hidden on mobile and tablet */}
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>

            {/* Search Bar - Hidden on mobile, visible on tablet and desktop */}
            <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-32 xl:w-40 2xl:w-60 text-sm"
              />
              <Search className="absolute left-3 top-1/2 h-3 w-3 xl:h-4 xl:w-4 -translate-y-1/2 text-text-light" />
            </form>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 text-text-dark hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 lg:-right-2 lg:-top-2 flex h-4 w-4 lg:h-5 lg:w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 rounded-full bg-background-light p-1.5 lg:p-2 hover:bg-accent-light transition-colors"
                >
                  <User className="h-4 w-4 lg:h-5 lg:w-5 text-text-dark" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 lg:w-48 rounded-md bg-background p-2 shadow-lg">
                    <div className="mb-2 border-b border-background-dark px-2 pb-2">
                      <p className="font-medium text-text-dark text-sm lg:text-base truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/orders"
                      className="flex items-center rounded p-2 text-text-dark hover:bg-accent-light hover:text-primary transition-colors text-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center rounded p-2 text-text-dark hover:bg-accent-light hover:text-primary transition-colors text-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        className="flex items-center rounded p-2 text-text-dark hover:bg-accent-light hover:text-primary transition-colors text-sm"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {t('common.admin')}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded p-2 text-accent hover:bg-accent-light transition-colors text-sm"
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
                className="hidden lg:block btn-primary text-sm px-3 py-1.5 lg:px-4 lg:py-2"
              >
                {t('common.signIn')}
              </Link>
            )}

            {/* Mobile Menu Button - Visible on mobile and tablet */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 lg:h-6 lg:w-6 text-text-dark" />
              ) : (
                <Menu className="h-5 w-5 lg:h-6 lg:w-6 text-text-dark" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Now includes tablet view */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden"
          >
            <div className="border-t border-background-dark bg-background px-4 py-4">
              {/* Language Switcher - Visible in mobile menu for tablet users */}
              <div className="mb-4 lg:hidden">
                <LanguageSwitcher />
              </div>
              
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full text-sm"
                />
              </form>
              
              <nav>
                <ul className="space-y-3 lg:space-y-4">
                  <li>
                    <Link to="/" className="block text-text-dark hover:text-primary transition-colors text-base lg:text-lg">{t('nav.home')}</Link>
                  </li>
                  <li>
                    <Link to="/products" className="block text-text-dark hover:text-primary transition-colors text-base lg:text-lg">{t('nav.allProducts')}</Link>
                  </li>
                  <li>
                    <Link to="/iptv" className="block text-text-dark hover:text-primary transition-colors text-base lg:text-lg">IPTV</Link>
                  </li>
                  {/* <li>
                    <Link to="/about" className="block text-text-dark hover:text-primary transition-colors text-base lg:text-lg">{t('nav.about')}</Link>
                  </li> */}
                  <li>
                    <Link to="/contact" className="block text-text-dark hover:text-primary transition-colors text-base lg:text-lg">{t('nav.contact')}</Link>
                  </li>
                  {!user && (
                    <li>
                      <Link to="/login" className="btn-primary block text-center text-sm lg:text-base">
                        {t('common.signIn')}
                      </Link>
                    </li>
                  )}
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
