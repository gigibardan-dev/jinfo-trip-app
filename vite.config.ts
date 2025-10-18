import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Dedupe React and Radix UI to prevent multiple instances
    dedupe: [
      'react', 
      'react-dom',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-slot'
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure service worker is copied to dist
        manualChunks: undefined,
      },
    },
  },
}));
