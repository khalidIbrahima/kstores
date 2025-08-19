import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storeSettingsService } from '../services/storeSettingsService';
import { useTranslation } from 'react-i18next';

const ReturnPolicyPage = () => {
  const { t } = useTranslation();
  const [returnPolicy, setReturnPolicy] = useState('');
  const [returnPolicyEnabled, setReturnPolicyEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReturnPolicy = async () => {
      try {
        setLoading(true);
        const settings = await storeSettingsService.getStoreSettings();
        if (settings) {
          setReturnPolicy(settings.return_policy || '');
          setReturnPolicyEnabled(settings.return_policy_enabled !== false);
        }
      } catch (err) {
        console.error('Error loading return policy:', err);
        setError('Erreur lors du chargement de la politique de retour');
      } finally {
        setLoading(false);
      }
    };

    loadReturnPolicy();
  }, []);

  // Fonction pour formater le HTML simple
  const formatPolicyContent = (content) => {
    if (!content) return '';
    
    // Permettre seulement certaines balises HTML sécurisées
    // Nettoyer les balises non autorisées mais préserver la structure
    let sanitized = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Supprimer les scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Supprimer les styles
      .replace(/on\w+="[^"]*"/gi, '') // Supprimer les événements
      .replace(/javascript:/gi, '') // Supprimer javascript:
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, ''); // Supprimer les iframes
    
    // Convertir les sauts de ligne simples en paragraphes si pas de HTML
    if (!/<[^>]+>/.test(sanitized)) {
      // Si pas de balises HTML, traiter comme du texte simple
      sanitized = sanitized
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }
    
    return sanitized;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/" className="btn-primary">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!returnPolicyEnabled || !returnPolicy) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Politique de retour</h1>
            <p className="text-gray-600 mb-6">
              La politique de retour n'est pas encore configurée ou n'est pas activée.
            </p>
            <Link to="/" className="btn-primary">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-text-light hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </nav>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <RefreshCw className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-text-dark mb-4">Politique de retour</h1>
          <p className="text-text-light max-w-2xl mx-auto">
            Consultez notre politique de retour pour connaître les conditions et procédures de retour de vos achats.
          </p>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-text-dark">Informations importantes</h2>
                <p className="text-text-light text-sm">
                  Veuillez lire attentivement notre politique de retour avant de procéder à un retour.
                </p>
              </div>
            </div>

            <div 
              className="prose prose-gray max-w-none policy-content"
              dangerouslySetInnerHTML={{ 
                __html: formatPolicyContent(returnPolicy) 
              }}
              style={{
                lineHeight: '1.7',
                fontSize: '16px',
                color: '#374151'
              }}
            />
          </div>

          {/* Contact info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Besoin d'aide ?
            </h3>
            <p className="text-blue-800 mb-4">
              Si vous avez des questions concernant notre politique de retour ou si vous souhaitez initier un retour, 
              n'hésitez pas à nous contacter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Nous contacter
              </Link>
              <Link 
                to="/products" 
                className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicyPage;
