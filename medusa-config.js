const { defineConfig, Modules } = require('@medusajs/utils');

const DB_URL = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:/medusa-analytics-test`;
process.env.DATABASE_URL = DB_URL;
process.env.LOG_LEVEL = 'error';

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    http: {
      jwtSecret: process.env.JWT_SECRET || 'test',
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
       
          {
            resolve: "@medusajs/fulfillment-manual", 
            id: "test-provider",                  
        
          },
        ],
      },
    },
  ],

});
