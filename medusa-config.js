const { defineConfig, loadEnv } = require('@medusajs/utils');

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  modules: [
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
          {
            resolve: '@medusajs/fulfillment-manual',
            id: 'test-provider',
          },
        ],
      },
    },
  ],
});
