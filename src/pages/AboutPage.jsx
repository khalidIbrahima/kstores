import { motion } from 'framer-motion';
import { ShoppingBag, Truck, Shield, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-900 py-20 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t('about.title')}</h1>
            <p className="mx-auto max-w-2xl text-lg text-blue-100">
              {t('about.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-6 text-3xl font-bold">{t('about.story.title')}</h2>
            <p className="mb-8 text-lg text-gray-600">
              {t('about.story.content1')}
            </p>
            <p className="text-lg text-gray-600">
              {t('about.story.content2')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">{t('about.values.title')}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('about.values.quality.title')}</h3>
              <p className="text-gray-600">{t('about.values.quality.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('about.values.delivery.title')}</h3>
              <p className="text-gray-600">{t('about.values.delivery.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <Shield className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('about.values.security.title')}</h3>
              <p className="text-gray-600">{t('about.values.security.description')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t('about.values.customer.title')}</h3>
              <p className="text-gray-600">{t('about.values.customer.description')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">{t('about.team.title')}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              /* {
                name: t('about.team.members.ceo.name'),
                role: t('about.team.members.ceo.role'),
                image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
              }, */
              {
                name: t('about.team.members.operations.name'),
                role: t('about.team.members.operations.role'),
                image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
              }/* ,
              {
                name: t('about.team.members.service.name'),
                role: t('about.team.members.service.role'),
                image: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg'
              } */
            ].map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-64 w-full object-cover"
                  />
                </div>
                <h3 className="mb-1 text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;