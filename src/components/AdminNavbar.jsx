import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';

const AdminNavbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="bg-background border-b border-background-dark shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/admin" className="text-xl font-bold text-text-dark hover:text-primary transition-colors">
                {t('admin.sidebar.dashboard')}
              </Link>
            </div>
            <div className="ml-6 flex items-center space-x-4">
              <Link
                to="/admin/orders"
                className="rounded-md px-3 py-2 text-sm font-medium text-text-dark hover:text-primary hover:bg-background-light transition-colors"
              >
                {t('admin.sidebar.orders')}
              </Link>
              <Link
                to="/admin/products"
                className="rounded-md px-3 py-2 text-sm font-medium text-text-dark hover:text-primary hover:bg-background-light transition-colors"
              >
                {t('admin.sidebar.products')}
              </Link>
              <Link
                to="/admin/users"
                className="rounded-md px-3 py-2 text-sm font-medium text-text-dark hover:text-primary hover:bg-background-light transition-colors"
              >
                {t('admin.sidebar.customers')}
              </Link>
              <Link
                to="/admin/supplier-orders"
                className="rounded-md px-3 py-2 text-sm font-medium text-text-dark hover:text-primary hover:bg-background-light transition-colors"
              >
                Commandes Fournisseur
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-4 flex items-center space-x-4">
              <LanguageSelector />
              <Link
                to="/"
                className="btn-primary"
              >
                {t('admin.sidebar.backToSite')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar; 