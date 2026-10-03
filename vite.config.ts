import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'assets/app-icon.svg', 
          'assets/pwa-192x192.png', 
          'assets/pwa-512x512.png', 
          'assets/pwa-maskable-512x512.png', 
          'index.html'
        ],
        manifest: {
          id: '/',
          name: 'قیمت‌یار زرسا - اپ موبایل مدیریت قیمت طلا',
          short_name: 'زرسا طلا',
          description: 'اپلیکیشن همراه مدیریت قیمت روزانه طلا، سکه، پارسیان و تولید کارت‌های قیمت برای گالری طلا زرسا',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#09090b',
          theme_color: '#09090b',
          icons: [
            {
              src: '/assets/app-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/assets/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/assets/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/settings/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-settings-cache',
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 60 * 24 // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
  };
});
