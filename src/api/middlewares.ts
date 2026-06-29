import { authenticate, defineMiddlewares } from '@medusajs/framework/http';

export default defineMiddlewares({
  routes: [
    {
      matcher: '/admin/agilo-analytics*',
      middlewares: [authenticate('user', ['bearer', 'session', 'api-key'])],
    },
  ],
});
