import { defineConfig } from 'vite'

export default defineConfig({
  base: '/threejs-world-effects-example/',
  server: {
    allowedHosts: ['.ngrok-free.dev'],
  },
});
