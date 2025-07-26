import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Clock, Mail, Phone, Zap, Shield, ArrowUp } from 'lucide-react';

const MaintenancePage = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: {
      width: "65%",
      transition: {
        duration: 2,
        ease: "easeInOut",
        delay: 1
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20"
          >
            {/* Animated Icon */}
            <motion.div
              variants={iconVariants}
              className="relative mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-lg"
            >
              <motion.div
                variants={floatingVariants}
                animate="animate"
              >
                <Wrench className="w-12 h-12 text-white" />
              </motion.div>
              
              {/* Rotating Ring */}
              <motion.div
                className="absolute inset-0 border-4 border-blue-300 rounded-full"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>

            {/* Animated Title */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Site en
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-purple-600"
              >
                Maintenance
              </motion.span>
            </motion.h1>

            {/* Animated Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-600 mb-8 leading-relaxed"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                Nous travaillons actuellement sur des améliorations pour vous offrir une meilleure expérience.
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className="font-semibold text-blue-600"
              >
                Merci de votre patience !
              </motion.span>
            </motion.p>

            {/* Animated Progress Section */}
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="flex items-center justify-center space-x-2 mb-4"
              >
                <motion.div
                  variants={pulseVariants}
                  animate="animate"
                >
                  <Clock className="w-6 h-6 text-blue-600" />
                </motion.div>
                <span className="text-lg font-medium text-gray-700">Temps estimé: 30 minutes</span>
              </motion.div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  variants={progressVariants}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full relative"
                >
                  <motion.div
                    className="absolute inset-0 bg-white opacity-30"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Animated Features Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-left p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <h3 className="font-bold text-gray-900">🛠️ Améliorations en cours</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Mise à jour des performances et ajout de nouvelles fonctionnalités
                </p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-left p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Shield className="w-6 h-6 text-green-600" />
                  </motion.div>
                  <h3 className="font-bold text-gray-900">⚡ Retour rapide</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Le site sera de nouveau disponible dans quelques minutes
                </p>
              </motion.div>
            </motion.div>

            {/* Animated Contact Section */}
            <motion.div
              variants={itemVariants}
              className="border-t border-gray-200 pt-6"
            >
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="text-xl font-bold text-gray-900 mb-4"
              >
                Besoin d'aide urgente ?
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6"
              >
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="mailto:contact@kapitalstore.com"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100"
                >
                  <Mail className="w-4 h-4" />
                  <span>contact@kapital-stores.shop</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="tel:+1234567890"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100"
                >
                  <Phone className="w-4 h-4" />
                  <span>+221 77 180 06 49</span>
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Animated Refresh Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-8 inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mr-3"
              >
                <ArrowUp className="w-5 h-5" />
              </motion.div>
              Actualiser la page
            </motion.button>
          </motion.div>

          {/* Animated Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-8 text-center text-sm text-gray-500"
          >
            <p>© 2024 Kapital Stores. Tous droits réservés.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MaintenancePage; 