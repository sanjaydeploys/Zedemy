import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// Optional: Add legacy support if targeting older browsers
// import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
    }),
    // Removed dynamicImport plugin as Vite handles dynamic imports well natively
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 512,
      // Prioritize Brotli; most modern browsers support it
    }),
    // Removed gzip compression to avoid redundant assets (Brotli is sufficient)
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*.{js,css,html,png,jpg,jpeg,gif,webp}'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,gif,webp}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/se3fw2nzc2\.execute-api\.ap-south-1\.amazonaws\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/d2rq30ca0zyvzp\.cloudfront\.net/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudfront-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'LearnX',
        short_name: 'LearnX',
        description: 'Tech tutorials for Indian students',
        theme_color: '#2c3e50',
        icons: [
          {
            src: '/assets/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
    // Optional: Uncomment for legacy browser support
    // legacy({
    //   targets: ['defaults', 'not IE 11'],
    // }),
  ],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@actions': '/src/actions',
      // Use CDN for common dependencies to reduce bundle size
      react: 'https://esm.sh/react@18',
      'react-dom': 'https://esm.sh/react-dom@18',
    },
  },
  build: {
    minify: 'esbuild', // Switch to esbuild for faster and efficient minification
    sourcemap: true, // Enable source maps in both dev and prod for easier debugging
    target: 'es2020', // Target modern browsers for smaller bundles
    treeshake: {
      preset: 'recommended', // Less aggressive than 'safest' for better optimization
      moduleSideEffects: false, // Assume no side effects unless specified
    },
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendor dependencies
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/react-redux')
          ) {
            return 'vendor';
          }
          // Utilities and lightweight libraries
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/dompurify') ||
            id.includes('node_modules/react-helmet-async')
          ) {
            return 'utilities';
          }
          // Heavy or specialized libraries
          if (
            id.includes('node_modules/react-syntax-highlighter') ||
            id.includes('node_modules/@codemirror') ||
            id.includes('node_modules/react-medium-image-zoom')
          ) {
            return 'heavy';
          }
          // Split highlight.js languages
          if (id.includes('node_modules/highlight.js/lib/languages')) {
            const language = id.split('languages/')[1]?.split('.')[0];
            return `hljs-language-${language}`;
          }
          // Group app components and pages
          if (id.includes('/src/pages/') || id.includes('/src/components/')) {
            return 'app';
          }
        },
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 8192, // Increased to inline small assets
    chunkSizeWarningLimit: 1000, // Relaxed to reduce warnings
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      'axios',
      'dompurify',
      'react-helmet-async',
      'react-syntax-highlighter',
      'react-medium-image-zoom',
    ],
    // Simplified exclusions; Vite handles most dependencies automatically
    exclude: ['highlight.js/lib/languages'],
  },
  server: {
    fs: { allow: ['.'] },
    hmr: { overlay: true },
    // Pre-warm common dependencies for faster dev server startup
    warmup: {
      clientFiles: ['src/main.jsx', 'src/App.jsx'],
    },
  },
}));
