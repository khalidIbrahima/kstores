import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const CustomerGroups = () => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      toast.error('Failed to fetch customer groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implementation for creating/updating customer groups
    toast.success('Feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Groups</h1>
          <p className="text-gray-600">Manage and organize your customer segments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-6 shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">{group.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-blue-600">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{group.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {group.member_count || 0} members
              </span>
              <span className="text-xs text-gray-400">
                Created {new Date(group.created_at).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CustomerGroups;