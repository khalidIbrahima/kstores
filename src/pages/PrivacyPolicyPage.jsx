import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '../hooks/useStoreSettings';
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <DynamicSocialMetaTags
        pageType="privacy"
        title="Règles de Confidentialité - Kapital Stores"
        description="Découvrez comment Kapital Stores protège vos données personnelles et respecte votre vie privée."
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              {settings?.logo_url && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={settings.logo_url} 
                    alt="Kapital Stores Logo" 
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Règles de Confidentialité
              </h1>
              <p className="text-gray-600">
                Dernière mise à jour : {currentDate}
              </p>
            </div>

            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 mb-4">
                Kapital Stores ("nous", "notre", "nos") s'engage à protéger votre vie privée. 
                Ces règles de confidentialité expliquent comment nous collectons, utilisons, 
                stockons et protégeons vos informations personnelles lorsque vous utilisez 
                notre site web et nos services.
              </p>
              <p className="text-gray-700">
                En utilisant notre site, vous acceptez les pratiques décrites dans 
                ces règles de confidentialité.
              </p>
            </section>

            {/* Informations collectées */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Informations que nous collectons
              </h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                2.1 Informations que vous nous fournissez
              </h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Adresse de livraison et de facturation</li>
                <li>Informations de paiement (traitées de manière sécurisée)</li>
                <li>Préférences de communication</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                2.2 Informations collectées automatiquement
              </h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Adresse IP et données de localisation</li>
                <li>Informations sur votre navigateur et appareil</li>
                <li>Pages visitées et temps passé sur le site</li>
                <li>Cookies et technologies similaires</li>
                <li>Données d'utilisation et analytics</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                2.3 Informations de tiers
              </h3>
              <p className="text-gray-700">
                Nous pouvons recevoir des informations de nos partenaires de paiement, 
                services de livraison et autres fournisseurs de services pour améliorer 
                votre expérience.
              </p>
            </section>

            {/* Utilisation des informations */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Comment nous utilisons vos informations
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Traiter et expédier vos commandes</li>
                <li>Communiquer avec vous concernant vos commandes</li>
                <li>Fournir un support client</li>
                <li>Améliorer nos produits et services</li>
                <li>Personnaliser votre expérience</li>
                <li>Envoyer des communications marketing (avec votre consentement)</li>
                <li>Assurer la sécurité de notre site</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            {/* Partage des informations */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Partage de vos informations
              </h2>
              <p className="text-gray-700 mb-4">
                Nous ne vendons, n'échangeons ni ne louons vos informations personnelles 
                à des tiers. Nous pouvons partager vos informations dans les cas suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Partenaires de service :</strong> Processeurs de paiement, services de livraison</li>
                <li><strong>Fournisseurs techniques :</strong> Hébergement, analytics, support client</li>
                <li><strong>Obligations légales :</strong> Lorsque requis par la loi</li>
                <li><strong>Protection :</strong> Pour protéger nos droits et la sécurité</li>
                <li><strong>Avec votre consentement :</strong> Dans d'autres cas avec votre permission</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Cookies et technologies similaires
              </h2>
              <p className="text-gray-700 mb-4">
                Nous utilisons des cookies et des technologies similaires pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Mémoriser vos préférences</li>
                <li>Analyser l'utilisation du site</li>
                <li>Améliorer nos services</li>
                <li>Personnaliser le contenu</li>
                <li>Assurer la sécurité</li>
              </ul>
              <p className="text-gray-700">
                Vous pouvez contrôler l'utilisation des cookies via les paramètres 
                de votre navigateur.
              </p>
            </section>

            {/* Sécurité */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Sécurité de vos informations
              </h2>
              <p className="text-gray-700 mb-4">
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger 
                vos informations personnelles :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Chiffrement SSL/TLS pour les transmissions</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance continue de la sécurité</li>
                <li>Formation du personnel sur la protection des données</li>
                <li>Sauvegardes sécurisées</li>
              </ul>
            </section>

            {/* Conservation des données */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Conservation de vos données
              </h2>
              <p className="text-gray-700 mb-4">
                Nous conservons vos informations personnelles aussi longtemps que nécessaire 
                pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Fournir nos services</li>
                <li>Respecter nos obligations légales</li>
                <li>Résoudre les litiges</li>
                <li>Appliquer nos accords</li>
              </ul>
              <p className="text-gray-700">
                Lorsque nous n'avons plus besoin de vos données, nous les supprimons 
                de manière sécurisée.
              </p>
            </section>

            {/* Vos droits */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Vos droits
              </h2>
              <p className="text-gray-700 mb-4">
                Conformément au RGPD, vous avez les droits suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Droit d'accès :</strong> Demander une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement</li>
                <li><strong>Droit de limitation :</strong> Limiter le traitement de vos données</li>
                <li><strong>Droit de retrait :</strong> Retirer votre consentement</li>
              </ul>
            </section>

            {/* Transferts internationaux */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Transferts internationaux
              </h2>
              <p className="text-gray-700">
                Vos informations peuvent être transférées et traitées dans des pays 
                autres que votre pays de résidence. Nous nous assurons que ces transferts 
                respectent les lois applicables et mettons en place des garanties appropriées 
                pour protéger vos données.
              </p>
            </section>

            {/* Enfants */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Protection des enfants
              </h2>
              <p className="text-gray-700">
                Notre site n'est pas destiné aux enfants de moins de 16 ans. 
                Nous ne collectons pas sciemment d'informations personnelles 
                auprès d'enfants de moins de 16 ans. Si vous êtes parent et 
                pensez que votre enfant nous a fourni des informations, 
                contactez-nous immédiatement.
              </p>
            </section>

            {/* Modifications */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Modifications de ces règles
              </h2>
              <p className="text-gray-700">
                Nous pouvons mettre à jour ces règles de confidentialité de temps à autre. 
                Nous vous informerons de tout changement important en publiant la nouvelle 
                version sur notre site et en mettant à jour la date de "dernière mise à jour". 
                Nous vous encourageons à consulter régulièrement ces règles.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Nous contacter
              </h2>
              <p className="text-gray-700 mb-4">
                Si vous avez des questions concernant ces règles de confidentialité 
                ou souhaitez exercer vos droits, contactez-nous :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email :</strong> privacy@kapital-stores.shop<br />
                  <strong>Adresse :</strong> Kapital Stores, Fass Delorme, Dakar<br />
                  <strong>Téléphone :</strong> +221 76 180 06 49
                </p>
              </div>
            </section>

            {/* Autorité de contrôle */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Autorité de contrôle
              </h2>
              <p className="text-gray-700">
                Si vous n'êtes pas satisfait de notre réponse à votre demande, 
                vous avez le droit de déposer une plainte auprès de l'autorité 
                de contrôle compétente de votre pays (au Sénégal : CNDP).
              </p>
            </section>

            {/* Footer */}
            <div className="border-t pt-8 mt-8">
              <p className="text-sm text-gray-500 text-center">
                © {new Date().getFullYear()} Kapital Stores. Tous droits réservés.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage; 