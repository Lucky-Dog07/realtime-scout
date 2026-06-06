import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const httpsConfig = (() => {
  try {
    const certDir = path.resolve(__dirname, '../../.certs');
    if (fs.existsSync(path.join(certDir, 'key.pem'))) {
      return {
        key: fs.readFileSync(path.join(certDir, 'key.pem')),
        cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
      };
    }
  } catch {}
  return undefined;
})();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: httpsConfig,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
