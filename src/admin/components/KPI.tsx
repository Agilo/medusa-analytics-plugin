import { LineChart } from './LineChart';
import { useIntervalRange } from '../hooks/use-interval-range';
import { useOrderAnalytics } from '../hooks/order-analytics';
import { KPICard } from './AnalyticsTemplateCards.tsx';
import { withOptionalAnalyticsRange } from '../lib/utils/analytics-links.ts';

// Orders
export const AverageOrderValue = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading, isError, error } = useOrderAnalytics(
    interval,
    range,
  );

  const salesChange = (data?.prev_sales_percent ?? 0) / 100;
  const ordersChange = (data?.prev_orders_percent ?? 0) / 100;
  const aovChangeFormula =
    1 + ordersChange === 0 ? 0 : (1 + salesChange) / (1 + ordersChange) - 1;

  const orderSales = data?.order_sales ?? [];
  const orderCount = data?.order_count ?? [];

  const aovTimeline = orderSales.map((point, index) => {
    const count = orderCount[index].count;
    const sales = point.sales;

    return {
      name: point.name,
      value: count > 0 ? sales / count : 0,
    };
  });

  return (
    <KPICard
      title="Average order value"
      href={withOptionalAnalyticsRange(
        '/analytics?tab=orders#:~:text=Orders%20Over%20Time',
        range,
      )}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      value={new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: (data?.currency_code || 'EUR').toUpperCase(),
      }).format(
        data?.total_sales && data?.total_orders
          ? data.total_sales / data.total_orders
          : 0,
      )}
      percentage={aovChangeFormula}
    >
      <LineChart
        data={aovTimeline}
        xAxisDataKey="name"
        yAxisDataKey="value"
        lineColor="#a1a1aa"
        yAxisTickFormatter={(value) =>
          new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: (data?.currency_code || 'EUR').toUpperCase(),
            maximumFractionDigits: 0,
          }).format(
            typeof value === 'number'
              ? value
              : typeof value === 'string'
                ? Number(value)
                : 0,
          )
        }
        hideTooltip
      />
    </KPICard>
  );
};

export const TotalSales = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading, isError, error } = useOrderAnalytics(
    interval,
    range,
  );

  return (
    <KPICard
      title="Total Sales"
      href={withOptionalAnalyticsRange(
        '/analytics#:~:text=Sales%20Over%20Time',
        range,
      )}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      value={new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: data?.currency_code || 'EUR',
      }).format(data?.total_sales || 0)}
      percentage={(data?.prev_sales_percent ?? 0) / 100}
    >
      <LineChart
        data={data?.order_sales ?? []}
        xAxisDataKey="name"
        yAxisDataKey="sales"
        lineColor="#a1a1aa"
        yAxisTickFormatter={(value) =>
          new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: data?.currency_code || 'EUR',
            maximumFractionDigits: 0,
          }).format(
            typeof value === 'number'
              ? value
              : typeof value === 'string'
                ? Number(value)
                : 0,
          )
        }
        hideTooltip
      />
    </KPICard>
  );
};

export const TotalOrders = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading, isError, error } = useOrderAnalytics(
    interval,
    range,
  );

  return (
    <KPICard
      title="Total Orders"
      href={withOptionalAnalyticsRange(
        '/analytics#:~:text=Orders%20Over%20Time',
        range,
      )}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      value={data?.total_orders || 0}
      percentage={(data?.prev_orders_percent ?? 0) / 100}
    >
      <LineChart
        data={data?.order_count ?? []}
        xAxisDataKey="name"
        yAxisDataKey="count"
        lineColor="#a1a1aa"
        hideTooltip
      />
    </KPICard>
  );
};
