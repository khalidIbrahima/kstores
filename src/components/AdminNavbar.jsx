import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';

const AdminNavbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/admin" className="text-xl font-bold text-gray-900">
                {t('admin.sidebar.dashboard')}
              </Link>
            </div>
            <div className="ml-6 flex items-center space-x-4">
              <Link
                to="/admin/orders"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                {t('admin.sidebar.orders')}
              </Link>
              <Link
                to="/admin/products"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                {t('admin.sidebar.products')}
              </Link>
              <Link
                to="/admin/users"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                {t('admin.sidebar.customers')}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-4 flex items-center space-x-4">
              <LanguageSelector />
              <Link
                to="/"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
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