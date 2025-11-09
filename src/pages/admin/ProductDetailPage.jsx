import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Edit, Trash2, X, Copy, Eye } from 'lucide-react';
import ProductImageCarousel from '../../components/ProductImageCarousel';
import ProductForm from './ProductForm';
import toast from 'react-hot-toast';
import { urlUtils } from '../../utils/slugUtils';
import { formatDescriptionFull } from '../../utils/formatDescription.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [variantTypes, setVariantTypes] = useState([]);
  const [variantCombinations, setVariantCombinations] = useState([]);
  const [variantLoading, setVariantLoading] = useState(true);
  const [variantError, setVariantError] = useState(null);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Erreur lors du chargement du produit');
      setProduct(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const normalizeVariantValues = (values) => {
    if (!values) return {};
    if (typeof values === 'string') {
      try {
        const parsed = JSON.parse(values);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch (error) {
        console.error('Failed to parse variant values string:', error);
        return {};
      }
    }
    if (Array.isArray(values)) {
      try {
        return Object.fromEntries(values);
      } catch {
        return {};
      }
    }
    if (typeof values === 'object') {
      return values;
    }
    return {};
  };

  const fetchVariantDetails = async (productId) => {
    if (!productId) {
      setVariantTypes([]);
      setVariantCombinations([]);
      setVariantLoading(false);
      return;
    }

    setVariantLoading(true);
    setVariantError(null);

    try {
      const [
        { data: variantsData, error: variantsError },
        { data: combinationsData, error: combinationsError }
      ] = await Promise.all([
        supabase
          .from('product_variants')
          .select('id, name, display_order, product_variant_options(id, name, image_url, display_order)')
          .eq('product_id', productId)
          .order('display_order', { ascending: true })
          .order('display_order', { foreignTable: 'product_variant_options', ascending: true }),
        supabase
          .from('product_variant_combinations')
          .select('id, sku, price, inventory, image_url, is_active, variant_values, created_at, updated_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })
      ]);

      if (variantsError) throw variantsError;
      if (combinationsError) throw combinationsError;

      const mappedVariants = (variantsData || [])
        .map((variant) => ({
          id: variant.id,
          name: variant.name,
          display_order: variant.display_order ?? 0,
          options: (variant.product_variant_options || [])
            .map((option) => ({
              id: option.id,
              name: option.name,
              image_url: option.image_url || '',
              display_order: option.display_order ?? 0
            }))
            .sort((a, b) => a.display_order - b.display_order)
        }))
        .sort((a, b) => a.display_order - b.display_order);

      const mappedCombinations = (combinationsData || []).map((combination) => ({
        ...combination,
        parsed_variant_values: normalizeVariantValues(combination.variant_values)
      }));

      setVariantTypes(mappedVariants);
      setVariantCombinations(mappedCombinations);
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setVariantError(error);
      setVariantTypes([]);
      setVariantCombinations([]);
      toast.error("Erreur lors du chargement des variantes du produit");
    } finally {
      setVariantLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchVariantDetails(id);
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

  const generateCloneName = async (baseName) => {
    const cleanName = baseName?.replace(/\s\(Clone(?: \d+)?\)$/i, '') || 'Produit';
    const { data, error } = await supabase
      .from('products')
      .select('name')
      .ilike('name', `${cleanName}%`);

    if (error) {
      console.error('Error checking clone names:', error);
      return `${cleanName} (Clone)`;
    }

    const existingNames = new Set((data || []).map((item) => item.name));
    let cloneName = `${cleanName} (Clone)`;
    let counter = 2;
    while (existingNames.has(cloneName)) {
      cloneName = `${cleanName} (Clone ${counter})`;
      counter += 1;
    }
    return cloneName;
  };

  const handleClone = async () => {
    if (!product) return;

    try {
      setCloning(true);

      const clonedName = await generateCloneName(product.name);
      const {
        id: originalId,
        created_at,
        updated_at,
        categories,
        slug,
        reviews,
        order_items,
        supplierProducts,
        ...cloneData
      } = product;

      cloneData.name = clonedName;

      if (cloneData.price !== undefined && cloneData.price !== null) {
        const parsedPrice = Number(cloneData.price);
        cloneData.price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
      }

      if (cloneData.inventory !== undefined && cloneData.inventory !== null) {
        const parsedInventory = Number(cloneData.inventory);
        cloneData.inventory = Number.isFinite(parsedInventory) ? parsedInventory : 0;
      }

      if (cloneData.isActive === undefined || cloneData.isActive === null) {
        cloneData.isActive = true;
      }

      const { data: inserted, error } = await supabase
        .from('products')
        .insert([cloneData])
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Produit cloné avec succès');

      if (inserted?.id) {
        navigate(`/admin/products/${inserted.id}`);
      } else {
        await fetchProduct();
      }
    } catch (error) {
      console.error('Error cloning product:', error);
      toast.error('Impossible de cloner le produit');
    } finally {
      setCloning(false);
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
  };

  const handleProductSaved = async () => {
    await fetchProduct();
    await fetchVariantDetails(id);
    setShowEditModal(false);
  };

  const formatVariantValueSummary = (values) => {
    const entries = Object.entries(values || {}).filter(([key, value]) => key && value);
    if (entries.length === 0) return '—';
    return entries.map(([key, value]) => `${key}: ${value}`).join(' • ');
  };

  const handleCopyToClipboard = async (value, successMessage = 'Copié dans le presse-papiers') => {
    if (!value) return;
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error("Impossible de copier dans le presse-papiers");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto my-16 px-4 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Produit introuvable</h2>
        <Link to="/admin/products" className="rounded-md bg-blue-600 dark:bg-blue-500 px-6 py-3 text-white hover:bg-blue-700 dark:hover:bg-blue-600 inline-flex items-center">
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

  const storefrontUrl = urlUtils.generateProductUrl(product);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Link to="/admin/products" className="mb-8 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200">
        <ArrowLeft className="mr-2 h-5 w-5" /> Retour à la liste
      </Link>
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-start border border-gray-200 dark:border-gray-700">
        <div>
          <ProductImageCarousel images={images} wrapperClassName="w-full max-w-md mx-auto" />
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-8">
            <Link
              to={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-blue-600 dark:bg-blue-500 px-5 py-2 font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              <Eye className="mr-2 h-5 w-5" />
              Voir en boutique
            </Link>
            <button
              onClick={handleEdit}
              className="inline-flex items-center rounded-md bg-yellow-400 dark:bg-yellow-500 px-5 py-2 font-medium text-gray-900 dark:text-gray-100 hover:bg-yellow-300 dark:hover:bg-yellow-400 transition"
            >
              <Edit className="mr-2 h-5 w-5" /> Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-md bg-red-600 dark:bg-red-500 px-5 py-2 font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition disabled:opacity-50"
            >
              <Trash2 className="mr-2 h-5 w-5" /> {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
            <button
              onClick={handleClone}
              disabled={cloning}
              className="inline-flex items-center rounded-md bg-indigo-600 dark:bg-indigo-500 px-5 py-2 font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50"
            >
              <Copy className="mr-2 h-5 w-5" /> {cloning ? 'Clonage...' : 'Cloner'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-12 space-y-10">
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Variantes du produit</h2>
            {!variantLoading && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {variantTypes.length} type{variantTypes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {variantLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-purple-500 dark:border-purple-300" />
            </div>
          ) : variantError ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-200">
              Une erreur est survenue lors du chargement des variantes.
            </div>
          ) : variantTypes.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucune variante configurée pour ce produit.
            </div>
          ) : (
            <div className="space-y-6">
              {variantTypes.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-xl border border-purple-100 dark:border-purple-700/40 bg-purple-50/60 dark:bg-purple-900/10 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200">{variant.name}</h3>
                      <p className="text-xs text-purple-600/80 dark:text-purple-300/70">
                        Ordre d'affichage : {variant.display_order}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-200 bg-white/70 dark:bg-purple-800/40 px-3 py-1 rounded-full">
                      {variant.options.length} option{variant.options.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {variant.options.map((option) => (
                      <div
                        key={option.id}
                        className="inline-flex items-center gap-3 rounded-lg border border-purple-200 dark:border-purple-600 bg-white dark:bg-gray-900/40 px-3 py-2 shadow-sm"
                      >
                        {option.image_url ? (
                          <img
                            src={option.image_url}
                            alt={`${variant.name} - ${option.name}`}
                            className="h-20 w-20 rounded-md object-cover border border-purple-100 dark:border-purple-700/60"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-20 w-20 flex items-center justify-center rounded-md bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-300 text-sm font-semibold uppercase">
                            {option.name.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Ordre : {option.display_order}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Combinaisons de variantes</h2>
            {!variantLoading && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {variantCombinations.length} combinaison{variantCombinations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {variantLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500 dark:border-indigo-300" />
            </div>
          ) : variantError ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-200">
              Impossible de charger les combinaisons.
            </div>
          ) : variantCombinations.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucune combinaison configurée. Utilisez le formulaire d'édition pour créer des combinaisons.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Variantes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Mise à jour
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900/40">
                  {variantCombinations.map((combination) => (
                    <tr key={combination.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {formatVariantValueSummary(combination.parsed_variant_values)}
                          </p>
                          {combination.image_url && (
                            <img
                              src={combination.image_url}
                              alt={`Combinaison ${combination.id}`}
                              className="h-14 w-14 rounded object-cover border border-gray-200 dark:border-gray-700"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-800 dark:text-gray-200">
                            {combination.sku || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {combination.price ? `${combination.price} FCFA` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {combination.inventory ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            combination.is_active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {combination.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-400">
                        {combination.updated_at
                          ? new Date(combination.updated_at).toLocaleString()
                          : combination.created_at
                          ? new Date(combination.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(combination.id, 'Identifiant copié')}
                            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copier l'ID
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showEditModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:left-64" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:left-64">
            <div className="relative w-full max-w-[76vw] mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
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
                <ProductForm product={product} onClose={handleModalClose} onSaved={handleProductSaved} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetailPage; 