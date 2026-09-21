import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['cartas.png'],
      manifest: {
        name: 'UNO Online',
        short_name: 'UNO',
        description: 'Juego de UNO multijugador online',
        theme_color: '#122b1c',
        background_color: '#122b1c',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/cartas.png', sizes: '1080x1080', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/sounds\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sounds-cache',
              expiration: { maxEntries: 30 },
            },
          },
        ],
      },
    }),
  ],
});
