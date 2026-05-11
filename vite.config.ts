import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
// IMPORTANTE: `base` precisa ser "/memento-medico/" porque o site sera
// servido em https://franklinmarketing-tech.github.io/memento-medico/.
export default defineConfig({
  base: "/memento-medico/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 5173,
  },
});
