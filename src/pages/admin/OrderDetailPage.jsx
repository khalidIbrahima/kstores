import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import OrderLocationMap from '../../components/OrderLocationMap';
import { useParams, useNavigate } from 'react-router-dom';
import { notifyCustomerOrderStatusChange, ORDER_STATUS_CONFIG } from '../../services/notificationService';
import toast from 'react-hot-toast';
import OrderNotificationHistory from '../../components/OrderNotificationHistory';
import logoHorizontal from '../../assets/logo_nav.jpg';
import { generateInvoiceHtml, generateInvoiceText } from '../../utils/invoiceTemplates';
import { sendEmail } from '../../services/emailService';
import { ArrowLeft, Edit, Trash2, Bell, Mail, MessageSquare, X, Download, Send, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { useStoreSettings } from '../../hooks/useStoreSettings';

const OrderDetailPage = () => {
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [removingItems, setRemovingItems] = useState([]);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [productOptionsLoading, setProductOptionsLoading] = useState(false);
  const [productOptionsLoaded, setProductOptionsLoaded] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    productId: '',
    quantity: 1,
    price: '',
    discount: '',
    variantCombinationId: '',
    selectedColor: null
  });
  const [newItemVariants, setNewItemVariants] = useState({});
  const [selectedProductInfo, setSelectedProductInfo] = useState(null);
  const [selectedProductVariants, setSelectedProductVariants] = useState([]);
  const [selectedProductCombinations, setSelectedProductCombinations] = useState([]);
  const [variantDataLoading, setVariantDataLoading] = useState(false);
  const [matchedCombination, setMatchedCombination] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  });

  const fetchOrder = useCallback(
    async ({ skipLoading = false } = {}) => {
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`*,
          order_items(*, products(name, image_url))
        `)
          .eq('id', orderId)
          .single();
        if (error) throw error;
        setOrder(data);
        return data;
      } catch (err) {
        setError(t('admin.orders.fetchError'));
        return null;
      } finally {
        if (!skipLoading) {
          setLoading(false);
        }
      }
    },
    [orderId, t]
  );

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (order && !isEditModalOpen) {
      setEditForm({
        name: order.shipping_address?.name || '',
        email: order.shipping_address?.email || '',
        phone: order.shipping_address?.phone || '',
        address: order.shipping_address?.address || '',
        city: order.shipping_address?.city || '',
        state: order.shipping_address?.state || '',
        zip_code: order.shipping_address?.zip_code || '',
        notes: order.notes || ''
      });
    }
  }, [order, isEditModalOpen]);

  const calculateOrderTotals = (items = []) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
    const total = subtotal - totalDiscount;
    return {
      subtotal,
      totalDiscount,
      total
    };
  };

  const normalizeCombinationValues = (variantValues) => {
    if (!variantValues) return {};

    let parsed = variantValues;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        console.error('Error parsing combination variant values:', error);
        return {};
      }
    }

    if (Array.isArray(parsed)) {
      return parsed.reduce((acc, entry) => {
        if (Array.isArray(entry) && entry.length >= 2) {
          acc[String(entry[0])] = entry[1];
        } else if (entry && typeof entry === 'object' && entry.key) {
          acc[String(entry.key)] = entry.value ?? entry.name ?? '';
        }
        return acc;
      }, {});
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce((acc, [key, value]) => {
        if (!key) return acc;
        if (value && typeof value === 'object') {
          acc[String(key)] = value.name ?? value.label ?? value.value ?? '';
        } else {
          acc[String(key)] = value;
        }
        return acc;
      }, {});
    }

    return {};
  };

  const getOrderTotalValue = (orderData) =>
    Number(
      orderData?.total ??
      orderData?.total_amount ??
      orderData?.TotalAmount ??
      orderData?.totalAmount ??
      0
    );

  const getOrderDiscountValue = (orderData) =>
    Number(
      orderData?.total_discount ??
      orderData?.TotalDiscount ??
      orderData?.totalDiscount ??
      orderData?.totaldiscount ??
      0
    );

  const getOrderTotalField = (orderData) => {
    if (!orderData) return 'total';
    if (Object.prototype.hasOwnProperty.call(orderData, 'total')) return 'total';
    if (Object.prototype.hasOwnProperty.call(orderData, 'total_amount')) return 'total_amount';
    if (Object.prototype.hasOwnProperty.call(orderData, 'TotalAmount')) return 'TotalAmount';
    if (Object.prototype.hasOwnProperty.call(orderData, 'totalAmount')) return 'totalAmount';
    return 'total';
  };

  const getOrderDiscountField = (orderData) => {
    if (!orderData) return null;
    if (Object.prototype.hasOwnProperty.call(orderData, 'total_discount')) return 'total_discount';
    if (Object.prototype.hasOwnProperty.call(orderData, 'TotalDiscount')) return 'TotalDiscount';
    if (Object.prototype.hasOwnProperty.call(orderData, 'totalDiscount')) return 'totalDiscount';
    if (Object.prototype.hasOwnProperty.call(orderData, 'totaldiscount')) return 'totaldiscount';
    return null;
  };

  const orderItems = order?.order_items || [];
  const modalOrderTotals = useMemo(() => calculateOrderTotals(orderItems), [orderItems]);
  const orderTotalValue = useMemo(() => getOrderTotalValue(order), [order]);
  const orderDiscountValue = useMemo(() => getOrderDiscountValue(order), [order]);
  const customerEmail = order?.shipping_address?.email || '';

  const parseVariantEntries = useCallback((variantValues) => {
    if (!variantValues) return [];

    let parsedValues = variantValues;
    if (typeof parsedValues === 'string') {
      try {
        parsedValues = JSON.parse(parsedValues);
      } catch (variantError) {
        console.error('Error parsing variant values:', variantError);
        return [];
      }
    }

    const result = [];

    if (Array.isArray(parsedValues)) {
      parsedValues.forEach((entry) => {
        if (Array.isArray(entry) && entry.length >= 2 && entry[0]) {
          result.push({
            key: entry[0],
            value: entry[1],
            raw: entry[1]
          });
        } else if (entry && typeof entry === 'object' && entry.key) {
          result.push({
            key: entry.key,
            value: entry.value ?? entry.name ?? '',
            raw: entry
          });
        }
      });
      return result;
    }

    if (parsedValues && typeof parsedValues === 'object') {
      Object.entries(parsedValues).forEach(([key, value]) => {
        if (!key) return;
        if (value && typeof value === 'object') {
          result.push({
            key,
            value: value.name ?? value.label ?? value.value ?? value.option ?? '',
            raw: value
          });
        } else {
          result.push({
            key,
            value,
            raw: value
          });
        }
      });
      return result;
    }

    return [];
  }, []);

  const getVariantDetails = useCallback(
    (orderItem) => {
      const baseEntries = parseVariantEntries(orderItem?.variant_values);
      if (baseEntries.length === 0) return [];

      let selectedOptions = orderItem?.selected_variant_options;
      if (selectedOptions && typeof selectedOptions === 'string') {
        try {
          selectedOptions = JSON.parse(selectedOptions);
        } catch (error) {
          console.error('Error parsing selected_variant_options:', error);
          selectedOptions = null;
        }
      }

      return baseEntries.map(({ key, value, raw }) => {
        const optionInfo =
          selectedOptions && typeof selectedOptions === 'object'
            ? selectedOptions[key] ?? selectedOptions?.variantValues?.[key]
            : null;

        let optionName = value;
        let imageUrl = null;

        if (optionInfo && typeof optionInfo === 'object') {
          optionName = optionInfo.name ?? optionInfo.label ?? optionInfo.value ?? optionName;
          imageUrl = optionInfo.image_url ?? optionInfo.imageUrl ?? optionInfo.image ?? null;
        } else if (typeof optionInfo === 'string') {
          optionName = optionInfo;
        }

        if (!imageUrl && raw && typeof raw === 'object') {
          imageUrl = raw.image_url ?? raw.imageUrl ?? raw.image ?? null;
          optionName = raw.name ?? raw.label ?? raw.value ?? optionName;
        }

        return {
          key,
          value: optionName,
          imageUrl
        };
      });
    },
    [parseVariantEntries]
  );

  const restoreProductInventory = async (orderItem) => {
    try {
      if (orderItem.product_id) {
        const { data: product, error: productFetchError } = await supabase
          .from('products')
          .select('inventory')
          .eq('id', orderItem.product_id)
          .single();

        if (!productFetchError) {
          const { error: productUpdateError } = await supabase
            .from('products')
            .update({
              inventory: (product?.inventory || 0) + Number(orderItem.quantity || 0)
            })
            .eq('id', orderItem.product_id);

          if (productUpdateError) {
            console.error('Error restoring product inventory:', productUpdateError);
          }
        }
      }

      if (orderItem.variant_combination_id) {
        const { data: combination, error: combinationFetchError } = await supabase
          .from('product_variant_combinations')
          .select('inventory')
          .eq('id', orderItem.variant_combination_id)
          .single();

        if (!combinationFetchError) {
          const { error: combinationUpdateError } = await supabase
            .from('product_variant_combinations')
            .update({
              inventory: (combination?.inventory || 0) + Number(orderItem.quantity || 0)
            })
            .eq('id', orderItem.variant_combination_id);

          if (combinationUpdateError) {
            console.error('Error restoring combination inventory:', combinationUpdateError);
          }
        }
      }
    } catch (inventoryError) {
      console.error('Inventory restoration error:', inventoryError);
    }
  };

  const reserveProductInventory = async ({ productId, variantCombinationId, quantity }) => {
    const qty = Number(quantity) || 0;
    if (!qty || qty <= 0) return;

    try {
      if (productId) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('inventory')
          .eq('id', productId)
          .single();

        if (!fetchError && typeof product?.inventory === 'number') {
          const newInventory = Math.max(0, product.inventory - qty);
          const { error: updateError } = await supabase
            .from('products')
            .update({ inventory: newInventory })
            .eq('id', productId);

          if (updateError) {
            console.error('Error decreasing product inventory:', updateError);
          }
        }
      }

      if (variantCombinationId) {
        const { data: combination, error: combinationFetchError } = await supabase
          .from('product_variant_combinations')
          .select('inventory')
          .eq('id', variantCombinationId)
          .single();

        if (!combinationFetchError && typeof combination?.inventory === 'number') {
          const newInventory = Math.max(0, combination.inventory - qty);
          const { error: combinationUpdateError } = await supabase
            .from('product_variant_combinations')
            .update({ inventory: newInventory })
            .eq('id', variantCombinationId);

          if (combinationUpdateError) {
            console.error('Error decreasing combination inventory:', combinationUpdateError);
          }
        }
      }
    } catch (inventoryError) {
      console.error('Inventory reservation error:', inventoryError);
    }
  };

  const fetchProductOptions = useCallback(async () => {
    if (productOptionsLoading) return;
    setProductOptionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, inventory, image_url, colors, isActive')
        .order('name', { ascending: true });
      if (error) throw error;

      const filtered = (data || []).filter((product) => product.isActive !== false);
      setProductOptions(filtered);
      setProductOptionsLoaded(true);
    } catch (fetchError) {
      console.error('Error fetching products for order edit:', fetchError);
      toast.error('Erreur lors du chargement des produits disponibles');
    } finally {
      setProductOptionsLoading(false);
    }
  }, [productOptionsLoading]);

  const fetchVariantDataForProduct = useCallback(
    async (productId) => {
      if (!productId) {
        setSelectedProductVariants([]);
        setSelectedProductCombinations([]);
        return;
      }
      setVariantDataLoading(true);
      try {
        const [{ data: variantsData, error: variantsError }, { data: combinationsData, error: combinationsError }] =
          await Promise.all([
            supabase
              .from('product_variants')
              .select(
                'id, name, display_order, product_variant_options(id, name, image_url, display_order, stock)'
              )
              .eq('product_id', productId)
              .order('display_order', { ascending: true })
              .order('display_order', { foreignTable: 'product_variant_options', ascending: true }),
            supabase
              .from('product_variant_combinations')
              .select('id, price, inventory, variant_values, is_active')
              .eq('product_id', productId)
              .order('created_at', { ascending: true })
          ]);

        if (variantsError) throw variantsError;
        if (combinationsError) throw combinationsError;

        const normalizedVariants = (variantsData || [])
          .map((variant) => ({
            id: variant.id,
            name: variant.name,
            options: (variant.product_variant_options || [])
              .map((option) => ({
                id: option.id,
                name: option.name,
                image_url: option.image_url || '',
                stock: option.stock ?? null
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const normalizedCombinations = (combinationsData || [])
          .filter((combination) => combination.is_active !== false)
          .map((combination) => ({
            ...combination,
            parsedValues: normalizeCombinationValues(combination.variant_values || null)
          }));

        setSelectedProductVariants(normalizedVariants);
        setSelectedProductCombinations(normalizedCombinations);
      } catch (variantError) {
        console.error('Error fetching product variants for order edit:', variantError);
        toast.error('Erreur lors du chargement des variantes du produit');
        setSelectedProductVariants([]);
        setSelectedProductCombinations([]);
      } finally {
        setVariantDataLoading(false);
      }
    },
    [supabase]
  );

  const resetNewItemForm = useCallback(() => {
    setNewItemForm({
      productId: '',
      quantity: 1,
      price: '',
      discount: '',
      variantCombinationId: '',
      selectedColor: null
    });
    setNewItemVariants({});
    setSelectedProductInfo(null);
    setSelectedProductVariants([]);
    setSelectedProductCombinations([]);
    setMatchedCombination(null);
  }, []);

  const handleToggleAddItem = () => {
    setIsAddItemOpen((prev) => {
      const next = !prev;
      if (!next) {
        resetNewItemForm();
      }
      return next;
    });
  };

  const handleSelectNewItemProduct = async (productId) => {
    if (!productId) {
      resetNewItemForm();
      return;
    }

    const product = productOptions.find((item) => item.id === productId) || null;
    setSelectedProductInfo(product);
    setNewItemForm((prev) => ({
      ...prev,
      productId,
      quantity: 1,
      price: product?.price != null ? String(product.price) : '',
      discount: '',
      variantCombinationId: '',
      selectedColor: null
    }));
    setNewItemVariants({});
    setMatchedCombination(null);
    await fetchVariantDataForProduct(productId);

    if (product?.colors && product.colors.length === 1) {
      setNewItemForm((prev) => ({
        ...prev,
        selectedColor: product.colors[0]
      }));
    }
  };

  const handleNewItemQuantityChange = (value) => {
    const parsed = Number(value);
    const normalized = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
    setNewItemForm((prev) => ({
      ...prev,
      quantity: normalized
    }));
  };

  const handleNewItemPriceChange = (value) => {
    setNewItemForm((prev) => ({
      ...prev,
      price: value
    }));
  };

  const handleNewItemDiscountChange = (value) => {
    setNewItemForm((prev) => ({
      ...prev,
      discount: value
    }));
  };

  const handleVariantSelectionChange = (variantName, optionId) => {
    if (!variantName) return;
    if (!optionId) {
      setNewItemVariants((prev) => {
        const updated = { ...prev };
        delete updated[variantName];
        return updated;
      });
      return;
    }

    const variant = selectedProductVariants.find((v) => v.name === variantName);
    const option = variant?.options?.find((opt) => opt.id === optionId);
    if (!variant || !option) return;

    setNewItemVariants((prev) => ({
      ...prev,
      [variantName]: {
        id: option.id,
        name: option.name,
        image_url: option.image_url || '',
        stock: option.stock ?? null
      }
    }));
  };

  const handleSelectLegacyColor = (color) => {
    setNewItemForm((prev) => ({
      ...prev,
      selectedColor: color
    }));
  };

  const buildVariantPayload = () => {
    if (!selectedProductVariants.length) return { variantData: null, variantValues: null };
    const variantNames = selectedProductVariants.map((variant) => variant.name);
    const allSelected = variantNames.every((name) => newItemVariants[name]?.id);
    if (!allSelected) return { variantData: null, variantValues: null };

    const variantValues = {};
    const variantData = {};

    variantNames.forEach((variantName) => {
      const option = newItemVariants[variantName];
      variantValues[variantName] = option.name;
      variantData[variantName] = {
        id: option.id,
        name: option.name,
        image_url: option.image_url || null
      };
    });

    return {
      variantValues,
      variantData: {
        ...variantData,
        variantValues
      }
    };
  };

  const handleAddOrderItem = async () => {
    if (!order) return;

    if (!newItemForm.productId) {
      toast.error('Sélectionnez un produit à ajouter');
      return;
    }

    const quantity = Number(newItemForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Quantité invalide');
      return;
    }

    const unitPrice = Number(newItemForm.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      toast.error('Prix invalide');
      return;
    }

    const discountValueRaw = Number(newItemForm.discount);
    const hasDiscountInput = newItemForm.discount !== '';
    const discountValue =
      hasDiscountInput && Number.isFinite(discountValueRaw) && discountValueRaw >= 0 ? discountValueRaw : 0;

    if (hasDiscountInput && (!Number.isFinite(discountValueRaw) || discountValueRaw < 0)) {
      toast.error('Remise invalide');
      return;
    }

    const lineTotal = unitPrice * quantity;
    if (discountValue > lineTotal) {
      toast.error('La remise ne peut pas dépasser le montant total de la ligne');
      return;
    }

    if (selectedProductVariants.length > 0) {
      const variantNames = selectedProductVariants.map((variant) => variant.name);
      const missingVariants = variantNames.filter((name) => !newItemVariants[name]);
      if (missingVariants.length > 0) {
        toast.error(`Sélectionnez: ${missingVariants.join(', ')}`);
        return;
      }
      if (selectedProductCombinations.length > 0 && !matchedCombination) {
        toast.error('Aucune combinaison ne correspond aux options sélectionnées');
        return;
      }
    }

    if (
      selectedProductInfo?.colors &&
      selectedProductInfo.colors.length > 0 &&
      !selectedProductVariants.length &&
      !newItemForm.selectedColor
    ) {
      toast.error('Sélectionnez une couleur pour ce produit');
      return;
    }

    if (matchedCombination?.inventory != null && quantity > matchedCombination.inventory) {
      toast.error('Stock insuffisant pour cette combinaison');
      return;
    }

    if (selectedProductInfo?.inventory != null && quantity > selectedProductInfo.inventory) {
      toast.error('Stock produit insuffisant');
      return;
    }

    const { variantData, variantValues } = buildVariantPayload();

    const payload = {
      order_id: order.id,
      product_id: newItemForm.productId,
      quantity,
      price: unitPrice,
      discount: discountValue,
      selected_color: newItemForm.selectedColor ? JSON.stringify(newItemForm.selectedColor) : null,
      variant_combination_id: newItemForm.variantCombinationId || null,
      selected_variant_options: variantData ? JSON.stringify(variantData) : null,
      variant_values: variantValues || null
    };

    setAddingNewItem(true);
    const toastId = toast.loading('Ajout du produit...');

    try {
      const { data: insertedItems, error: insertError } = await supabase
        .from('order_items')
        .insert(payload)
        .select('*, products(name, image_url)');

      if (insertError) throw insertError;

      await reserveProductInventory({
        productId: newItemForm.productId,
        variantCombinationId: newItemForm.variantCombinationId || null,
        quantity
      });

      const insertedItem = insertedItems?.[0] ?? null;
      const updatedItems = insertedItem ? [...orderItems, insertedItem] : [...orderItems];
      const { total, totalDiscount } = calculateOrderTotals(updatedItems);
      const totalFieldKey = getOrderTotalField(order);
      const discountFieldKey = getOrderDiscountField(order);

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              order_items: updatedItems,
              [totalFieldKey]: total,
              ...(discountFieldKey
                ? {
                    [discountFieldKey]: totalDiscount > 0 ? totalDiscount : 0
                  }
                : {})
            }
          : prev
      );

      setProductOptions((prev) =>
        prev.map((product) =>
          product.id === newItemForm.productId && typeof product.inventory === 'number'
            ? {
                ...product,
                inventory: Math.max(0, product.inventory - quantity)
              }
            : product
        )
      );

      setSelectedProductInfo((prev) =>
        prev && prev.id === newItemForm.productId && typeof prev.inventory === 'number'
          ? { ...prev, inventory: Math.max(0, prev.inventory - quantity) }
          : prev
      );

      setSelectedProductCombinations((prev) =>
        prev.map((combination) =>
          combination.id === newItemForm.variantCombinationId && typeof combination.inventory === 'number'
            ? {
                ...combination,
                inventory: Math.max(0, combination.inventory - quantity)
              }
            : combination
        )
      );

      setMatchedCombination((prev) =>
        prev && prev.id === newItemForm.variantCombinationId && typeof prev.inventory === 'number'
          ? { ...prev, inventory: Math.max(0, prev.inventory - quantity) }
          : prev
      );

      toast.success('Produit ajouté à la commande', { id: toastId });
      await fetchOrder({ skipLoading: true });
      resetNewItemForm();
      setIsAddItemOpen(false);
    } catch (addError) {
      console.error('Error adding order item:', addError);
      toast.error('Impossible d\'ajouter le produit', { id: toastId });
    } finally {
      setAddingNewItem(false);
    }
  };

  useEffect(() => {
    if (isEditModalOpen && !productOptionsLoaded && !productOptionsLoading) {
      fetchProductOptions();
    }
  }, [isEditModalOpen, productOptionsLoaded, productOptionsLoading, fetchProductOptions]);

  useEffect(() => {
    if (!selectedProductVariants.length) {
      setMatchedCombination(null);
      setNewItemForm((prev) => ({
        ...prev,
        variantCombinationId: ''
      }));
      return;
    }

    const variantNames = selectedProductVariants.map((variant) => variant.name);
    const allSelected = variantNames.every((name) => newItemVariants[name]?.id);

    if (!allSelected) {
      setMatchedCombination(null);
      setNewItemForm((prev) => ({
        ...prev,
        variantCombinationId: ''
      }));
      return;
    }

    const selectionMap = variantNames.reduce((acc, name) => {
      acc[name] = newItemVariants[name]?.name;
      return acc;
    }, {});

    const matchingCombination = selectedProductCombinations.find((combination) => {
      const parsed = combination.parsedValues || {};
      return variantNames.every((name) => {
        const combinationValue = parsed[name];
        const selectedValue = selectionMap[name];
        if (combinationValue == null || selectedValue == null) return false;
        return String(combinationValue).toLowerCase() === String(selectedValue).toLowerCase();
      });
    });

    if (matchingCombination) {
      setMatchedCombination(matchingCombination);
      setNewItemForm((prev) => ({
        ...prev,
        variantCombinationId: matchingCombination.id,
        price:
          matchingCombination.price != null && matchingCombination.price !== ''
            ? String(Number(matchingCombination.price))
            : prev.price
      }));
    } else {
      setMatchedCombination(null);
      setNewItemForm((prev) => ({
        ...prev,
        variantCombinationId: ''
      }));
    }
  }, [newItemVariants, selectedProductVariants, selectedProductCombinations]);

  const handleRemoveItem = async (orderItem) => {
    if (!window.confirm('Supprimer ce produit de la commande ?')) {
      return;
    }

    if (!order) {
      toast.error('Commande introuvable');
      return;
    }

    setRemovingItems((prev) => [...prev, orderItem.id]);

    try {
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('id', orderItem.id);

      if (deleteError) {
        throw deleteError;
      }

      await restoreProductInventory(orderItem);

      const updatedItems = orderItems.filter((item) => item.id !== orderItem.id);
      const { total, totalDiscount } = calculateOrderTotals(updatedItems);

      const totalFieldKey = getOrderTotalField(order);
      const discountFieldKey = getOrderDiscountField(order);

      const updatePayload = {
        [totalFieldKey]: total
      };

      if (discountFieldKey) {
        updatePayload[discountFieldKey] = totalDiscount > 0 ? totalDiscount : 0;
      }

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (orderUpdateError) {
        throw orderUpdateError;
      }

      setOrder((prev) =>
        prev
          ? {
            ...prev,
            order_items: updatedItems,
            [totalFieldKey]: total,
            ...(discountFieldKey
              ? {
                [discountFieldKey]: totalDiscount > 0 ? totalDiscount : 0
              }
              : {})
          }
          : prev
      );

      await fetchOrder({ skipLoading: true });

      toast.success('Produit supprimé de la commande');
    } catch (removeError) {
      console.error('Error removing order item:', removeError);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setRemovingItems((prev) => prev.filter((id) => id !== orderItem.id));
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const previousStatus = order?.status;

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrder((prev) => ({ ...prev, status: newStatus }));

      // Notifier le client du changement de statut
      if (order && previousStatus !== newStatus) {
        try {
          const notificationResults = await notifyCustomerOrderStatusChange(order, newStatus, previousStatus);

          // Afficher un message de succès avec les détails des notifications
          const successMessages = [];
          if (notificationResults.email) successMessages.push('Email envoyé');
          if (notificationResults.whatsapp) successMessages.push('WhatsApp envoyé');
          if (notificationResults.internal) successMessages.push('Notification interne créée');

          if (successMessages.length > 0) {
            toast.success(`Statut mis à jour et ${successMessages.join(', ')}`);
          } else {
            toast.success('Statut mis à jour');
          }

          // Afficher les erreurs s'il y en a
          if (notificationResults.errors.length > 0) {
            notificationResults.errors.forEach(error => {
              toast.error(`Erreur ${error.type}: ${error.error}`);
            });
          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          toast.error('Statut mis à jour mais erreur lors de l\'envoi des notifications');
        }
      }
    } catch (err) {
      setError(t('admin.orders.updateError'));
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order || downloadingInvoice) return;
    if (typeof window === 'undefined') return;

    setDownloadingInvoice(true);
    const toastId = toast.loading('Génération de la facture...');

    try {
      const logoUrl =
        typeof window !== 'undefined'
          ? new URL(logoHorizontal, window.location.origin).href
          : logoHorizontal;
      const invoiceHtml = generateInvoiceHtml(order, { logoUrl, includePrintButton: false });

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const filename = `facture-${order?.reference || order?.id || 'commande'}.pdf`;

      await html2pdf()
        .set({
          margin: [10, 10],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(invoiceHtml)
        .save();

      toast.success('Facture téléchargée', { id: toastId });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Impossible de télécharger la facture', { id: toastId });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!order) return;
    const customerEmail = order?.shipping_address?.email;
    if (!customerEmail) {
      toast.error('Aucune adresse e-mail client disponible');
      return;
    }

    try {
      setSendingInvoice(true);
      const logoUrl =
        typeof window !== 'undefined'
          ? new URL(logoHorizontal, window.location.origin).href
          : logoHorizontal;
      const html = generateInvoiceHtml(order, { logoUrl, includePrintButton: false });
      const text = generateInvoiceText(order);
      await sendEmail({
        to: customerEmail,
        subject: `Votre facture - Commande #${order.id}`,
        html,
        text,
      });
      toast.success('Facture envoyée au client');
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast.error('Impossible d\'envoyer la facture');
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Commande supprimée avec succès');
      navigate('/admin/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erreur lors de la suppression de la commande');
    }
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editForm.name.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }

    setIsSavingEdit(true);

    try {
      const updatedShippingAddress = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        city: editForm.city.trim() || null,
        state: editForm.state.trim() || null,
        zip_code: editForm.zip_code.trim() || null
      };

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          shipping_address: updatedShippingAddress,
          notes: editForm.notes.trim() || null
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrder((prev) =>
        prev
          ? {
            ...prev,
            shipping_address: updatedShippingAddress,
            notes: editForm.notes.trim() || null
          }
          : prev
      );

      toast.success('Commande mise à jour avec succès');
      setIsEditModalOpen(false);
    } catch (updateErr) {
      console.error('Error updating order details:', updateErr);
      toast.error('Erreur lors de la mise à jour de la commande');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US');
  };

  const formatPrice = (amount) => `${Number(amount).toLocaleString()} FCFA`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm sm:text-base text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 text-sm sm:text-base w-full sm:w-auto"
            >
              Retour aux commandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm sm:text-base text-yellow-700 dark:text-yellow-400">Commande non trouvée</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 text-sm sm:text-base w-full sm:w-auto"
            >
              Retour aux commandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-16 space-y-4 sm:space-y-0">
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_auto_auto] gap-y-3 gap-x-4 items-center w-full">
              <button
                onClick={() => navigate('/admin/orders')}
                className="inline-flex items-center justify-start rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-1.5 text-sm transition w-max"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Retour aux commandes</span>
                <span className="sm:hidden">Retour</span>
              </button>

              <div className="flex items-center justify-between sm:col-span-full lg:col-auto gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                      Commande #{(order.id || '').slice(0, 8)}
                    </h1>
                    {order.id && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText?.(order.id);
                          toast.success('Identifiant de commande copié');
                        }}
                        className="hidden sm:inline-flex items-center gap-1 rounded-full border border-gray-300/60 dark:border-gray-600/60 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-200 transition"
                      >
                        <span>ID complet</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:hidden flex-shrink-0">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/20 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25 transition"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex sm:justify-end lg:justify-start sm:col-span-full lg:col-auto items-center gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-500/20 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25 transition"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Statut de la commande */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Statut de la commande</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className={`flex items-center space-x-1 ${ORDER_STATUS_CONFIG[order.status]?.color || 'text-gray-600'}`}>
                      <span className="text-base sm:text-lg">{ORDER_STATUS_CONFIG[order.status]?.emoji || '📋'}</span>
                      <span className="text-xs sm:text-sm font-medium">{ORDER_STATUS_CONFIG[order.status]?.label || order.status}</span>
                    </div>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(e.target.value)}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none w-full sm:w-auto"
                    >
                      <option value="pending">{t('admin.orders.status.pending')}</option>
                      <option value="processing">{t('admin.orders.status.processing')}</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ORDER_STATUS_CONFIG[order.status]?.description || `Statut: ${order.status}`}
                </p>
              </motion.div>

              {/* Informations client */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations client</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
                      {order.shipping_address?.name || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-all">
                      {order.shipping_address?.email || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                    <p className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {order.shipping_address?.phone || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Type de client</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.user_id
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400'
                        }`}>
                        {order.user_id ? 'Compte connecté' : 'Client invité'}
                      </span>
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Notes internes</label>
                    <p
                      className={`mt-1 text-xs sm:text-sm ${order.notes ? 'text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words' : 'text-gray-500 dark:text-gray-400 italic'
                        }`}
                    >
                      {order.notes?.trim() || 'Aucune note'}
                    </p>
                  </div>
                </div>
              </motion.div>
              {isEditModalOpen && (
                <div
                  className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6"
                  role="presentation"
                >
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => {
                      if (isSavingEdit || removingItems.length > 0) return;
                      setIsEditModalOpen(false);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="order-edit-title"
                    onClick={(event) => event.stopPropagation()}
                    className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-[0_25px_60px_-20px_rgb(15,23,42,0.55)] border border-gray-100 dark:border-gray-700/60"
                  >
                    <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 bg-gray-50/70 dark:bg-gray-900/50 rounded-t-2xl">
                      <div className="space-y-1.5">
                        <h3 id="order-edit-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Modifier la commande
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Mettez à jour les informations du client et de la livraison.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/60 transition"
                        disabled={isSavingEdit || removingItems.length > 0}
                        aria-label="Fermer la fenêtre de modification"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-6 max-h-[75vh] overflow-y-auto px-4 sm:px-6 py-5 bg-white dark:bg-gray-900/95">
                      <div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Produits de la commande</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {orderItems.length} article(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleToggleAddItem}
                              disabled={productOptionsLoading || addingNewItem}
                              className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-500/20 dark:border-purple-400/30 dark:bg-purple-500/15 dark:text-purple-200 dark:hover:bg-purple-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isAddItemOpen ? (
                                <>
                                  <X className="h-4 w-4" />
                                  Annuler
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Ajouter un produit
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        {isAddItemOpen && (
                          <div className="mb-4 space-y-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-900/40 p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
                                  Produit
                                </label>
                                <select
                                  value={newItemForm.productId}
                                  onChange={(event) => handleSelectNewItemProduct(event.target.value)}
                                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                                  disabled={productOptionsLoading || addingNewItem}
                                >
                                  <option value="">Sélectionnez un produit</option>
                                  {productOptions.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name}
                                      {typeof product.inventory === 'number' ? ` (Stock: ${product.inventory})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
                                  Quantité
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={newItemForm.quantity}
                                  onChange={(event) => handleNewItemQuantityChange(event.target.value)}
                                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                  disabled={!newItemForm.productId || addingNewItem}
                                />
                              </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
            Prix unitaire (FCFA)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newItemForm.price === '' ? '' : newItemForm.price}
            onChange={(event) => handleNewItemPriceChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            disabled={!newItemForm.productId || addingNewItem}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
            Remise (total ligne, FCFA)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newItemForm.discount === '' ? '' : newItemForm.discount}
            onChange={(event) => handleNewItemDiscountChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            disabled={!newItemForm.productId || addingNewItem}
          />
        </div>
      </div>
                            </div>

                            {variantDataLoading && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></span>
                                Chargement des variantes...
                              </div>
                            )}

                            {!variantDataLoading && selectedProductVariants.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                  Variantes
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedProductVariants.map((variant) => (
                                    <div key={variant.id} className="space-y-1.5">
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {variant.name}
                                      </label>
                                      <select
                                        value={newItemVariants[variant.name]?.id || ''}
                                        onChange={(event) =>
                                          handleVariantSelectionChange(variant.name, event.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                      >
                                        <option value="">Sélectionner une option</option>
                                        {variant.options.map((option) => (
                                          <option key={option.id} value={option.id}>
                                            {option.name}
                                            {option.stock != null ? ` (Stock: ${option.stock})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedProductInfo?.colors &&
                              selectedProductInfo.colors.length > 0 &&
                              selectedProductVariants.length === 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                    Couleurs disponibles
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedProductInfo.colors
                                      .filter((color) => color.available !== false)
                                      .map((color, index) => {
                                        const isSelected =
                                          newItemForm.selectedColor?.name === color.name &&
                                          newItemForm.selectedColor?.hex === color.hex;
                                        return (
                                          <button
                                            key={`${color.name}-${index}`}
                                            type="button"
                                            onClick={() => handleSelectLegacyColor(color)}
                                            className={`h-9 w-9 rounded-full border-2 transition-all ${
                                              isSelected
                                                ? 'border-purple-500 ring-2 ring-purple-300'
                                                : 'border-gray-300 hover:border-purple-400'
                                            }`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                          />
                                        );
                                      })}
                                  </div>
                                </div>
                              )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                {matchedCombination && (
                                  <p>
                                    Combinaison sélectionnée :{' '}
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {Object.values(matchedCombination.parsedValues || {}).join(' • ')}
                                    </span>
                                  </p>
                                )}
                                {matchedCombination?.inventory != null ? (
                                  <p>Stock combinaison : {matchedCombination.inventory}</p>
                                ) : selectedProductInfo?.inventory != null ? (
                                  <p>Stock produit : {selectedProductInfo.inventory}</p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={resetNewItemForm}
                                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  disabled={addingNewItem}
                                >
                                  Réinitialiser
                                </button>
                                <button
                                  type="button"
                                  onClick={handleAddOrderItem}
                                  disabled={
                                    addingNewItem ||
                                    !newItemForm.productId ||
                                    productOptionsLoading ||
                                    (selectedProductVariants.length > 0 &&
                                      selectedProductVariants.some((variant) => !newItemVariants[variant.name]))
                                  }
                                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {addingNewItem ? (
                                    <>
                                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                      Ajout...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Ajouter à la commande
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {orderItems.length ? (
                          <div className="space-y-3">
                            {orderItems.map((item) => {
                              const isRemoving = removingItems.includes(item.id);
                              const variantDetails = getVariantDetails(item);
                              return (
                                <div
                                  key={item.id}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/60 p-4 shadow-sm"
                                >
                                  <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hidden sm:block">
                                      {item.products?.image_url ? (
                                        <img
                                          src={item.products.image_url}
                                          alt={item.products?.name || 'Produit'}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-400">
                                          {(item.products?.name || '?').slice(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {item.products?.name || 'Produit inconnu'}
                                      </p>
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 font-medium shadow-sm">
                                          Qté: {item.quantity}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 font-medium shadow-sm">
                                          Total: {formatPrice(item.price * item.quantity)}
                                        </span>
                                        {item.discount ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 px-2.5 py-1 font-medium text-red-600 dark:text-red-300 shadow-sm">
                                            Remise: -{formatPrice(item.discount)}
                                          </span>
                                        ) : null}
                                        {item.selected_color && (() => {
                                          try {
                                            const color = JSON.parse(item.selected_color);
                                            return (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 font-medium shadow-sm">
                                                <span
                                                  className="inline-block h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600"
                                                  style={{ backgroundColor: color.hex }}
                                                />
                                                {color.name}
                                              </span>
                                            );
                                          } catch (parseError) {
                                            console.error('Error parsing color on modal:', parseError);
                                            return null;
                                          }
                                        })()}
                                        {variantDetails.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {variantDetails.map(({ key, value, imageUrl }) => (
                                              <span
                                                key={`${item.id}-${key}`}
                                                className="group relative inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 px-2.5 py-1 font-medium shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible"
                                              >
                                                {imageUrl && (
                                                  <span className="relative flex items-center">
                                                    <img
                                                      src={imageUrl}
                                                      alt={`${value}`}
                                                      className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
                                                      onError={(e) => {
                                                        e.currentTarget.style.visibility = 'hidden';
                                                      }}
                                                    />
                                                    <span className="pointer-events-none absolute left-1/2 -top-3 z-40 hidden -translate-x-1/2 -translate-y-full group-hover:flex group-hover:pointer-events-auto">
                                                      <span className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-2 shadow-lg">
                                                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 overflow-hidden rounded-md">
                                                          <img
                                                            src={imageUrl}
                                                            alt={`${value} preview`}
                                                            className="absolute inset-0 h-full w-full object-cover"
                                                          />
                                                        </div>
                                                      </span>
                                                    </span>
                                                  </span>
                                                )}
                                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                                  <span className="font-semibold">{key}:</span> {value}
                                                </span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item)}
                                    disabled={isRemoving || isSavingEdit}
                                    className="inline-flex items-center justify-center rounded-full border border-red-200 dark:border-red-700 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-60 transition"
                                  >
                                    {isRemoving ? (
                                      <>
                                        <span className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-red-500 dark:border-red-400" />
                                        Suppression...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Aucun produit restant dans cette commande.
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-4 sm:p-5">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Résumé de la commande</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                            <span>Sous-total</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(modalOrderTotals.subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                            <span>Remise</span>
                            <span className={modalOrderTotals.totalDiscount > 0 ? 'font-medium text-red-600 dark:text-red-300' : 'font-medium'}>
                              {modalOrderTotals.totalDiscount > 0 ? `- ${formatPrice(modalOrderTotals.totalDiscount)}` : formatPrice(0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3">
                            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total à facturer</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatPrice(modalOrderTotals.total)}</span>
                          </div>
                        </div>
                      </div>
                      <form onSubmit={handleEditSubmit} className="space-y-5">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informations client</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Ces informations sont utilisées pour les communications et la livraison.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du client *</label>
                            <input
                              type="text"
                              name="name"
                              value={editForm.name}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={editForm.email}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                            <input
                              type="tel"
                              name="phone"
                              value={editForm.phone}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
                            <input
                              type="text"
                              name="address"
                              value={editForm.address}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
                            <input
                              type="text"
                              name="city"
                              value={editForm.city}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Région / État</label>
                            <input
                              type="text"
                              name="state"
                              value={editForm.state}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Code postal</label>
                            <input
                              type="text"
                              name="zip_code"
                              value={editForm.zip_code}
                              onChange={handleEditInputChange}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes internes</label>
                            <textarea
                              name="notes"
                              value={editForm.notes}
                              onChange={handleEditInputChange}
                              rows={4}
                              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                              placeholder="Ajoutez des notes pour l'équipe..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            disabled={isSavingEdit || removingItems.length > 0}
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingEdit}
                            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60"
                          >
                            {isSavingEdit ? (
                              <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                Sauvegarde...
                              </>
                            ) : (
                              'Enregistrer les modifications'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Adresse de livraison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Adresse de livraison</h2>
                <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 space-y-1">
                  <p className="break-words">{order.shipping_address?.name}</p>
                  <p className="break-words">{order.shipping_address?.address}</p>
                  <p className="break-words">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                  <p>{order.shipping_address?.zip_code}</p>
                </div>
              </motion.div>

              {/* Produits commandés */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Produits commandés</h2>
                <div className="space-y-3">
                  {order.order_items?.length > 0 ? (
                    order.order_items.map((item) => {
                      const variantDetails = getVariantDetails(item);
                      return (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            {settings?.display_order_images && item.products?.image_url && (
                              <img
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                                {item.products?.name || 'Produit inconnu'}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  Quantité: {item.quantity}
                                </p>
                                {item.selected_color && (() => {
                                  try {
                                    const colorData = JSON.parse(item.selected_color);
                                    return (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                        <span
                                          className="inline-block h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600"
                                          style={{ backgroundColor: colorData.hex }}
                                        />
                                        {colorData.name}
                                      </span>
                                    );
                                  } catch (error) {
                                    console.error('Error parsing selected_color:', error);
                                    return null;
                                  }
                                })()}
                                {variantDetails.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {variantDetails.map(({ key, value, imageUrl }) => (
                                      <span
                                        key={`${item.id}-${key}`}
                                        className="group relative inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 overflow-visible"
                                      >
                                        {imageUrl && (
                                          <span className="relative flex items-center">
                                            <img
                                              src={imageUrl}
                                              alt={`${value}`}
                                              className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
                                              onError={(e) => {
                                                e.currentTarget.style.visibility = 'hidden';
                                              }}
                                            />
                                            <span className="pointer-events-none absolute left-1/2 -top-3 z-40 hidden -translate-x-1/2 -translate-y-full group-hover:flex group-hover:pointer-events-auto">
                                              <span className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-2 shadow-lg">
                                                <div className="relative w-32 h-32 sm:w-36 sm:h-36 overflow-hidden rounded-md">
                                                  <img
                                                    src={imageUrl}
                                                    alt={`${value} preview`}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                  />
                                                </div>
                                              </span>
                                            </span>
                                          </span>
                                        )}
                                        <span>
                                          <span className="font-semibold">{key}:</span> {value}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="space-y-1">
                              {/* Item subtotal */}
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                                {formatPrice(item.price * item.quantity)}
                              </p>

                              {/* Item discount */}
                              {item.discount && item.discount > 0 && (
                                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                                  Remise: -{formatPrice(item.discount)}
                                </p>
                              )}

                              {/* Item total after discount */}
                              {item.discount && item.discount > 0 && (
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                                  {formatPrice((item.price * item.quantity) - (item.discount || 0))}
                                </p>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {formatPrice(item.price)} / unité
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic text-sm">Aucun produit dans cette commande</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Sous-total</span>
                    <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      {formatPrice(order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                    </span>
                  </div>

                  {/* Total Discount */}
                  {orderDiscountValue > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-red-600 dark:text-red-400">Remise totale</span>
                      <span className="text-sm sm:text-base text-red-600 dark:text-red-400 font-medium">
                        -{formatPrice(orderDiscountValue)}
                      </span>
                    </div>
                  )}

                  {/* Final Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(orderTotalValue)}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Localisation */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Localisation client</h2>
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 h-48 sm:h-64">
                  <OrderLocationMap
                    userGeolocation={order.userGeolocation}
                    userName={order.shipping_address?.name}
                  />
                </div>
                {order.userGeolocation && (
                  <>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center break-all">
                      Coordonnées: {order.userGeolocation.latitude?.toFixed(5)}, {order.userGeolocation.longitude?.toFixed(5)}
                    </p>
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        {t('orders.scan_to_open_in_google_maps')}
                      </span>
                      <QRCode
                        value={`https://www.google.com/maps/@${order.userGeolocation.latitude},${order.userGeolocation.longitude},15z`}
                        size={96}
                      />
                    </div>
                  </>
                )}
              </motion.div>

              {/* Historique des notifications */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <OrderNotificationHistory orderId={orderId} />
              </motion.div>

              {/* Actions facturation */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Facturation & documents
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Téléchargez ou envoyez la facture au client.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                    className={`inline-flex items-center gap-1 rounded-full border border-gray-300/50 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition ${
                      downloadingInvoice
                        ? 'cursor-not-allowed opacity-60 text-gray-400 dark:border-gray-600/40 dark:bg-gray-700 dark:text-gray-500'
                        : 'text-gray-700 hover:bg-gray-50 dark:border-gray-600/40 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingInvoice ? 'Téléchargement...' : 'Télécharger la facture'}
                  </button>
                  <button
                    onClick={handleSendInvoice}
                    disabled={sendingInvoice || !customerEmail}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${sendingInvoice || !customerEmail
                        ? 'border border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
                        : 'border border-green-400/60 bg-gradient-to-r from-green-500/20 to-green-500/45 text-green-700 hover:from-green-500/30 hover:to-green-500/55 dark:border-green-400/40 dark:text-green-200'
                      }`}
                  >
                    <Send className="h-4 w-4" />
                    {sendingInvoice ? 'Envoi...' : 'Envoyer la facture'}
                  </button>
                </div>
                {!customerEmail && (
                  <p className="text-xs text-red-500 dark:text-red-300">
                    Aucun e-mail client renseigné. Ajoutez une adresse pour pouvoir envoyer la facture.
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 