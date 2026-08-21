import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      include: [
        "src/domain/solar/**/*.ts",
        "src/lib/**/*.ts",
        "src/services/solar-yield.ts",
      ],
    },
  },
});
