import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    input: {
        main: resolve(import.meta.dirname, "index.html"),
        sandbox: resolve(import.meta.dirname, "sandbox/index.html")
    },
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
