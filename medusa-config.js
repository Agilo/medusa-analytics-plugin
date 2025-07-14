const { defineConfig, Modules } = require('@medusajs/utils');

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
