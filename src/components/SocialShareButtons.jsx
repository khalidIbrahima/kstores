import { Share2, Facebook, Twitter, MessageSquare, MessageCircle, Copy, Link } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SocialShareButtons = ({ 
  title, 
  description, 
  url, 
  image,
  showTitle = true,
  className = ""
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
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
      name: 'Copier le lien',
      icon: Link,
      color: 'bg-gray-600 hover:bg-gray-700',
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

  return (
    <div className={`relative ${className}`}>
      {showTitle && (
        <div className="mb-4 flex items-center">
          <Share2 className="mr-2 h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {t('common.share', 'Partager')}
          </span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {shareButtons.map((button, index) => (
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
        className="md:hidden mt-2 flex items-center justify-center rounded-full bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700"
        title={t('common.share', 'Partager')}
      >
        <Share2 className="h-5 w-5" />
      </button>

      {/* Menu de partage mobile (fallback) */}
      {showShareMenu && (
        <div className="absolute bottom-full left-0 mb-2 rounded-lg bg-white p-2 shadow-lg md:hidden">
          <div className="flex gap-2">
            {shareButtons.slice(0, 4).map((button) => (
              <button
                key={button.name}
                onClick={() => {
                  button.action();
                  setShowShareMenu(false);
                }}
                className={`flex items-center justify-center rounded-full p-2 text-white transition-colors ${button.color}`}
                title={button.name}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShareButtons; 