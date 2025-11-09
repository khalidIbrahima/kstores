import { Facebook, Twitter, Instagram, YoutubeIcon, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { socialConfig } from '../config/socialConfig';

const SocialMediaSection = ({ 
  showTitle = true, 
  showDescription = true,
  className = "",
  variant = "default" // "default", "compact", "footer"
}) => {
  const { t } = useTranslation();

  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: socialConfig.socialMedia.facebook.url,
      color: 'hover:text-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: socialConfig.socialMedia.twitter.url,
      color: 'hover:text-sky-500'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: socialConfig.socialMedia.instagram.url,
      color: 'hover:text-pink-600'
    },
    {
      name: 'YouTube',
      icon: YoutubeIcon,
      url: socialConfig.socialMedia.youtube.url,
      color: 'hover:text-red-600'
    }
  ];

  const contactInfo = [
    {
      name: t('contact.info.email.title', 'Email'),
      value: socialConfig.contact.email,
      icon: Mail,
      url: `mailto:${socialConfig.contact.email}`
    },
    {
      name: t('contact.info.phone.title', 'Téléphone'),
      value: socialConfig.contact.phone,
      icon: Phone,
      url: `tel:${socialConfig.contact.phone}`
    },
    {
      name: t('contact.info.address.title', 'Adresse'),
      value: socialConfig.contact.address,
      icon: MapPin,
      url: `https://maps.google.com/?q=${encodeURIComponent(socialConfig.contact.address)}`
    }
  ];

  if (variant === "compact") {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {showTitle && (
          <span className="text-sm font-medium text-gray-700">
            {t('common.followUs', 'Suivez-nous')}:
          </span>
        )}
        <div className="flex space-x-3">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-400 transition-colors ${social.color}`}
              title={social.name}
              aria-label={social.name}
            >
              <social.icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={className}>
        <div className="flex space-x-4">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-text-light transition-colors ${social.color}`}
              title={social.name}
              aria-label={social.name}
            >
              <social.icon size={20} />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className={`py-12 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        {showTitle && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              {t('common.connectWithUs', 'Connectez-vous avec nous')}
            </h2>
            {showDescription && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('common.socialDescription', 'Suivez-nous sur les réseaux sociaux pour rester informé de nos dernières offres et nouveautés.')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {t('common.socialMedia', 'Réseaux sociaux')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <social.icon className="h-6 w-6 mr-3 text-gray-600" />
                  <span className="font-medium text-gray-800">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Informations de contact */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              {t('common.contactInfo', 'Informations de contact')}
            </h3>
            <div className="space-y-4">
              {contactInfo.map((contact) => (
                <a
                  key={contact.name}
                  href={contact.url}
                  target={contact.name === 'Adresse' ? '_blank' : undefined}
                  rel={contact.name === 'Adresse' ? 'noopener noreferrer' : undefined}
                  className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <contact.icon className="h-6 w-6 mr-3 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-800">{contact.name}</div>
                    <div className="text-gray-600">{contact.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection; 