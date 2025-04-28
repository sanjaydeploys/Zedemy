import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import dynamicImport from 'vite-plugin-dynamic-import';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
    }),
    dynamicImport(), // Optimize dynamic imports
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 512,
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 512,
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*.{js,css,html,png,jpg,jpeg,gif,webp,mp4,webm}'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,gif,webp,mp4,webm}'],
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
            urlPattern: /\/_vite\/.*\.js$/, // Cache dynamic imports
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dynamic-imports',
              expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|mp4|webm)$/,
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
            options: { cacheName: 'google-fonts', cacheableResponse: { statuses: [0, 200] } },
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
        icons: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@actions': '/src/actions',
    },
  },
  build: {
    minify: 'terser', // Switch to terser for better compression
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn'], // Remove specific console methods
        dead_code: true, // Enhance dead code elimination
      },
      mangle: true, // Mangle variable names for smaller output
    },
    sourcemap: mode !== 'production', // Disable sourcemaps in production
    target: 'esnext',
    treeshake: {
      preset: 'safest', // Strictest tree shaking
      moduleSideEffects: 'no-external', // Assume no side effects for external modules
      propertyReadSideEffects: false, // Optimize property reads
    },
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor dependencies
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom') || id.includes('node_modules/redux') ||
              id.includes('node_modules/react-redux')) {
            return 'vendor';
          }
          // Utility dependencies
          if (id.includes('node_modules/react-helmet-async') || id.includes('node_modules/dompurify') ||
              id.includes('node_modules/react-copy-to-clipboard')) {
            return 'utilities';
          }
          // Syntax highlighter dependencies
          if (id.includes('node_modules/react-syntax-highlighter') || id.includes('node_modules/highlight.js')) {
            return 'syntax_highlighter';
          }
          // CodeMirror dependencies
          if (id.includes('node_modules/@codemirror')) {
            return 'codemirror';
          }
          // Parse5
          if (id.includes('node_modules/parse5')) {
            return 'parse5';
          }
          // Lodash
          if (id.includes('node_modules/lodash')) {
            return 'lodash';
          }
          // Heavy dependencies
          if (id.includes('node_modules/react-medium-image-zoom')) {
            return 'heavy';
          }
          // Split highlight.js languages into separate chunks
          if (id.includes('node_modules/highlight.js/lib/languages')) {
            const language = id.split('languages/')[1]?.split('.')[0];
            return `hljs-language-${language}`;
          }
          // Split large source files
          if (id.includes('/src/pages/') || id.includes('/src/components/')) {
            const parts = id.split('/');
            const fileName = parts[parts.length - 1].split('.')[0];
            return `app-${fileName.toLowerCase()}`;
          }
        },
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 800,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'redux',
      'react-redux',
      'react-helmet-async',
      'dompurify',
      'react-copy-to-clipboard',
      'react-syntax-highlighter',
      'react-medium-image-zoom',
    ],
    exclude: [
      'highlight.js/lib/languages', // Exclude language modules from pre-bundling
      '@codemirror/view',
      '@codemirror/state',
      'parse5',
      'lodash',
    ],
    entries: [
      'src/main.jsx',
      'src/pages/**/*.jsx',
      'src/components/**/*.jsx',
    ], // Scan all entry points for precise dependency detection
    force: true,
  },
  server: {
    fs: { allow: ['.'] },
    hmr: { overlay: true },
  },
}));
