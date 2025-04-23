import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gray-50 px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="mb-2 text-9xl font-extrabold text-blue-600">404</h1>
        <h2 className="mb-6 text-3xl font-bold text-gray-900">Page Not Found</h2>
        <p className="mb-8 text-lg text-gray-600">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Homepage
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;