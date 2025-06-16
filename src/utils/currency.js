import { useTranslation } from 'react-i18next';

// Currency formatter for CFA XOF
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPrice = (price) => {
  return formatCurrency(price);
};

export const getCurrencySymbol = () => {
  return 'FCFA';
};

export const getCurrencyCode = () => {
  return 'XOF';
};