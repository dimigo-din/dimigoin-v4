import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^#\/(.*)$/, replacement: `${resolvePath("./src")}/$1` },
      { find: /^#app\/(.*)$/, replacement: `${resolvePath("./src/app")}/$1` },
      { find: /^#auth\/(.*)$/, replacement: `${resolvePath("./src/auth")}/$1` },
      { find: /^#scripts\/(.*)$/, replacement: `${resolvePath("./src/scripts")}/$1` },
      { find: /^#test\/(.*)$/, replacement: `${resolvePath("./test")}/$1` },
      { find: /^\$\/(.*)$/, replacement: `${resolvePath("./src/common")}/$1` },
      { find: /^\$decorators\/(.*)$/, replacement: `${resolvePath("./src/common/decorators")}/$1` },
      { find: /^\$dto\/(.*)$/, replacement: `${resolvePath("./src/common/dto")}/$1` },
      { find: /^\$interceptors\/(.*)$/, replacement: `${resolvePath("./src/common/interceptors")}/$1` },
      { find: /^\$mapper\/(.*)$/, replacement: `${resolvePath("./src/common/mapper")}/$1` },
      { find: /^\$modules\/(.*)$/, replacement: `${resolvePath("./src/common/modules")}/$1` },
      { find: /^\$utils\/(.*)$/, replacement: `${resolvePath("./src/common/utils")}/$1` },
      { find: /^~\/(.*)$/, replacement: `${resolvePath("./src/routes")}/$1` },
      { find: /^~([^/]+)\/(.*)$/, replacement: `${resolvePath("./src/routes")}/$1/$2` },
    ],
  },
  test: {
    globals: false,
  },
});
