import { supabase } from '../lib/supabase';

/**
 * Service pour gérer l'upload d'images et vidéos vers Supabase Storage
 */
export class ImageUploadService {
  static BUCKET_NAME = 'product-media';
  static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB pour supporter les vidéos
  static ALLOWED_TYPES = [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    // Vidéos
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'
  ];

  /**
   * Vérifie si le bucket existe (utilise le bucket avatars existant)
   */
  static async ensureBucketExists() {
    try {
      // Le bucket 'avatars' existe déjà, pas besoin de le créer
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du bucket:', error);
      return false;
    }
  }

  /**
   * Valide un fichier image
   */
  static validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('Aucun fichier sélectionné');
      return { isValid: false, errors };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push('Type de fichier non supporté. Utilisez JPG, PNG, WebP, GIF, SVG pour les images ou MP4, WebM, OGG pour les vidéos');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`Le fichier doit faire moins de ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Génère un nom de fichier unique
   */
  static generateFileName(originalName, prefix = 'product') {
    const fileExt = originalName.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    return `${prefix}_${timestamp}_${randomId}.${fileExt}`;
  }

  /**
   * Détermine si un fichier est une vidéo
   */
  static isVideoFile(file) {
    return file.type.startsWith('video/');
  }

  /**
   * Détermine si un fichier est une image
   */
  static isImageFile(file) {
    return file.type.startsWith('image/');
  }

  /**
   * Upload un fichier vers Supabase Storage
   */
  static async uploadFile(file, options = {}) {
    const { 
      prefix = 'product',
      folder = 'products',
      onProgress = null 
    } = options;

    try {
      // Validation du fichier
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // S'assurer que le bucket existe
      await this.ensureBucketExists();

      // Générer le chemin du fichier selon le type
      const fileType = this.isVideoFile(file) ? 'videos' : 'images';
      const fileName = this.generateFileName(file.name, prefix);
      const filePath = `products/${fileType}/${fileName}`;

      // Progress callback si fourni
      if (onProgress) {
        onProgress(0);
      }

      // Upload du fichier
      const { data, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) {
        // Si erreur RLS, essayer avec un chemin plus simple
        if (uploadError.message?.includes('policy') || uploadError.statusCode === 403) {
          console.warn('Tentative avec un chemin simplifié...');
          const simplePath = fileName; // Juste le nom du fichier
          const { data: retryData, error: retryError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(simplePath, file);
          
          if (retryError) {
            throw retryError;
          }
          
          // Utiliser le chemin simplifié pour l'URL
          const { data: { publicUrl } } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(simplePath);
          
          return {
            success: true,
            url: publicUrl,
            path: simplePath,
            fileName: fileName
          };
        }
        
        throw uploadError;
      }

      if (onProgress) {
        onProgress(100);
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl,
        path: filePath,
        fileName: fileName
      };

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'upload'
      };
    }
  }

  /**
   * Supprime un fichier du storage
   */
  static async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression'
      };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(files, options = {}) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileOptions = {
        ...options,
        prefix: `${options.prefix || 'product'}_${i + 1}`
      };
      
      const result = await this.uploadFile(file, fileOptions);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Valide une URL de média (image ou vidéo)
   */
  static async validateMediaUrl(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve({ isValid: false, error: 'URL vide' });
        return;
      }

      // Essayer d'abord comme image
      const img = new window.Image();
      img.onload = () => resolve({ isValid: true, type: 'image' });
      img.onerror = () => {
        // Si ce n'est pas une image, essayer comme vidéo
        const video = document.createElement('video');
        video.onloadedmetadata = () => resolve({ isValid: true, type: 'video' });
        video.onerror = () => resolve({ 
          isValid: false, 
          error: 'URL de média non valide ou inaccessible' 
        });
        video.src = url;
      };
      img.src = url;
    });
  }

  /**
   * Valide une URL d'image (alias pour compatibilité)
   */
  static async validateImageUrl(url) {
    return this.validateMediaUrl(url);
  }
}

export default ImageUploadService;
