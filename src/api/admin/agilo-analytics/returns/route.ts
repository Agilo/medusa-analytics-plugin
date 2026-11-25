import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import type { BigNumberInput } from '@medusajs/framework/types';
import {
  BigNumber,
  ContainerRegistrationKeys,
  MedusaError,
} from '@medusajs/framework/utils';
import { format } from 'date-fns';
import {
  adminOrdersListQuerySchema,
  calculateDateRangeMethod,
  formatZodIssues,
  getAllDateGroupingKeys,
  getDateGroupingKey,
  getPercentChange,
} from '../../../../utils/orders';
import {
  createStoreCurrencyConverter,
  getStoreCurrencyAndRates,
  getStoreCurrencyCode,
} from '../../../../utils/currency';

export const ELIGIBLE_RETURN_STATUSES = [
  'requested',
  'received',
  'partially_received',
] as const;

const NO_REASON_LABEL = 'No reason';

type NumericLike = BigNumberInput | null | undefined;

type ReturnInPeriod = {
  id: string;
  order_id: string;
  status: string;
  created_at: string | Date;
  order?: { currency_code: string } | null;
  items?:
    | {
        quantity: NumericLike;
        item_id: string;
        reason?: { label: string } | null;
      }[]
    | null;
};

type OrderItemValue = {
  id: string;
  items?: { id: string; quantity: NumericLike; total: NumericLike }[] | null;
};

type CohortOrder = {
  id: string;
  items?:
    | {
        id: string;
        variant_id: string | null;
        product_id: string | null;
        quantity: NumericLike;
        product_title: string | null;
        variant_title: string | null;
        thumbnail: string | null;
      }[]
    | null;
  returns?:
    | {
        status: string;
        items?:
          | {
              quantity: NumericLike;
              item_id: string;
              reason_id?: string | null;
            }[]
          | null;
      }[]
    | null;
};

function toNumber(value: NumericLike): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return new BigNumber(value).numeric;
}

function isEligibleReturnStatus(status: string | null | undefined) {
  return (ELIGIBLE_RETURN_STATUSES as readonly string[]).includes(status ?? '');
}

function roundTo2(value: number) {
  return Number(value.toFixed(2));
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const result = adminOrdersListQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodIssues(result.error),
    );
  }
  const validatedQuery = result.data;

  const calculateDateRange = calculateDateRangeMethod[validatedQuery.preset];
  if (!calculateDateRange) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid preset value',
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { current, previous, days } = calculateDateRange(validatedQuery);
  const currentRange = {
    from: format(current.start, 'yyyy-MM-dd'),
    to: format(current.end, 'yyyy-MM-dd'),
  };
  const previousRange = {
    from: format(previous.start, 'yyyy-MM-dd'),
    to: format(previous.end, 'yyyy-MM-dd'),
  };
  const createdAtFilter = (range: { from: string; to: string }) => ({
    $gte: range.from + 'T00:00:00Z',
    $lte: range.to + 'T23:59:59.999Z',
  });

  // Return-date-based metrics.
  const fetchReturnsInPeriod = async (range: { from: string; to: string }) => {
    const { data } = await query.graph({
      entity: 'return',
      fields: [
        'id',
        'order_id',
        'status',
        'created_at',
        'order.currency_code',
        'items.quantity',
        'items.item_id',
        'items.reason.label',
      ],
      filters: {
        created_at: createdAtFilter(range),
        status: { $in: [...ELIGIBLE_RETURN_STATUSES] },
      },
    });
    return data as unknown as ReturnInPeriod[];
  };

  // Cohort-based metrics. Order module quirks:
  // - `items.quantity` is only set when `items.detail.quantity` is selected;
  // - nested return item quantities are only set with `returns.items.*`.
  const fetchCohortOrders = async (range: { from: string; to: string }) => {
    const { data } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'items.id',
        'items.variant_id',
        'items.product_id',
        'items.product_title',
        'items.variant_title',
        'items.thumbnail',
        'items.quantity',
        'items.detail.quantity',
        'returns.status',
        // `returns.items.reason` is one level too deep for the ORM from an
        // order, so reason labels are looked up by `reason_id` separately.
        'returns.items.*',
      ],
      filters: {
        created_at: createdAtFilter(range),
        status: { $nin: ['draft', 'canceled'] },
      },
    });
    return data as unknown as CohortOrder[];
  };

  const [returns, prevReturns, cohortOrders, prevCohortOrders] =
    await Promise.all([
      fetchReturnsInPeriod(currentRange),
      fetchReturnsInPeriod(previousRange),
      fetchCohortOrders(currentRange),
      fetchCohortOrders(previousRange),
    ]);

  // Separate from the cohort query: a returned order may predate the period.
  const returnOrderIds = [
    ...new Set([...returns, ...prevReturns].map((r) => r.order_id)),
  ];
  const unitValueByItemId: Record<string, number> = {};
  if (returnOrderIds.length) {
    // Item totals are only calculated when the order `total` and the price,
    // quantity, tax and discount fields are selected.
    const { data } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'total',
        'items.id',
        'items.unit_price',
        'items.quantity',
        'items.detail.quantity',
        'items.is_tax_inclusive',
        'items.tax_lines.rate',
        'items.adjustments.amount',
        'items.total',
      ],
      filters: { id: returnOrderIds },
    });
    for (const order of data as unknown as OrderItemValue[]) {
      for (const item of order.items ?? []) {
        const quantity = toNumber(item.quantity);
        unitValueByItemId[item.id] =
          quantity > 0 ? toNumber(item.total) / quantity : 0;
      }
    }
  }

  const { currencyCode, exchangeRates } = returnOrderIds.length
    ? await getStoreCurrencyAndRates(req.scope)
    : {
        currencyCode: await getStoreCurrencyCode(req.scope),
        exchangeRates: null,
      };
  const toStoreCurrency = createStoreCurrencyConverter({
    currencyCode,
    exchangeRates,
    logger,
  });

  const getReturnedValue = (rets: ReturnInPeriod[]) => {
    let total = 0;
    for (const ret of rets) {
      let value = 0;
      for (const item of ret.items ?? []) {
        value +=
          toNumber(item.quantity) * (unitValueByItemId[item.item_id] ?? 0);
      }
      const converted = toStoreCurrency(
        value,
        ret.order?.currency_code ?? currencyCode,
      );
      if (converted !== null) total += converted;
    }
    return total;
  };

  const getReturnRate = (orders: CohortOrder[]) => {
    if (!orders.length) return 0;
    const returnedOrders = orders.filter((order) =>
      (order.returns ?? []).some((r) => isEligibleReturnStatus(r.status)),
    ).length;
    return roundTo2((returnedOrders / orders.length) * 100);
  };

  let groupBy: 'day' | 'week' | 'month' = 'day';
  if (days > 120) {
    groupBy = 'month';
  } else if (days > 30) {
    groupBy = 'week';
  }
  const keyRange = getAllDateGroupingKeys(
    groupBy,
    currentRange.from,
    currentRange.to,
  );
  const countByKey: Record<string, number> = {};
  for (const ret of returns) {
    const key = getDateGroupingKey(
      new Date(ret.created_at),
      groupBy,
      currentRange.from,
      currentRange.to,
    );
    countByKey[key] = (countByKey[key] ?? 0) + 1;
  }
  const returnsOverTime = keyRange.map((name) => ({
    name,
    count: countByKey[name] ?? 0,
  }));

  const quantityByReason: Record<string, number> = {};
  for (const ret of returns) {
    for (const item of ret.items ?? []) {
      const reason = item.reason?.label || NO_REASON_LABEL;
      quantityByReason[reason] =
        (quantityByReason[reason] ?? 0) + toNumber(item.quantity);
    }
  }
  const reasons = Object.entries(quantityByReason)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  const cohortReasonIds = [
    ...new Set(
      cohortOrders.flatMap((order) =>
        (order.returns ?? []).flatMap((ret) =>
          (ret.items ?? []).flatMap((item) =>
            item.reason_id ? [item.reason_id] : [],
          ),
        ),
      ),
    ),
  ];
  const reasonLabelById: Record<string, string> = {};
  if (cohortReasonIds.length) {
    const { data } = await query.graph({
      entity: 'return_reason',
      fields: ['id', 'label'],
      filters: { id: cohortReasonIds },
    });
    for (const reason of data as { id: string; label: string }[]) {
      reasonLabelById[reason.id] = reason.label;
    }
  }

  // Returned and sold quantities come from the same orders, so the rate can't
  // exceed 100%.
  const variants: Record<
    string,
    {
      variant_id: string | null;
      product_id: string | null;
      product_title: string;
      variant_title: string | null;
      thumbnail: string | null;
      returned_quantity: number;
      sold_quantity: number;
      quantityByReason: Record<string, number>;
    }
  > = {};
  for (const order of cohortOrders) {
    const keyByItemId: Record<string, string> = {};
    for (const item of order.items ?? []) {
      const key = item.variant_id ?? item.id;
      keyByItemId[item.id] = key;
      if (!variants[key]) {
        variants[key] = {
          variant_id: item.variant_id ?? null,
          product_id: item.product_id ?? null,
          product_title: item.product_title ?? '',
          variant_title: item.variant_title ?? null,
          thumbnail: item.thumbnail ?? null,
          returned_quantity: 0,
          sold_quantity: 0,
          quantityByReason: {},
        };
      }
      variants[key].sold_quantity += toNumber(item.quantity);
    }
    for (const ret of order.returns ?? []) {
      if (!isEligibleReturnStatus(ret.status)) continue;
      for (const returnItem of ret.items ?? []) {
        const key = keyByItemId[returnItem.item_id];
        if (key) {
          const quantity = toNumber(returnItem.quantity);
          const reason =
            (returnItem.reason_id && reasonLabelById[returnItem.reason_id]) ||
            NO_REASON_LABEL;
          variants[key].returned_quantity += quantity;
          variants[key].quantityByReason[reason] =
            (variants[key].quantityByReason[reason] ?? 0) + quantity;
        }
      }
    }
  }
  const returnedVariants = Object.values(variants)
    .filter((v) => v.returned_quantity > 0)
    .map(({ quantityByReason, ...v }) => ({
      ...v,
      return_rate:
        v.sold_quantity > 0
          ? roundTo2((v.returned_quantity / v.sold_quantity) * 100)
          : 0,
      // Ties are alphabetical, so the top reason is stable.
      reasons: Object.entries(quantityByReason)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort(
          (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name),
        ),
    }))
    .sort(
      (a, b) =>
        b.returned_quantity - a.returned_quantity ||
        b.return_rate - a.return_rate,
    );

  const returnRate = getReturnRate(cohortOrders);
  const prevReturnRate = getReturnRate(prevCohortOrders);
  const returnedValue = getReturnedValue(returns);
  const prevReturnedValue = getReturnedValue(prevReturns);

  res.json({
    total_returns: returns.length,
    prev_returns_percent: getPercentChange(returns.length, prevReturns.length),
    return_rate: returnRate,
    prev_return_rate_percent: getPercentChange(returnRate, prevReturnRate),
    returned_value: returnedValue,
    prev_returned_value_percent: getPercentChange(
      returnedValue,
      prevReturnedValue,
    ),
    returns_over_time: returnsOverTime,
    reasons,
    returned_variants: returnedVariants,
    currency_code: currencyCode,
  } satisfies ReturnAnalyticsResponse);
}

export type ReturnAnalyticsResponse = {
  total_returns: number;
  prev_returns_percent: number;
  /** % of orders created in the range with at least one return, whenever it was made. */
  return_rate: number;
  prev_return_rate_percent: number;
  returned_value: number;
  prev_returned_value_percent: number;
  returns_over_time: { name: string; count: number }[];
  reasons: { name: string; quantity: number }[];
  /** Variants returned from orders created in the range, most returned first. */
  returned_variants: {
    variant_id: string | null;
    product_id: string | null;
    /** Names and thumbnail as on the order line when the order was placed. */
    product_title: string;
    variant_title: string | null;
    thumbnail: string | null;
    returned_quantity: number;
    sold_quantity: number;
    return_rate: number;
    /** Most common first; the quantities add up to `returned_quantity`. */
    reasons: { name: string; quantity: number }[];
  }[];
  currency_code: string;
};
