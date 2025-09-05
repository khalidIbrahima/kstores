import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

let supabase = null
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

/**
 * Génère une URL publique Supabase Storage
 */
function getSupabasePublicUrl(filePath, bucketName = 'product-media') {
  if (!filePath) return 'https://kapital-stores.shop/src/assets/logo-transparent.png'
  
  if (filePath.startsWith('http')) {
    return filePath
  }
  
  if (supabaseUrl) {
    const projectId = supabaseUrl.split('//')[1].split('.')[0]
    return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`
  }
  
  return filePath
}

/**
 * Plugin Vite pour générer les métadonnées dynamiques
 */
function metaPlugin() {
  return {
    name: 'meta-plugin',
    configureServer(server) {
      server.middlewares.use('/product', async (req, res, next) => {
        if (req.method === 'GET' && req.url) {
          const productId = req.url.split('/')[1]
          
          if (productId && supabase) {
            try {
              // Récupérer le produit depuis Supabase
              const { data: product, error } = await supabase
                .from('products')
                .select(`
                  *,
                  categories(*)
                `)
                .eq('id', productId)
                .eq('isActive', true)
                .single()

              if (!error && product) {
                // Générer les métadonnées
                const imageUrl = getSupabasePublicUrl(product.image_url)
                const description = product.description 
                  ? product.description.substring(0, 160) + (product.description.length > 160 ? '...' : '')
                  : `Découvrez ${product.name} sur Kapital Stores`

                // Injecter les métadonnées dans le HTML
                const originalHtml = await server.transformIndexHtml(req.url, `
                  <!DOCTYPE html>
                  <html lang="fr">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${product.name} - Kapital Stores</title>
                    
                    <!-- Base Meta Tags -->
                    <meta name="description" content="${description}" />
                    <meta name="keywords" content="${product.name}, ${product.categories?.name || 'produit'}, boutique en ligne, Kapital Stores" />
                    
                    <!-- Open Graph / Facebook -->
                    <meta property="og:type" content="product" />
                    <meta property="og:title" content="${product.name} - Kapital Stores" />
                    <meta property="og:description" content="${description}" />
                    <meta property="og:image" content="${imageUrl}" />
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta property="og:image:alt" content="${product.name} - ${product.categories?.name || 'Produit'} | Kapital Stores" />
                    <meta property="og:url" content="http://localhost:5173/product/${product.id}" />
                    <meta property="og:site_name" content="Kapital Stores" />
                    <meta property="og:locale" content="fr_FR" />
                    
                    <!-- Twitter Card -->
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="${product.name} - Kapital Stores" />
                    <meta name="twitter:description" content="${description}" />
                    <meta name="twitter:image" content="${imageUrl}" />
                    <meta name="twitter:image:alt" content="${product.name} - ${product.categories?.name || 'Produit'} | Kapital Stores" />
                    <meta name="twitter:site" content="@kapital_stores" />
                    <meta name="twitter:creator" content="@kapital_stores" />
                    
                    <!-- Structured Data -->
                    <script type="application/ld+json">
                    {
                      "@context": "https://schema.org",
                      "@type": "Product",
                      "name": "${product.name}",
                      "description": "${product.description || product.name}",
                      "image": "${imageUrl}",
                      "url": "http://localhost:5173/product/${product.id}",
                      "sku": "${product.id}",
                      "brand": {
                        "@type": "Brand",
                        "name": "Kapital Stores"
                      },
                      "offers": {
                        "@type": "Offer",
                        "price": "${product.price}",
                        "priceCurrency": "XOF",
                        "availability": "${product.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}",
                        "seller": {
                          "@type": "Organization",
                          "name": "Kapital Stores"
                        }
                      },
                      "category": "${product.categories?.name || 'Produit'}"
                    }
                    </script>
                  </head>
                  <body>
                    <div id="root"></div>
                    <script type="module" src="/src/main.jsx"></script>
                  </body>
                  </html>
                `)

                res.setHeader('Content-Type', 'text/html')
                res.end(originalHtml)
                return
              }
            } catch (error) {
              console.error('Erreur lors de la récupération du produit:', error)
            }
          }
        }
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), metaPlugin()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  }
})