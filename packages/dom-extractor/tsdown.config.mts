import { defineConfig } from "tsdown";

export default defineConfig({
    entry: "src/main.ts",
    outDir: "dist",
    outputOptions: {
        entryFileNames: "domageddon.js"
    },

    platform: "browser",
    format: ["iife"],
    globalName: "Domageddon",

    clean: true,
    dts: false
});
