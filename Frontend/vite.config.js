import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
    }),
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
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|mp4|webm)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
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
    dedupe: ['react', 'react-dom', 'react-router-dom', 'popper.js'],
  },
  build: {
    minify: 'esbuild',
    sourcemap: true,
    target: 'esnext',
    treeshake: 'recommended',
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 10000,
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('redux') || id.includes('react-redux')) {
              return 'vendor';
            }
            if (id.includes('framer-motion') || id.includes('jss') || id.includes('react-toastify')) {
              return 'uiLibs';
            }
            if (id.includes('react-syntax-highlighter') || id.includes('highlight.js') || id.includes('refractor')) {
              return 'syntax_highlighter';
            }
            if (id.includes('@codemirror')) {
              return 'codemirror';
            }
            if (id.includes('parse5')) {
              return 'parse5';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
            if (id.includes('popper.js') || id.includes('@react-spring')) {
              return 'unused_libs';
            }
          }
          if (id.includes('src/pages')) {
            if (id.includes('AddPostForm.jsx')) return 'addPostForm';
            if (id.includes('Dashboard.jsx')) return 'dashboard';
            if (id.includes('Home.jsx')) return 'home';
          }
        },
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 250,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'redux', 'react-redux', 'framer-motion', 'jss', 'react-toastify'],
    exclude: ['highlight.js', '@codemirror/view', '@codemirror/state', 'parse5', 'lodash', 'popper.js', 'react-syntax-highlighter', '@react-spring/core'],
    force: true,
  },
  server: {
    fs: { allow: ['.'] },
    hmr: { overlay: true },
  },
});
