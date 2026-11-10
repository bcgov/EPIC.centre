import { defineConfig } from "cypress";
import registerCodeCoverageTasks from "@cypress/code-coverage/task";

/**
 * Component testing only: specs mount components directly, with no running app.
 *
 * Plain ESM, not TypeScript. This package is "type": "module" and no tsconfig
 * covers this file, so a .ts config is compiled to CommonJS and fails to load.
 *
 * cypress/support/component.ts imports "@cypress/code-coverage/support", whose
 * node half is registered here. vite-plugin-istanbul in vite.config.ts does the
 * instrumenting, and the report is written to coverage/.
 */
export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);
      return config;
    },
  },
});
