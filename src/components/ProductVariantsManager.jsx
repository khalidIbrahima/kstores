import { useState, useEffect, useRef } from 'react';
import { X, Plus, Palette, Ruler, Image as ImageIcon, Package, ChevronDown, ChevronUp } from 'lucide-react';
import ProductImageInput from './ProductImageInput';

const generateTempId = (prefix = 'temp') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createEmptyOption = (order = 0) => ({
  id: generateTempId('temp-opt'),
  name: '',
  image_url: '',
  display_order: order,
  stock: ''
});

const ProductVariantsManager = ({ productId, variants = [], onVariantsChange }) => {
  const [localVariants, setLocalVariants] = useState([]);
  const [expandedVariants, setExpandedVariants] = useState([]);

  // Use a ref to track if we're updating from parent to avoid loop
  const isUpdatingFromParent = useRef(false);
  const prevVariantsRef = useRef(JSON.stringify(variants));

  useEffect(() => {
    // Only update localVariants if variants prop actually changed
    const currentVariantsString = JSON.stringify(variants);
    if (prevVariantsRef.current === currentVariantsString) {
      return; // No change, skip update
    }
    
    prevVariantsRef.current = currentVariantsString;
    isUpdatingFromParent.current = true;
    
    if (variants && variants.length > 0) {
      // Transform variants: ensure product_variant_options becomes options if needed
      const transformedVariants = variants.map(variant => ({
        ...variant,
        options: (variant.options || variant.product_variant_options || []).map(option => ({
          ...option,
          stock: option?.stock ?? ''
        }))
      }));
      setLocalVariants(transformedVariants);
    } else {
      setLocalVariants([]);
    }
    
    // Reset flag after state update
    setTimeout(() => {
      isUpdatingFromParent.current = false;
    }, 0);
  }, [variants]);

  useEffect(() => {
    setExpandedVariants(prev =>
      prev.filter(id => localVariants.some(variant => variant.id === id))
    );
  }, [localVariants]);

  useEffect(() => {
    // Only call onVariantsChange if the change came from user interaction, not from parent update
    if (isUpdatingFromParent.current) {
      return; // Don't propagate parent updates back
    }
    
    if (onVariantsChange) {
      // Check if localVariants actually differs from parent variants
      const currentParentString = JSON.stringify(variants);
      const newLocalString = JSON.stringify(localVariants);
      if (currentParentString !== newLocalString) {
        onVariantsChange(localVariants);
      }
    }
  }, [localVariants, onVariantsChange, variants]);

  const addVariant = (variantType = '') => {
    const newVariant = {
      id: generateTempId(),
      name: variantType || '',
      display_order: localVariants.length,
      options: [createEmptyOption()]
    };
    setLocalVariants(prev => [...prev, newVariant]);
    setExpandedVariants(prev => [...prev, newVariant.id]);
  };

  const removeVariant = (variantId) => {
    setLocalVariants(prev => prev.filter(v => v.id !== variantId));
    setExpandedVariants(prev => prev.filter(id => id !== variantId));
  };

  const updateVariant = (variantId, field, value) => {
    setLocalVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  const addOption = (variantId) => {
    setLocalVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          options: [...(v.options || []), createEmptyOption((v.options || []).length)]
        };
      }
      return v;
    }));
  };

  const removeOption = (variantId, optionId) => {
    setLocalVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          options: (v.options || []).filter(opt => opt.id !== optionId)
        };
      }
      return v;
    }));
  };

  const updateOption = (variantId, optionId, field, value) => {
    setLocalVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          options: (v.options || []).map(opt =>
            opt.id === optionId ? { ...opt, [field]: value } : opt
          )
        };
      }
      return v;
    }));
  };

  const getVariantIcon = (variantName) => {
    const name = variantName.toLowerCase();
    if (name.includes('couleur') || name.includes('color')) return Palette;
    if (name.includes('taille') || name.includes('size')) return Ruler;
    if (name.includes('motif') || name.includes('pattern')) return ImageIcon;
    return Package;
  };

  const toggleVariantExpansion = (variantId) => {
    setExpandedVariants(prev =>
      prev.includes(variantId)
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 sm:p-6 border-2 border-purple-200 dark:border-purple-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Variantes du produit
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
            Ajoutez des options comme la couleur, la taille, le motif, etc.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addVariant(e.target.value);
                e.target.value = '';
              }
            }}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border-2 border-purple-300 dark:border-purple-700 dark:bg-gray-700 dark:text-gray-100 bg-white text-purple-700 dark:text-purple-300 hover:border-purple-400 dark:hover:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 cursor-pointer transition-colors"
          >
            <option value="">Ajouter une variante...</option>
            <option value="Couleur">Couleur</option>
            <option value="Taille">Taille</option>
            <option value="Motif">Motif</option>
            <option value="">Autre...</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localVariants.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune variante ajoutée</p>
            <p className="text-sm mt-1">Ajoutez des variantes comme la couleur, la taille, le motif, etc.</p>
          </div>
        ) : (
          localVariants.map((variant, variantIndex) => {
            const Icon = getVariantIcon(variant.name);
            const variantNameEmpty = !variant.name || variant.name.trim() === '';
            const isExpanded = expandedVariants.includes(variant.id);
            const optionsCount = variant.options?.length || 0;
            return (
              <div
                key={variant.id}
                className="bg-white dark:bg-gray-600 rounded-xl p-5 sm:p-6 border-2 border-purple-200 dark:border-purple-700 shadow-sm flex flex-col h-full"
              >
                <div className="flex flex-col gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-gray-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        Type de variante
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                        placeholder="Ex: Couleur, Taille, Motif, Style..."
                        className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 ${
                          variantNameEmpty
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-500'
                            : 'border border-gray-300 dark:border-gray-500 focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-900'
                        }`}
                      />
                      {variantNameEmpty && (
                        <p className="mt-1 text-xs text-red-500">Nom de variante requis</p>
                      )}
                      {!isExpanded && (
                        <div className="mt-3 space-y-2">
                          {optionsCount === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Ajoutez au moins une option pour cette variante.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {variant.options.slice(0, 3).map((option) => (
                                <span
                                  key={option.id}
                                  className="rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 text-xs font-medium px-3 py-1"
                                >
                                  {option.name || 'Option'}
                                </span>
                              ))}
                              {optionsCount > 3 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{optionsCount - 3} autres
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleVariantExpansion(variant.id)}
                      className="rounded-lg border border-purple-200 dark:border-purple-600 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Replier
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Déployer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                      title="Supprimer cette variante"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Options {variant.name && <span className="text-gray-500 dark:text-gray-400">({variant.name})</span>}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Ajoutez les différentes options disponibles pour cette variante
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addOption(variant.id)}
                      className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {variant.options && variant.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {variant.options.map((option, optionIndex) => {
                        const optionNameEmpty = !option.name || option.name.trim() === '';
                        return (
                          <div
                            key={option.id}
                            className="bg-white dark:bg-gray-600 rounded-lg border-2 border-gray-200 dark:border-gray-500 p-4 space-y-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                          >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                Nom de l'option
                              </label>
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => updateOption(variant.id, option.id, 'name', e.target.value)}
                                placeholder={variant.name === 'Couleur' ? 'Ex: Rouge, Bleu, Vert' : variant.name === 'Taille' ? 'Ex: S, M, L, XL' : 'Ex: Motif 1, Motif 2, Motif 3'}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 ${
                                  optionNameEmpty
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-500'
                                    : 'border border-gray-300 dark:border-gray-500 focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-900'
                                }`}
                              />
                              {optionNameEmpty && (
                                <p className="mt-1 text-xs text-red-500">Nom d'option requis</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOption(variant.id, option.id)}
                              className="w-full sm:w-auto sm:mt-6 px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 text-sm font-medium"
                              title="Supprimer cette option"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <X className="h-5 w-5" />
                                <span className="sm:hidden">Supprimer</span>
                              </span>
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Image de l'option (optionnel)
                              </label>
                              <div className="w-full">
                                <ProductImageInput
                                  value={option.image_url || ''}
                                  onChange={(url) => updateOption(variant.id, option.id, 'image_url', url)}
                                  index={`${variantIndex}-${optionIndex}`}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                Stock disponible
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={option.stock === '' || option.stock === null || option.stock === undefined ? '' : option.stock}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateOption(
                                    variant.id,
                                    option.id,
                                    'stock',
                                    value === '' ? '' : Math.max(0, Number(value))
                                  );
                                }}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                                placeholder="Ex: 25"
                              />
                            </div>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune option ajoutée pour cette variante</p>
                    </div>
                  )}
                </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {localVariants.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            💡 <strong>Astuce :</strong> Ajoutez une image à chaque option pour aider les clients à visualiser les différentes variantes (ex: échantillon de couleur, motif de textile).
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductVariantsManager;

