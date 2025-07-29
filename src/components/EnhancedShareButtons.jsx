import { Share2, Facebook, Twitter, MessageSquare, MessageCircle, Copy, Link, Mail, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const EnhancedShareButtons = ({ 
  title, 
  description, 
  url, 
  image,
  showTitle = true,
  className = "",
  variant = "default" // "default", "compact", "floating"
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { t } = useTranslation();

  const shareData = {
    title: title || document.title,
    text: description || '',
    url: url || window.location.href
  };

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.href)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
      }
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title || document.title)}&url=${encodeURIComponent(url || window.location.href)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title || document.title} ${url || window.location.href}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    },
    {
      name: 'Telegram',
      icon: MessageCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url || window.location.href)}&text=${encodeURIComponent(title || document.title)}`;
        window.open(telegramUrl, '_blank');
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent(title || document.title)}&body=${encodeURIComponent(`${description || ''}\n\n${url || window.location.href}`)}`;
        window.open(emailUrl);
      }
    },
    {
      name: 'Copier le lien',
      icon: Link,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: async () => {
        try {
          if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(url || window.location.href);
            toast.success(t('common.linkCopied', 'Lien copié !'));
          }
        } catch (error) {
          // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
          const textArea = document.createElement('textarea');
          textArea.value = url || window.location.href;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast.success(t('common.linkCopied', 'Lien copié !'));
        }
      }
    }
  ];

  const advancedShareButtons = [
    {
      name: 'LinkedIn',
      icon: ExternalLink,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || window.location.href)}`;
        window.open(linkedinUrl, '_blank');
      }
    },
    {
      name: 'Pinterest',
      icon: ExternalLink,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => {
        const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url || window.location.href)}&description=${encodeURIComponent(description || title || document.title)}&media=${encodeURIComponent(image || '')}`;
        window.open(pinterestUrl, '_blank');
      }
    },
    {
      name: 'Reddit',
      icon: ExternalLink,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => {
        const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url || window.location.href)}&title=${encodeURIComponent(title || document.title)}`;
        window.open(redditUrl, '_blank');
      }
    }
  ];

  if (variant === "compact") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showTitle && (
          <span className="text-sm font-medium text-gray-700">
            {t('common.share', 'Partager')}:
          </span>
        )}
        <div className="flex space-x-1">
          {shareButtons.slice(0, 4).map((button) => (
            <button
              key={button.name}
              onClick={button.action}
              className={`flex items-center justify-center rounded-full p-2 text-white transition-colors ${button.color}`}
              title={button.name}
              aria-label={button.name}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-110"
            title={t('common.share', 'Partager')}
          >
            <Share2 className="h-6 w-6" />
          </button>

          {showShareMenu && (
            <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-white p-2 shadow-xl">
              <div className="grid grid-cols-3 gap-2">
                {shareButtons.map((button) => (
                  <button
                    key={button.name}
                    onClick={button.action}
                    className={`flex items-center justify-center rounded-lg p-3 text-white transition-colors ${button.color}`}
                    title={button.name}
                    aria-label={button.name}
                  >
                    <button.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                >
                  {showAdvancedOptions ? 'Moins d\'options' : 'Plus d\'options'}
                </button>
                {showAdvancedOptions && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {advancedShareButtons.map((button) => (
                      <button
                        key={button.name}
                        onClick={button.action}
                        className={`flex items-center justify-center rounded-lg p-3 text-white transition-colors ${button.color}`}
                        title={button.name}
                        aria-label={button.name}
                      >
                        <button.icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Share2 className="mr-2 h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {t('common.share', 'Partager')}
            </span>
          </div>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvancedOptions ? 'Moins d\'options' : 'Plus d\'options'}
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {shareButtons.map((button) => (
          <button
            key={button.name}
            onClick={button.action}
            className={`flex items-center justify-center rounded-full p-3 text-white transition-colors ${button.color}`}
            title={button.name}
            aria-label={button.name}
          >
            <button.icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {showAdvancedOptions && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Autres plateformes</h4>
          <div className="flex flex-wrap gap-2">
            {advancedShareButtons.map((button) => (
              <button
                key={button.name}
                onClick={button.action}
                className={`flex items-center justify-center rounded-full p-3 text-white transition-colors ${button.color}`}
                title={button.name}
                aria-label={button.name}
              >
                <button.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu de partage mobile avec API native */}
      <button
        onClick={async () => {
          try {
            if (navigator.share && navigator.canShare(shareData)) {
              await navigator.share(shareData);
            } else {
              setShowShareMenu(!showShareMenu);
            }
          } catch (error) {
            setShowShareMenu(!showShareMenu);
          }
        }}
        className="md:hidden mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700"
        title={t('common.share', 'Partager')}
      >
        <Share2 className="mr-2 h-5 w-5" />
        {t('common.share', 'Partager')}
      </button>
    </div>
  );
};

export default EnhancedShareButtons; 