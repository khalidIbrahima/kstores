import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Edit, Trash2, X } from 'lucide-react';
import ProductImageCarousel from '../../components/ProductImageCarousel';
import ProductForm from './ProductForm';
import toast from 'react-hot-toast';
import { formatDescriptionFull } from '../../utils/formatDescription.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();
      setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    setDeleting(true);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    setDeleting(false);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Produit supprimé');
      navigate('/admin/products');
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto my-16 px-4 text-center">
        <h2 className="mb-6 text-2xl font-bold">Produit introuvable</h2>
        <Link to="/admin/products" className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 inline-flex items-center">
          <ArrowLeft className="mr-2 h-5 w-5" /> Retour à la liste
        </Link>
      </div>
    );
  }

  const images = [
    product.image_url,
    product.image_url1,
    product.image_url2,
    product.image_url3,
    product.image_url4
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Link to="/admin/products" className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 transition-colors duration-200">
        <ArrowLeft className="mr-2 h-5 w-5" /> Retour à la liste
      </Link>
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-start border border-gray-200 dark:border-gray-700">
        <div>
          <ProductImageCarousel images={images} />
        </div>
        <div>
          <div className="flex items-center mb-4">
            <h1 className="text-3xl font-bold mr-4 text-gray-900 dark:text-gray-100">{product.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 ${product.isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
              {product.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="mb-6 text-gray-700 dark:text-gray-300 text-base">{formatDescriptionFull(product.description)}</div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-blue-700 dark:text-blue-400">{product.price} FCFA</span>
          </div>
          <div className="mb-4 text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-900 dark:text-gray-100">Stock :</span> {product.inventory}</div>
          <div className="mb-4 text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-900 dark:text-gray-100">Catégorie :</span> {product.categories?.name || '-'}</div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleEdit}
              className="inline-flex items-center rounded-md bg-yellow-400 px-5 py-2 font-medium text-gray-900 hover:bg-yellow-300 transition"
            >
              <Edit className="mr-2 h-5 w-5" /> Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-md bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              <Trash2 className="mr-2 h-5 w-5" /> {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
      {showEditModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Modifier le produit</h2>
                <button
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={handleModalClose}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <ProductForm product={product} onClose={handleModalClose} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetailPage; 