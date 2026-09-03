import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/change-app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Change',
        short_name: 'Change',
        description: 'Tracker personal de dieta y peso',
        // iOS paints the strip below the home indicator in standalone mode
        // with these, not with any CSS the page can reach — keep them the
        // same grey as the tab bar so that strip blends into it.
        theme_color: '#17171d',
        background_color: '#17171d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/change-app/',
        scope: '/change-app/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
