import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import orangeLogo from '../assets/wallets/orange.png';
import waveLogo from '../assets/wallets/wave.png';

const WALLETS = [
  { key: 'orange', label: 'Orange Money', logo: orangeLogo },
  { key: 'wave', label: 'Wave', logo: waveLogo, imgClass: 'h-8' },
  // Ajoute d'autres wallets si besoin
];

export default function MobileWalletSelector({ value, onChange }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(value?.wallet || '');
  const [phone, setPhone] = useState(value?.phone || '');

  const handleSelect = (wallet) => {
    setSelected(wallet);
    onChange({ wallet, phone });
  };

  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    onChange({ wallet: selected, phone: e.target.value });
  };

  return (
    <div>
      <label className="block mb-2 font-medium text-text-dark">{t('payment.choose_wallet')}</label>
      <div className="flex gap-4 mb-4">
        {WALLETS.map(w => (
          <button
            key={w.key}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded border transition-colors ${
              selected === w.key 
                ? 'border-primary bg-background-light text-primary' 
                : 'border-background-dark hover:border-primary/50 hover:bg-background-light'
            }`}
            onClick={() => handleSelect(w.key)}
          >
            <img
              src={w.logo}
              alt={w.label}
              className={`${w.imgClass || 'h-8 w-8'} rounded-full bg-background object-contain p-1 shadow`}
            />
            {w.label}
          </button>
        ))}
      </div>
      <label className="block mb-1 text-text-dark">{t('payment.phone')}</label>
      <input
        type="tel"
        value={phone}
        onChange={handlePhoneChange}
        className="input w-full bg-background"
        placeholder={t('payment.phone_placeholder')}
      />
    </div>
  );
} 