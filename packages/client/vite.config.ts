import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            "/data": {
                target: "http://localhost:2345",
                changeOrigin: true
            },
            "/proxy": {
                target: "http://localhost:2345",
                changeOrigin: true
            }
        }
    }
});
