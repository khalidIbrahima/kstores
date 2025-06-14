import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Kapital Store</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Créer des expériences d'achat exceptionnelles avec des produits de qualité et un service client supérieur.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 transition-colors hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-white">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">Accueil</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white">Boutique</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white">À Propos</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">Contact</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Service Client</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="hover:text-white">FAQ</Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-white">Politique de Livraison</Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-white">Retours et Remboursements</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white">Politique de Confidentialité</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white">Conditions Générales</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contactez-nous</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <Mail size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>support@kapitalstore.com</span>
              </li>
              <li className="flex items-start">
                <Phone size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>+221 77</span>
              </li>
              <li>
                <p>Rue FA 21</p>
                <p>Fass Delorme, Dakar</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
          <p className="mb-2">
            &copy; {currentYear} Kapital Store. Tous droits réservés.
          </p>
          <p className="text-gray-500">
            Conçu et développé avec soin pour le client moderne.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;