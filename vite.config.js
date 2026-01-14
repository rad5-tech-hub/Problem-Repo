// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true
      },


      injectRegister: 'script',

      // Web App Manifest
      manifest: {
        name: 'Problem Repo',
        short_name: 'Problem Repo',
        description: 'Fully transparent issue tracker for the Rad5 team',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      // Workbox configuration (service worker behavior)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

        navigateFallback: '/index.html',

        navigateFallbackDenylist: [
          /^\/api/,
          /^\/__/,
          /^\/_/,
          /^\/@vite/,
          /firebase\.io$/,
          /\.firestore\.googleapis\.com/,
          /\.googleapis\.com/,
        ],
      },
      appleTouchIcon: true,

      splashScreen: true,
    })
  ]
})