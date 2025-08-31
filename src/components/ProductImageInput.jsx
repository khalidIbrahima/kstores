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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Média {index + 1} {mediaType === 'video' && value && <span className="text-blue-600 text-xs">(Vidéo)</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 transition-colors p-1"
            aria-label="Supprimer le média"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Method Selector */}
      <div className="flex space-x-2 bg-gray-50 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setInputMethod('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMethod === 'url'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Link className="h-4 w-4" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMethod === 'upload'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Input Area */}
      <div className="flex gap-3">
        <div className="flex-1">
          {inputMethod === 'url' ? (
            <input
              type="url"
              value={value}
              onChange={handleUrlChange}
              placeholder="https://exemple.com/media.jpg ou .mp4"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isUploading
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
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
              <div className="flex flex-col items-center">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-blue-600">Upload en cours...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Cliquez ou glissez un fichier
                    </p>
                    <p className="text-xs text-gray-500">
                      Images: PNG, JPG, WebP, GIF<br/>
                      Vidéos: MP4, WebM, OGG (max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
        
        {preview && (
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-300 bg-gray-50">
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
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        )}
      </div>

      {/* Current URL Display */}
      {value && inputMethod === 'upload' && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          <span className="font-medium">URL générée:</span>
          <div className="mt-1 break-all">{value}</div>
        </div>
      )}
    </div>
  );
};

export default ProductImageInput; 