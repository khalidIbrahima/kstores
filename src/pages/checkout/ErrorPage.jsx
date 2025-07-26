import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

export default function ErrorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('payment.payment_error')}</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('payment.payment_error')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('payment.wave_error')}
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.back_to_cart')}
          </button>
        </div>
      </div>
    </>
  );
} 