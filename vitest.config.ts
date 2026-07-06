import { defineConfig } from "vitest/config"
import path from "node:path"

const r = (p: string) => path.resolve(__dirname, p)

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    include: [
      "modules/im/src/three-plus/__tests__/**/*.test.ts",
      "modules/im/src/views/three/__tests__/**/*.test.ts",
    ],
    setupFiles: ["./modules/im/src/three-plus/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@ruoyi/core": r("./packages/core/src"),
      "@ruoyi/core/*": r("./packages/core/src/*"),
      "@ruoyi/module-im": r("./modules/im/src"),
      "@ruoyi/module-im/*": r("./modules/im/src/*"),
      "@ruoyi/module-bi": r("./modules/bi/src"),
      "@ruoyi/module-bi/*": r("./modules/bi/src/*"),
      "@": r("./src"),
    },
  },
})
