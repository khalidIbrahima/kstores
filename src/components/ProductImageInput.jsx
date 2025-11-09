import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Link, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ImageUploadService } from '../services/imageUploadService';

const ProductImageInput = ({ value, onChange, index }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [inputMethod, setInputMethod] = useState('url'); // 'url' or 'upload'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (value) {
      // Vérifier si l'URL est valide (image ou vidéo)
      const img = new window.Image();
      img.onload = () => {
        setPreview(value);
        setMediaType('image');
        setError('');
      };
      img.onerror = () => {
        // Si ce n'est pas une image, essayer comme vidéo
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          setPreview(value);
          setMediaType('video');
          setError('');
        };
        video.onerror = () => {
          setPreview('');
          setError('URL de média non valide');
        };
        video.src = value;
      };
      img.src = value;
    } else {
      setPreview('');
      setError('');
      setMediaType('image');
    }
  }, [value, t]);

  const handleUrlChange = (e) => {
    const url = e.target.value;
    onChange(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError('');

    try {
      const isVideo = ImageUploadService.isVideoFile(file);
      const prefix = isVideo ? `product_video_${index + 1}` : `product_img_${index + 1}`;
      
      const result = await ImageUploadService.uploadFile(file, {
        prefix: prefix,
        folder: 'products'
      });

      if (result.success) {
        onChange(result.url);
        setMediaType(isVideo ? 'video' : 'image');
        toast.success(`${isVideo ? 'Vidéo' : 'Image'} uploadée avec succès`);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setError('Échec de l\'upload du fichier');
      toast.error('Échec de l\'upload du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-1.5">
      {/* Method Selector */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
        <button
          type="button"
          onClick={() => setInputMethod('url')}
          className={`flex-1 flex items-center justify-center gap-0.5 px-1.25 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-colors ${
            inputMethod === 'url'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Link className="h-3 w-3" />
          <span className="truncate">URL</span>
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('upload')}
          className={`flex-1 flex items-center justify-center gap-0.5 px-1.25 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-colors ${
            inputMethod === 'upload'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Upload className="h-3 w-3" />
          <span className="truncate">Upload</span>
        </button>
      </div>

      {/* Input Area */}
      {inputMethod === 'url' ? (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <input
              type="url"
              value={value || ''}
              onChange={handleUrlChange}
              placeholder="https://exemple.com/image.jpg"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 px-2.5 py-1.75 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
            />
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                aria-label="Supprimer"
                title="Supprimer l'image"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {preview && (
            <div className="relative w-full max-w-[120px] sm:max-w-[160px] mx-auto h-24 sm:h-28 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
              {mediaType === 'video' ? (
                <video
                  src={preview}
                  className="h-full w-full object-cover"
                  controls
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div
            className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
              isUploading
                ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : preview
                  ? 'border-gray-300 dark:border-gray-500'
                  : 'border-gray-300 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-600 bg-gray-50 dark:bg-gray-700/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">Upload en cours...</p>
              </div>
            ) : preview ? (
              <div className="space-y-2.5">
                <div className="relative w-full max-w-[120px] sm:max-w-[160px] mx-auto h-24 sm:h-28 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600">
                  {mediaType === 'video' ? (
                    <video
                      src={preview}
                      className="h-full w-full object-cover"
                      controls
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Aperçu"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="px-2.5 py-1 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-full mb-2">
                  <ImageIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Cliquez ou glissez un fichier ici
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  Images: PNG, JPG, WebP, GIF • Vidéos: MP4, WebM (max 50MB)
                </p>
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          {value && inputMethod === 'upload' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
              <span className="font-medium">URL:</span>
              <div className="mt-1 break-all">{value}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageInput; 