import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const numberFormat = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2, ...options });
};

export default function SupplierOrderItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    unit_price_usd: '',
    quantity: '',
    unit_weight: '',
    unit_cbm: '',
    image_url: '',
    ads_amount: '',
    notes: ''
  });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('supplier_order_items')
        .select(`
          *,
          supplier_orders (
            id,
            title,
            order_number,
            order_date,
            usd_xof_value,
            bank_fees_usd,
            shipping_fees_usd
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching supplier order item:', error);
        setError('Impossible de charger le produit fournisseur.');
        setLoading(false);
        return;
      }

      setItem(data);
      setFormData({
        product_name: data.product_name || '',
        unit_price_usd: data.unit_price_usd?.toString() || '',
        quantity: data.quantity?.toString() || '',
        unit_weight: data.unit_weight?.toString() || '',
        unit_cbm: data.unit_cbm?.toString() || '',
        image_url: data.image_url || '',
        ads_amount: data.ads_amount?.toString() || '',
        notes: data.notes || ''
      });
      setImageFile(null);
      setPreviewUrl('');

      if (data?.supplier_order_id) {
        const { data: itemsData } = await supabase
          .from('supplier_order_items')
          .select('id')
          .eq('supplier_order_id', data.supplier_order_id);
        setOrderItems(itemsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Erreur</h1>
          <p className="text-sm text-red-600 dark:text-red-200 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Revenir en arrière
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const order = item.supplier_orders;
  const usdToCfa = parseFloat(order?.usd_xof_value || 0);
  const unitPriceUsd = parseFloat(item.unit_price_usd || 0);
  const quantity = parseInt(item.quantity || 0, 10);
  const unitWeight = parseFloat(item.unit_weight || 0);
  const unitCbm = parseFloat(item.unit_cbm || 0);
  const adsAmount = parseFloat(item.ads_amount || 0);

  const unitPriceCfa = usdToCfa ? unitPriceUsd * usdToCfa : null;
  const totalUsd = unitPriceUsd * quantity;
  const totalCfa = unitPriceCfa !== null ? unitPriceCfa * quantity : null;
  const totalWeight = unitWeight * quantity;
  const totalCbm = unitCbm * quantity;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const refreshData = async () => {
    const { data, error } = await supabase
      .from('supplier_order_items')
      .select(`
        *,
        supplier_orders (
          id,
          title,
          order_number,
          order_date,
          usd_xof_value,
          bank_fees_usd,
          shipping_fees_usd
        )
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setItem(data);
      setFormData({
        product_name: data.product_name || '',
        unit_price_usd: data.unit_price_usd?.toString() || '',
        quantity: data.quantity?.toString() || '',
        unit_weight: data.unit_weight?.toString() || '',
        unit_cbm: data.unit_cbm?.toString() || '',
        image_url: data.image_url || '',
        ads_amount: data.ads_amount?.toString() || '',
        notes: data.notes || ''
      });
      setImageFile(null);
      setPreviewUrl('');
    }
  };

  const uploadSupplierItemImage = async (file, supplierOrderId) => {
    const bucket = 'supplier-order-items';
    const extension = file.name?.split('.').pop() || 'jpg';
    const filePath = `${supplierOrderId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const handleImageFileChange = (file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setPreviewUrl('');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const parsedQuantity = parseInt(formData.quantity, 10);
    if (!formData.product_name || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFeedback({ type: 'error', message: 'Le nom du produit et la quantité sont obligatoires.' });
      return;
    }

    setSaving(true);

    const payload = {
      product_name: formData.product_name.trim(),
      quantity: parsedQuantity,
      unit_price_usd: formData.unit_price_usd ? parseFloat(formData.unit_price_usd) : null,
      unit_weight: formData.unit_weight ? parseFloat(formData.unit_weight) : null,
      unit_cbm: formData.unit_cbm ? parseFloat(formData.unit_cbm) : null,
      ads_amount: formData.ads_amount ? parseFloat(formData.ads_amount) : null,
      notes: formData.notes?.trim() || null
    };

    let imageUrl = formData.image_url?.trim() || null;
    if (imageFile instanceof File) {
      try {
        imageUrl = await uploadSupplierItemImage(imageFile, item.supplier_order_id);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        setFeedback({ type: 'error', message: 'Échec du téléchargement de l’image.' });
        setSaving(false);
        return;
      }
    }
    payload.image_url = imageUrl;

    const { error } = await supabase
      .from('supplier_order_items')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating supplier order item:', error);
      setFeedback({ type: 'error', message: 'Erreur lors de la mise à jour du produit.' });
    } else {
      setFeedback({ type: 'success', message: 'Produit mis à jour avec succès.' });
      setIsEditing(false);
      handleImageFileChange(null);
      await refreshData();
    }

    setSaving(false);
  };

  const formattedDate = order?.order_date
    ? new Date(order.order_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Détails du produit fournisseur
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Toutes les informations enregistrées pour ce produit dans la commande fournisseur.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Retour
          </button>
          {order?.id && (
            <Link
              to={`/admin/supplier-orders/${order.id}`}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Voir la commande
            </Link>
          )}
          <button
            onClick={() => {
              setFeedback({ type: '', message: '' });
              if (isEditing) {
                handleImageFileChange(null);
                setFormData({
                  product_name: item.product_name || '',
                  unit_price_usd: item.unit_price_usd?.toString() || '',
                  quantity: item.quantity?.toString() || '',
                  unit_weight: item.unit_weight?.toString() || '',
                  unit_cbm: item.unit_cbm?.toString() || '',
                  image_url: item.image_url || '',
                  ads_amount: item.ads_amount?.toString() || '',
                  notes: item.notes || ''
                });
              }
              setIsEditing(prev => !prev);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        </div>
      </div>

      {feedback.message ? (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {isEditing ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <form onSubmit={handleUpdate} className="p-4 sm:p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modifier le produit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Prix unitaire (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  name="unit_price_usd"
                  value={formData.unit_price_usd}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Poids unitaire (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  name="unit_weight"
                  value={formData.unit_weight}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Volume unitaire (CBM)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  name="unit_cbm"
                  value={formData.unit_cbm}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Ads Amount (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  name="ads_amount"
                  value={formData.ads_amount}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Image (Upload)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageFileChange(event.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {previewUrl ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400 font-medium">Nouvelle image sélectionnée</span>
                      <button
                        type="button"
                        onClick={() => handleImageFileChange(null)}
                        className="text-red-500 hover:underline"
                      >
                        Retirer
                      </button>
                    </span>
                  ) : formData.image_url ? (
                    <span>
                      Image actuelle :{' '}
                      <a
                        href={formData.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        ouvrir
                      </a>
                    </span>
                  ) : (
                    'Aucune image'
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Image (URL)
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFeedback({ type: '', message: '' });
                  handleImageFileChange(null);
                  setFormData({
                    product_name: item.product_name || '',
                    unit_price_usd: item.unit_price_usd?.toString() || '',
                    quantity: item.quantity?.toString() || '',
                    unit_weight: item.unit_weight?.toString() || '',
                    unit_cbm: item.unit_cbm?.toString() || '',
                    image_url: item.image_url || '',
                    ads_amount: item.ads_amount?.toString() || '',
                    notes: item.notes || ''
                  });
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {previewUrl ? (
                  <div className="lg:w-48">
                    <img
                      src={previewUrl}
                      alt="Prévisualisation"
                      className="rounded-lg shadow-sm object-cover w-full h-48 border border-blue-200 dark:border-blue-500/40"
                    />
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      Nouvelle image sélectionnée
                    </p>
                  </div>
                ) : item.image_url ? (
                  <div className="lg:w-48">
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="rounded-lg shadow-sm object-cover w-full h-48"
                    />
                  </div>
                ) : null}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {item.product_name}
                  </h2>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Quantité</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Prix unitaire (USD)</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        ${numberFormat(unitPriceUsd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Prix unitaire (CFA)</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {unitPriceCfa !== null ? `${numberFormat(unitPriceCfa, { maximumFractionDigits: 0 })} F` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Montant Ads</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        ${numberFormat(adsAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Total USD</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        ${numberFormat(totalUsd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Total CFA</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {totalCfa !== null ? `${numberFormat(totalCfa, { maximumFractionDigits: 0 })} F` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Caractéristiques logistiques</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Poids unitaire</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {unitWeight ? `${numberFormat(unitWeight)} kg` : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Poids total</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {totalWeight ? `${numberFormat(totalWeight)} kg` : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Volume unitaire (CBM)</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {unitCbm ? `${numberFormat(unitCbm)} CBM` : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Volume total (CBM)</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {totalCbm ? `${numberFormat(totalCbm)} CBM` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {item.notes ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{item.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations commande</h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Commande</span>
                <span className="font-medium">
                  {order?.order_number || order?.title || `#${order?.id?.slice(0, 8)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Taux USD → CFA</span>
                <span className="font-medium">
                  {usdToCfa ? `${numberFormat(usdToCfa, { maximumFractionDigits: 0 })} F` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Frais bancaires (USD)</span>
                <span className="font-medium">
                  ${numberFormat(order?.bank_fees_usd || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Frais livraison (USD)</span>
                <span className="font-medium">
                  ${numberFormat(order?.shipping_fees_usd || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Nombre total de produits</span>
                <span className="font-medium">{orderItems.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations brutes</h3>
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p>
                <span className="font-semibold">ID produit fournisseur :</span> {item.id}
              </p>
              <p>
                <span className="font-semibold">ID commande fournisseur :</span> {item.supplier_order_id}
              </p>
              <p>
                <span className="font-semibold">Créé le :</span>{' '}
                {item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : '—'}
              </p>
              <p>
                <span className="font-semibold">Mis à jour le :</span>{' '}
                {item.updated_at ? new Date(item.updated_at).toLocaleString('fr-FR') : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

