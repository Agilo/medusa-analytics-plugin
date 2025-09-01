const { defineConfig, Modules } = require('@medusajs/utils');
const dotenv = require('dotenv');
const path = require('path');

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });
} else {
  dotenv.config();
}
module.exports = defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
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
