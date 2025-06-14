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
        toast.error('Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleChoosePlan = (plan) => {
    if (!user) {
      // If user is not logged in, redirect to login page with return path
      navigate('/login', { 
        state: { 
          from: `/checkout?plan=${plan.id}`,
          message: 'Please log in to subscribe to this plan'
        }
      });
      return;
    }

    // If user is logged in, redirect to checkout with plan
    navigate(`/checkout?plan=${plan.id}`);
  };
  
  const features = [
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Access channels from around the world with our extensive international coverage'
    },
    {
      icon: PlayCircle,
      title: 'Video on Demand',
      description: 'Enjoy thousands of movies and TV shows on demand'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Watch your favorite content anytime, anywhere with our reliable service'
    },
    {
      icon: Wifi,
      title: 'Multi-device Support',
      description: 'Stream on any device with our compatible apps and web player'
    }
  ];

  const devices = [
    { icon: Tv, name: 'Smart TV' },
    { icon: Smartphone, name: 'Smartphone' },
    { icon: Monitor, name: 'Computer' },
    { icon: Tablet, name: 'Tablet' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1a237e,_transparent_50%)]"></div>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              Premium IPTV Experience
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
              Enjoy thousands of channels and VOD content in HD quality on all your devices
            </p>
            <div className="flex justify-center space-x-4">
              {devices.map((device, index) => (
                <motion.div
                  key={device.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-2 rounded-full bg-blue-900 p-3">
                    <device.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm">{device.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose Our IPTV Service?</h2>
            <p className="text-gray-400">Experience the best in entertainment with our premium features</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg bg-gray-800 p-6"
              >
                <div className="mb-4 inline-block rounded-full bg-blue-900 p-3">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Choose Your Plan</h2>
            <p className="text-gray-400">Select the perfect plan for your entertainment needs</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-lg ${
                    plan.is_popular ? 'bg-gradient-to-b from-purple-900 to-purple-800' : 'bg-gray-800'
                  } p-8`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 right-4 rounded-full bg-purple-500 px-4 py-1 text-sm font-medium">
                      Popular
                    </div>
                  )}
                  <h3 className="mb-4 text-2xl font-bold">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-400">/{plan.duration}</span>
                  </div>
                  <ul className="mb-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="mr-2 h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleChoosePlan(plan)}
                    className={`w-full rounded-lg ${
                      plan.is_popular
                        ? 'bg-purple-500 hover:bg-purple-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } px-6 py-3 font-medium transition-colors`}
                  >
                    Choose {plan.name}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-gray-400">Find answers to common questions about our IPTV service</p>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            {[
              {
                question: 'What devices are supported?',
                answer: 'Our IPTV service works on Smart TVs, Android devices, iOS devices, computers, and more through our dedicated apps and web player.'
              },
              {
                question: 'Is the service legal?',
                answer: 'We operate in compliance with all applicable laws and regulations, providing licensed content through official partnerships.'
              },
              {
                question: 'What\'s your refund policy?',
                answer: 'We offer a 7-day money-back guarantee if you\'re not satisfied with our service.'
              },
              {
                question: 'Do you offer technical support?',
                answer: 'Yes, we provide 24/7 technical support through live chat, email, and phone.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg bg-gray-800 p-6"
              >
                <h3 className="mb-3 text-lg font-medium">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
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
      </section>

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