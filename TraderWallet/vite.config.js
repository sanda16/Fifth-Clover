import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // 5221 is the HTTP endpoint (see launchSettings.json). It's available
      // under both the "http" and "https" launch profiles, so this works
      // regardless of how you start the API — and avoids dev-cert issues.
      '/api': {
        target: 'http://localhost:5221',
        changeOrigin: true,
      },
    },
  },
});
