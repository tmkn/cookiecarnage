import { defineWorkspace } from "vitest/config";

export default defineWorkspace(["./packages/*/vitest.config.mts", "./apps/*/vitest.config.mts"]);
