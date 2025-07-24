import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import archiver from 'archiver';
import { format } from 'date-fns';
import { BigNumber, Modules } from '@medusajs/framework/utils';
import {
  calculateDateRangeMethod,
  getAllDateGroupingKeys,
  getDateGroupingKey,
} from '../../../../../utils/orders';
import { adminOrdersListQuerySchema } from '../route';
import { DateTime } from 'luxon';

const DEFAULT_CURRENCY = 'EUR';

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = adminOrdersListQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).send('Invalid query params');
    return;
  }

  const validatedQuery = result.data;
  const calculateDateRange = calculateDateRangeMethod[validatedQuery.preset];
  const { current } = calculateDateRange(validatedQuery);

  const currentFrom = format(current.start, 'yyyy-MM-dd');
  const currentTo = format(current.end, 'yyyy-MM-dd');

  const keyRange = getAllDateGroupingKeys('day', currentFrom, currentTo);

  const query = req.scope.resolve('query');
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const cacheModuleService = req.scope.resolve(Modules.CACHE);

  const stores = await storeModuleService.listStores(
    {},
    { relations: ['supported_currencies'] }
  );
  const store = stores?.[0];
  const currencyCode =
    store?.supported_currencies
      ?.find((c) => c.is_default)
      ?.currency_code?.toUpperCase() || DEFAULT_CURRENCY;

  const cacheKey = `exchange_rates_${currencyCode}`;
  let exchangeRates: { rates: Record<string, number> } | null =
    await cacheModuleService.get(cacheKey);

  if (!exchangeRates) {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${currencyCode}`
    );
    exchangeRates = await response.json();

    const now = DateTime.now().setZone('Europe/Berlin');
    let expireAt = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
    if (now >= expireAt) {
      expireAt = expireAt.plus({ days: 1 });
    }

    const ttl = Math.floor(expireAt.diff(now, 'seconds').seconds);
    await cacheModuleService.set(cacheKey, exchangeRates, ttl);
  }

  const { data: orders } = await query.graph({
    entity: 'order',
    fields: ['total', 'created_at', 'currency_code', 'status', 'region.name'],
    filters: {
      created_at: {
        $gte: currentFrom + 'T00:00:00Z',
        $lte: currentTo + 'T23:59:59.999Z',
      },
      status: { $nin: ['draft'] },
    },
    pagination: {
      order: {
        created_at: 'asc',
      },
    },
  });

  const salesByKey: Record<string, number> = {};
  const regions: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  const orderCountByKey: Record<string, number> = {};

  for (const order of orders) {
    const key = getDateGroupingKey(
      new Date(order.created_at),
      'day',
      currentFrom,
      currentTo
    );

    const exchangeRate =
      order.currency_code.toUpperCase() !== currencyCode
        ? exchangeRates?.rates[order.currency_code.toUpperCase()] || 1
        : 1;

    const amount = new BigNumber(order.total).numeric / exchangeRate;

    salesByKey[key] = (salesByKey[key] ?? 0) + amount;
    orderCountByKey[key] = (orderCountByKey[key] ?? 0) + 1;

    if (order.region?.name) {
      regions[order.region.name] = (regions[order.region.name] ?? 0) + amount;
    }

    if (order.status) {
      statuses[order.status] = (statuses[order.status] ?? 0) + 1;
    }
  }

  const salesRows = keyRange.map((dateKey) => ({
    date: dateKey,
    sales: salesByKey[dateKey]?.toFixed(2) ?? '0.00',
  }));
  const salesCsv = [
    `Date,Sales (${currencyCode})`,
    ...salesRows.map((r) => `${r.date},${r.sales}`),
  ].join('\n');

  const orderCountRows = keyRange.map((dateKey) => ({
    date: dateKey,
    count: orderCountByKey[dateKey] ?? 0,
  }));
  const orderCountCsv = [
    'Date,Order Count',
    ...orderCountRows.map((r) => `${r.date},${r.count}`),
  ].join('\n');

  const regionsArray = Object.entries(regions)
    .map(([region, amount]) => ({
      region,
      sales: amount.toFixed(2),
    }))
    .sort((a, b) => Number(b.sales) - Number(a.sales));
  const regionsCsv = [
    `Region,Sales (${currencyCode})`,
    ...regionsArray.map((r) => `${r.region},${r.sales}`),
  ].join('\n');

  const statusesArray = Object.entries(statuses).map(([status, count]) => ({
    status,
    count,
  }));
  const statusesCsv = [
    'Status,Count',
    ...statusesArray.map((r) => `${r.status},${r.count}`),
  ].join('\n');

  res.setHeader(
    'Content-Disposition',
    `attachment; filename=analytics_${currentFrom}_${currentTo}.zip`
  );
  res.setHeader('Content-Type', 'application/zip');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(res);

  archive.append(salesCsv, { name: `sales_over_time.csv` });
  archive.append(orderCountCsv, { name: `order_counts.csv` });
  archive.append(regionsCsv, { name: `regions.csv` });
  archive.append(statusesCsv, { name: `statuses.csv` });

  await archive.finalize();
}
