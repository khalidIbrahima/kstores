import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, HelpCircle, ExternalLink } from 'lucide-react';

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpArticles = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of setting up and managing your store',
      category: 'Basics'
    },
    {
      title: 'Product Management',
      description: 'How to add, edit, and organize your products',
      category: 'Products'
    },
    {
      title: 'Order Processing',
      description: 'Understanding the order fulfillment workflow',
      category: 'Orders'
    },
    {
      title: 'Payment Settings',
      description: 'Configure payment methods and processing',
      category: 'Payments'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Center</h1>
        <p className="text-gray-600">Get help and learn more about using the platform</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Contact Support', icon: MessageSquare, color: 'blue' },
          { title: 'Knowledge Base', icon: HelpCircle, color: 'purple' },
          { title: 'Video Tutorials', icon: ExternalLink, color: 'green' }
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg bg-white p-6 shadow-md"
          >
            <div className={`mb-4 inline-flex rounded-full bg-${item.color}-100 p-3`}>
              <item.icon className={`h-6 w-6 text-${item.color}-600`} />
            </div>
            <h3 className="mb-2 text-lg font-medium">{item.title}</h3>
            <p className="text-sm text-gray-600">
              Get help from our support team
            </p>
            <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500">
              Learn More →
            </button>
          </motion.div>
        ))}
      </div>

      {/* Help Articles */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-medium">Popular Articles</h2>
        <div className="space-y-4">
          {helpArticles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{article.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{article.description}</p>
                </div>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {article.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-medium">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              question: 'How do I process refunds?',
              answer: 'You can process refunds through the Orders section. Select the order and click the Refund button.'
            },
            {
              question: 'Can I customize my store theme?',
              answer: 'Yes, you can customize your store theme in the Appearance settings section.'
            },
            {
              question: 'How do I add new products?',
              answer: 'Navigate to Products section and click the Add Product button to create new products.'
            }
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-gray-200 p-4"
            >
              <h3 className="font-medium text-gray-900">{faq.question}</h3>
              <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-lg bg-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-blue-900">Need More Help?</h2>
            <p className="mt-1 text-sm text-blue-700">
              Our support team is available 24/7 to assist you
            </p>
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;