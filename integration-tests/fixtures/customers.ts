import { AdminCustomer } from '@medusajs/types';

export async function createTestCustomer({
  api,
  customerOverride,
  adminHeaders,
}: {
  api: any;
  customerOverride?: Partial<AdminCustomer>;
  adminHeaders: {};
}) {
  const defaultCustomer = {
    email: 'customer@gmail.com',
    first_name: 'Test',
    last_name: 'Test',
  };

  const customerData = { ...defaultCustomer, ...customerOverride };

  const response = await api.post(
    '/admin/customers',
    customerData,
    adminHeaders
  );

  return response.data.customer;
}
