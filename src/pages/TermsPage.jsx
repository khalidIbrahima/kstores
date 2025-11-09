import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '../hooks/useStoreSettings';
import DynamicSocialMetaTags from '../components/DynamicSocialMetaTags';

const TermsPage = () => {
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
        pageType="terms"
        title="Conditions Générales d'Utilisation - Kapital Stores"
        description="Consultez les conditions générales d'utilisation de Kapital Stores pour comprendre vos droits et obligations."
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
                Conditions Générales d'Utilisation
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
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation 
                du site web Kapital Stores (kapital-stores.shop) et de tous les services associés 
                fournis par Kapital Stores.
              </p>
              <p className="text-gray-700">
                En accédant et en utilisant ce site, vous acceptez d'être lié par ces conditions. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre site.
              </p>
            </section>

            {/* Définitions */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Définitions
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Site :</strong> Le site web kapital-stores.shop</li>
                <li><strong>Utilisateur :</strong> Toute personne utilisant le site</li>
                <li><strong>Client :</strong> Utilisateur effectuant un achat</li>
                <li><strong>Commande :</strong> Demande d'achat de produits</li>
                <li><strong>Produits :</strong> Articles proposés à la vente</li>
                <li><strong>Services :</strong> Tous les services fournis par Kapital Stores</li>
              </ul>
            </section>

            {/* Utilisation du site */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Utilisation du site
              </h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                3.1 Conditions d'utilisation
              </h3>
              <p className="text-gray-700 mb-4">
                Vous vous engagez à utiliser le site uniquement à des fins légales et conformes 
                à ces conditions. Il est interdit de :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Utiliser le site de manière frauduleuse ou malveillante</li>
                <li>Tenter d'accéder à des zones sécurisées du site</li>
                <li>Interférer avec le fonctionnement du site</li>
                <li>Transmettre des virus ou du code malveillant</li>
                <li>Collecter des informations sur d'autres utilisateurs</li>
                <li>Utiliser le site pour des activités commerciales non autorisées</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                3.2 Compte utilisateur
              </h3>
              <p className="text-gray-700 mb-4">
                Pour effectuer des achats, vous devez créer un compte ou utiliser le mode invité. 
                Vous êtes responsable de :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Maintenir la confidentialité de vos identifiants</li>
                <li>Fournir des informations exactes et à jour</li>
                <li>Notifier immédiatement toute utilisation non autorisée</li>
                <li>Respecter les règles de sécurité du site</li>
              </ul>
            </section>

            {/* Produits et commandes */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Produits et commandes
              </h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                4.1 Description des produits
              </h3>
              <p className="text-gray-700 mb-4">
                Nous nous efforçons de fournir des descriptions précises des produits. 
                Cependant, nous ne garantissons pas l'exactitude complète des informations 
                affichées. Les images sont fournies à titre indicatif.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                4.2 Disponibilité
              </h3>
              <p className="text-gray-700 mb-4">
                La disponibilité des produits est indiquée en temps réel. Nous nous réservons 
                le droit de modifier ou d'interrompre la vente de tout produit sans préavis.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                4.3 Commandes
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Les commandes sont soumises à notre acceptation</li>
                <li>Nous pouvons refuser une commande pour des raisons légitimes</li>
                <li>La confirmation de commande sera envoyée par email</li>
                <li>Les prix affichés sont en FCFA et incluent la TVA</li>
                <li>Les frais de livraison s'ajoutent au prix des produits</li>
              </ul>
            </section>

            {/* Paiement */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Paiement
              </h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                5.1 Méthodes de paiement
              </h3>
              <p className="text-gray-700 mb-4">
                Nous acceptons les méthodes de paiement suivantes :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Cartes bancaires (Visa, Mastercard)</li>
                <li>Paiement mobile (Wave, Orange Money, Free Money)</li>
                <li>Paiement à la livraison (selon disponibilité)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                5.2 Sécurité des paiements
              </h3>
              <p className="text-gray-700 mb-4">
                Tous les paiements sont traités de manière sécurisée par nos partenaires 
                de paiement certifiés. Nous ne stockons pas vos informations de paiement.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                5.3 Facturation
              </h3>
              <p className="text-gray-700">
                Une facture électronique sera générée pour chaque commande et envoyée 
                par email. Les factures sont également disponibles dans votre espace client.
              </p>
            </section>

            {/* Livraison */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Livraison
              </h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                6.1 Zones de livraison
              </h3>
              <p className="text-gray-700 mb-4">
                Nous livrons dans tout le Sénégal. Les délais et frais de livraison 
                varient selon votre localisation.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                6.2 Délais de livraison
              </h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Dakar : 1-2 jours ouvrables</li>
                <li>Autres villes : 3-5 jours ouvrables</li>
                <li>Zones rurales : 5-7 jours ouvrables</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                6.3 Suivi de commande
              </h3>
              <p className="text-gray-700">
                Vous recevrez des notifications par email et SMS pour suivre votre commande. 
                Le suivi en temps réel est disponible dans votre espace client.
              </p>
            </section>

            {/* Retours et remboursements */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Retours et remboursements
              </h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                7.1 Droit de rétractation
              </h3>
              <p className="text-gray-700 mb-4">
                Vous disposez d'un délai de 14 jours à compter de la réception pour 
                exercer votre droit de rétractation, sauf pour les produits exclus.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                7.2 Conditions de retour
              </h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Produit dans son état d'origine</li>
                <li>Emballage complet et intact</li>
                <li>Accessoires et documentation inclus</li>
                <li>Demande de retour dans les délais</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                7.3 Remboursement
              </h3>
              <p className="text-gray-700">
                Le remboursement sera effectué dans un délai de 14 jours après réception 
                du retour, selon la méthode de paiement utilisée.
              </p>
            </section>

            {/* Garanties */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Garanties
              </h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">
                8.1 Garantie légale
              </h3>
              <p className="text-gray-700 mb-4">
                Tous nos produits bénéficient de la garantie légale de conformité 
                et de la garantie des vices cachés.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                8.2 Garantie constructeur
              </h3>
              <p className="text-gray-700">
                Les produits bénéficient également de la garantie constructeur selon 
                les conditions définies par chaque fabricant.
              </p>
            </section>

            {/* Responsabilité */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Responsabilité
              </h2>
              <p className="text-gray-700 mb-4">
                Kapital Stores s'engage à fournir un service de qualité mais ne peut garantir :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>L'absence totale d'interruptions du service</li>
                <li>L'exactitude absolue des informations</li>
                <li>La compatibilité avec tous les appareils</li>
                <li>L'absence de virus ou de bugs</li>
              </ul>
              <p className="text-gray-700">
                Notre responsabilité est limitée au montant de votre commande, 
                sauf en cas de faute intentionnelle ou de négligence grave.
              </p>
            </section>

            {/* Propriété intellectuelle */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Propriété intellectuelle
              </h2>
              <p className="text-gray-700 mb-4">
                Tout le contenu du site (textes, images, logos, design) est protégé 
                par les droits de propriété intellectuelle. Il est interdit de :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Reproduire ou distribuer le contenu sans autorisation</li>
                <li>Utiliser nos marques ou logos</li>
                <li>Modifier ou décompiler le code du site</li>
                <li>Extraire des données à des fins commerciales</li>
              </ul>
            </section>

            {/* Protection des données */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Protection des données
              </h2>
              <p className="text-gray-700">
                La collecte et le traitement de vos données personnelles sont régis 
                par notre politique de confidentialité, accessible sur le site. 
                Nous nous engageons à respecter le RGPD et les lois applicables.
              </p>
            </section>

            {/* Droit applicable */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Droit applicable et juridiction
              </h2>
              <p className="text-gray-700">
                Les présentes conditions sont régies par le droit sénégalais. 
                En cas de litige, les tribunaux sénégalais sont seuls compétents, 
                sauf pour les consommateurs qui peuvent saisir les tribunaux de leur domicile.
              </p>
            </section>

            {/* Modifications */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Modifications des conditions
              </h2>
              <p className="text-gray-700">
                Nous nous réservons le droit de modifier ces conditions à tout moment. 
                Les modifications prendront effet dès leur publication sur le site. 
                Nous vous informerons des changements importants par email.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Contact
              </h2>
              <p className="text-gray-700 mb-4">
                Pour toute question concernant ces conditions, contactez-nous :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email :</strong> legal@kapital-stores.shop<br />
                  <strong>Adresse :</strong> Kapital Stores, Fass Delorme, Dakar<br />
                  <strong>Téléphone :</strong> +221 76 180 06 49
                </p>
              </div>
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

export default TermsPage; 