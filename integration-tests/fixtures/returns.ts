import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { AdminOrder, MedusaContainer } from '@medusajs/framework/types';

type AdminHeaders = { headers: Record<string, string> };

/**
 * Fulfills every item of the order. Medusa only lets fulfilled items be returned.
 */
export async function fulfillOrder({
  api,
  adminHeaders,
  order,
  locationId,
}: {
  api: any;
  adminHeaders: AdminHeaders;
  order: AdminOrder;
  locationId: string;
}) {
  await api.post(
    `/admin/orders/${order.id}/fulfillments`,
    {
      location_id: locationId,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    },
    adminHeaders,
  );
}

export async function createReturnReason({
  api,
  adminHeaders,
  label = 'Too small',
}: {
  api: any;
  adminHeaders: AdminHeaders;
  label?: string;
}) {
  const value = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  return (
    await api.post('/admin/return-reasons', { value, label }, adminHeaders)
  ).data.return_reason as { id: string; label: string };
}

/**
 * Creates a return through the admin flow: create → request items → confirm
 * the request (status `requested`). With `confirm: false` the return stays
 * `open`; with `receive: true` it's also received (status `received`).
 * `createdAt` backdates `return.created_at`.
 */
export async function createReturn({
  api,
  container,
  adminHeaders,
  orderId,
  locationId,
  items,
  confirm = true,
  receive = false,
  createdAt,
}: {
  api: any;
  container: MedusaContainer;
  adminHeaders: AdminHeaders;
  orderId: string;
  locationId: string;
  items: { id: string; quantity: number; reason_id?: string }[];
  confirm?: boolean;
  receive?: boolean;
  createdAt?: string;
}): Promise<string> {
  const returnId: string = (
    await api.post(
      '/admin/returns',
      { order_id: orderId, location_id: locationId },
      adminHeaders,
    )
  ).data.return.id;

  await api.post(
    `/admin/returns/${returnId}/request-items`,
    { items },
    adminHeaders,
  );

  if (confirm) {
    await api.post(`/admin/returns/${returnId}/request`, {}, adminHeaders);
  }

  if (confirm && receive) {
    await api.post(`/admin/returns/${returnId}/receive`, {}, adminHeaders);
    await api.post(
      `/admin/returns/${returnId}/receive-items`,
      { items: items.map(({ id, quantity }) => ({ id, quantity })) },
      adminHeaders,
    );
    await api.post(
      `/admin/returns/${returnId}/receive/confirm`,
      {},
      adminHeaders,
    );
  }

  if (createdAt) {
    const repo = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    await repo
      .from('return')
      .update({ created_at: createdAt })
      .where({ id: returnId });
  }

  return returnId;
}

export async function cancelReturn({
  api,
  adminHeaders,
  returnId,
}: {
  api: any;
  adminHeaders: AdminHeaders;
  returnId: string;
}) {
  await api.post(`/admin/returns/${returnId}/cancel`, {}, adminHeaders);
}
