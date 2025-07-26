import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, YoutubeIcon, Mail, Phone } from 'lucide-react';
import logoHorizontal from '../../assets/logo-transparent.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-text-dark pt-12">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <img src={logoHorizontal} alt="Kapital Stores Logo" className="mb-4 h-12 w-auto" style={{objectFit: 'contain'}} />
            <p className="mb-4 text-sm leading-relaxed text-text-light">
              Créer des expériences d'achat exceptionnelles avec des produits de qualité et un service client supérieur.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-text-light transition-colors hover:text-primary">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-text-light transition-colors hover:text-primary">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-text-light transition-colors hover:text-primary">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-text-light transition-colors hover:text-primary">
                <YoutubeIcon size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-dark">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-text-light hover:text-primary transition-colors">Accueil</Link>
              </li>
              <li>
                <Link to="/products" className="text-text-light hover:text-primary transition-colors">Boutique</Link>
              </li>
              <li>
                <Link to="/about" className="text-text-light hover:text-primary transition-colors">À Propos</Link>
              </li>
              <li>
                <Link to="/contact" className="text-text-light hover:text-primary transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/blog" className="text-text-light hover:text-primary transition-colors">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-dark">Service Client</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-text-light hover:text-primary transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/shipping" className="text-text-light hover:text-primary transition-colors">Politique de Livraison</Link>
              </li>
              <li>
                <Link to="/returns" className="text-text-light hover:text-primary transition-colors">Retours et Remboursements</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-text-light hover:text-primary transition-colors">Politique de Confidentialité</Link>
              </li>
              <li>
                <Link to="/terms" className="text-text-light hover:text-primary transition-colors">Conditions Générales</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text-dark">Contactez-nous</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <Mail size={18} className="mr-2 mt-0.5 flex-shrink-0 text-text-light" />
                <span className="text-text-light">support@kapital-stores.shop</span>
              </li>
              <li className="flex items-start">
                <Phone size={18} className="mr-2 mt-0.5 flex-shrink-0 text-text-light" />
                <span className="text-text-light">+221 76 180 06 49</span>
              </li>
              <li>
                <p className="text-text-light">Rue FA 21</p>
                <p className="text-text-light">Fass Delorme, Dakar</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-background-dark pt-8 text-center text-sm">
          <p className="mb-2 text-text-dark">
            &copy; {currentYear} Kapital Stores. Tous droits réservés.
          </p>
          <p className="text-text-light">
            Conçu et développé avec soin pour le client moderne.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;