import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-text-dark">Toutes les catégories</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.slug}`} className="group block overflow-hidden rounded-lg bg-background shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            {cat.cover_image_url ? (
              <div className="aspect-w-16 aspect-h-9 relative h-48">
                <img 
                  src={cat.cover_image_url} 
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div 
                  className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500"
                  style={{ display: 'none' }}
                >
                  <span className="text-sm">Image non disponible</span>
                </div>
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-xl font-semibold">{cat.name}</h2>
                </div>
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-primary">{cat.name}</h2>
              <p className="text-text-light mt-2">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage; 