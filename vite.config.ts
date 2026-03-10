import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url"; // 1. Import this helper
import { componentTagger } from "lovable-tagger";

// 2. Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // "0.0.0.0" is often safer than "::" for localhost visibility
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Optional: Add a proxy so you can use "/api" instead of full URLs
    proxy: {
      '/api': {
        target: 'http://localhost:4100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Now this works!
    },
  },
}));