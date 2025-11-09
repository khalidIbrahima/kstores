import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Tv, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Check, 
  PlayCircle, 
  Globe,
  Clock,
  Wifi,
  Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const IPTVPage = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Images de programmes TV pour le slider du hero
  const tvImages = [
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?auto=format&fit=crop&w=1200&q=80', // Football
    'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80', // Série
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', // Documentaire
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80', // Dessin animé
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'  // Actualités
  ];
  const heroCaptions = [
    'Le meilleur du football en direct',
    'Vos séries préférées à la demande',
    'Des documentaires fascinants',
    'Des dessins animés pour toute la famille',
    'L\'actualité en temps réel sur toutes vos chaînes'
  ];
  const [currentTvImage, setCurrentTvImage] = useState(0);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('iptv_plans')
          .select('*')
          .order('price');

        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error(t('errors.general'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTvImage((prev) => (prev + 1) % tvImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [tvImages.length]);

  const handleChoosePlan = (plan) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: `/iptv-checkout?plan=${plan.id}`,
          message: t('auth.loginRequired')
        }
      });
      return;
    }
    navigate(`/iptv-checkout?plan=${plan.id}`);
  };
  
  const features = [
    {
      icon: Globe,
      title: t('iptv.features.global.title'),
      description: t('iptv.features.global.description')
    },
    {
      icon: PlayCircle,
      title: t('iptv.features.vod.title'),
      description: t('iptv.features.vod.description')
    },
    {
      icon: Clock,
      title: t('iptv.features.availability.title'),
      description: t('iptv.features.availability.description')
    },
    {
      icon: Wifi,
      title: t('iptv.features.devices.title'),
      description: t('iptv.features.devices.description')
    }
  ];

  const devices = [
    { icon: Tv, name: t('iptv.devices.tv') },
    { icon: Smartphone, name: t('iptv.devices.smartphone') },
    { icon: Monitor, name: t('iptv.devices.computer') },
    { icon: Tablet, name: t('iptv.devices.tablet') }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Slider d'images TV en fond */}
        <img
          src={tvImages[currentTvImage]}
          alt="Programme TV"
          className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-primary/60 to-transparent z-10"></div>
        <div className="relative z-20 w-full text-center flex flex-col items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-white drop-shadow-xl mb-6"
          >
            Expérience <span className="text-accent">IPTV</span> Premium
          </motion.h1>
          <motion.p
            key={currentTvImage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-xl md:text-2xl font-medium text-white drop-shadow"
          >
            {heroCaptions[currentTvImage]}
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary px-8 py-4 text-lg flex items-center gap-2 mx-auto shadow-lg"
            onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
          >
            <Tv className="h-6 w-6" /> Découvrir les offres
          </motion.button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background-light">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text-dark">{t('iptv.features.title')}</h2>
            <p className="text-text-light">{t('iptv.features.subtitle')}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl bg-white shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-start"
              >
                <div className={`mb-4 inline-flex items-center justify-center rounded-full p-3 ${index === 0 ? 'bg-accent' : index === 1 ? 'bg-primary' : index === 2 ? 'bg-orange-400' : 'bg-blue-400'}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-text-dark">{feature.title}</h3>
                <p className="text-text-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text-dark">{t('iptv.plans.title')}</h2>
            <p className="text-text-light">{t('iptv.plans.subtitle')}</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan, index) => {
                // Palette personnalisée par plan
                let cardClass = '';
                let titleClass = '';
                let priceClass = '';
                let btnClass = '';
                let badgeClass = '';
                if (index === 0) { // Basic
                  cardClass = 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200';
                  titleClass = 'text-blue-900';
                  priceClass = 'text-blue-900';
                  btnClass = 'bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 mt-4 transition';
                } else if (plan.is_popular) { // Populaire
                  cardClass = 'bg-gradient-to-br from-accent via-primary to-accent text-white ring-2 ring-accent border-2 border-accent';
                  titleClass = 'text-white';
                  priceClass = 'text-white';
                  btnClass = 'bg-white text-accent font-semibold rounded-lg py-3 mt-4 hover:bg-accent/90 transition';
                  badgeClass = 'absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-bold text-accent shadow';
                } else { // Ultimate
                  cardClass = 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200';
                  titleClass = 'text-yellow-900';
                  priceClass = 'text-yellow-900';
                  btnClass = 'bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg py-3 mt-4 transition';
                }
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-2xl p-8 shadow-lg border flex flex-col ${cardClass}`}
                  >
                    {plan.is_popular && (
                      <div className={badgeClass}>{t('iptv.plans.popular')}</div>
                    )}
                    <h3 className={`mb-4 text-xl font-bold ${titleClass}`}>{plan.name}</h3>
                    <div className="mb-6">
                      <span className={`text-4xl font-extrabold ${priceClass}`}>{t('common.currency')} {plan.price}</span>
                      <span className={`ml-1 text-base ${plan.is_popular ? 'text-white/80' : 'text-text-light'}`}>/mois</span>
                    </div>
                    <ul className="mb-8 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className={`flex items-center ${plan.is_popular ? 'text-white' : titleClass}`}>
                          <Check className={`mr-2 h-5 w-5 ${plan.is_popular ? 'text-white' : 'text-accent'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.isActive ? (
                      <button
                        onClick={() => handleChoosePlan(plan)}
                        className={btnClass}
                      >
                        {t('iptv.plans.choose')}
                      </button>
                    ) : (
                      <div className="w-full rounded-lg bg-background text-text-light text-center py-3 font-semibold border border-background-dark opacity-70 cursor-not-allowed">
                        {t('iptv.plans.unavailable')}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background-light">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text-dark">{t('iptv.faq.title')}</h2>
            <p className="text-text-light">{t('iptv.faq.subtitle')}</p>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            {[
              {
                question: t('iptv.faq.devices.question'),
                answer: t('iptv.faq.devices.answer')
              },
              {
                question: t('iptv.faq.legal.question'),
                answer: t('iptv.faq.legal.answer')
              },
              {
                question: t('iptv.faq.refund.question'),
                answer: t('iptv.faq.refund.answer')
              },
              {
                question: t('iptv.faq.support.question'),
                answer: t('iptv.faq.support.answer')
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-lg p-6 shadow-md ${index % 2 === 0 ? 'bg-primary/10' : 'bg-background'}`}
              >
                <h3 className="mb-2 text-xl font-semibold text-text-dark">{faq.question}</h3>
                <p className="text-text-light">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-900 to-purple-900 p-12 text-center">
            <h2 className="mb-6 text-3xl font-bold">Ready to Start Watching?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
              Join thousands of satisfied customers and enjoy premium entertainment today
            </p>
            <button 
              onClick={() => handleChoosePlan(plans.find(p => p.is_popular) || plans[0])}
              className="rounded-lg bg-white px-8 py-3 font-medium text-blue-900 transition-colors hover:bg-gray-100"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section> */}

      {/* Trust Badges */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-green-500" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-blue-500" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="h-6 w-6 text-purple-500" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IPTVPage;