import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pinned so the portfolio never silently drifts ports — kivo also
    // defaults to 5173 and grabs it when it starts first.
    port: 5174,
    strictPort: true,
  },
});
