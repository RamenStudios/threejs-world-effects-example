import { defineConfig } from 'vite'

const REPO_NAME = '/threejs-world-effects-example/'

export default defineConfig({
  base: `${REPO_NAME}`,
  server: {
    allowedHosts: ['.ngrok-free.dev'],
  },
});
