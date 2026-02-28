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
    adminHeaders,
  );

  return response.data.customer;
}

export async function createCustomerGroup({
  api,
  name,
  adminHeaders,
}: {
  api: any;
  name?: string;
  adminHeaders: {};
}) {
  const response = await api.post(
    '/admin/customer-groups',
    {
      name: name || 'Test Group',
    },
    adminHeaders,
  );

  return response.data.customer_group;
}

export async function addCustomerToGroup({
  api,
  customerId,
  groupId,
  adminHeaders,
}: {
  api: any;
  customerId: string;
  groupId: string[];
  adminHeaders: {};
}) {
  const response = await api.post(
    `/admin/customers/${customerId}/customer-groups`,
    {
      add: groupId,
    },
    adminHeaders,
  );

  return response.data;
}
