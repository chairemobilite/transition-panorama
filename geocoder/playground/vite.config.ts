import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Serves the comparison tool, for development only: nothing builds it
export default defineConfig({
    plugins: [react(), tailwindcss()],
});
