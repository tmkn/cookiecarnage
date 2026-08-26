import viteConfig from "@tooling/vitest/vitest.config.mjs";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(viteConfig, defineConfig({}));
