import { Button, Container, Text } from '@medusajs/ui';
import { BarChart } from '../components/BarChart';
import { LineChart } from './LineChart';
import { useProductAnalytics } from '../hooks/product-analytics';
import { useIntervalRange } from '../hooks/use-interval-range';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { Skeleton } from './Skeleton';
import { withOptionalAnalyticsRange } from '../lib/analytics-widgets-links';
import { useOrderAnalytics } from '../hooks/order-analytics';

// Wrapper for chart error handling
const ChartStateWrapper: React.FC<{
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyText?: string;
  children: React.ReactNode;
}> = ({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyText = 'No data available for the selected period.',
  children,
}) => {
  if (isLoading) {
    return <Skeleton className="w-full h-44" />;
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Text size="xsmall" className="text-ui-fg-error">
          Unable to load chart data.
        </Text>

        <Text size="xsmall" className="text-ui-fg-muted max-w-72 truncate">
          {errorMessage}
        </Text>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <Text
        size="xsmall"
        className="text-ui-fg-muted flex items-center justify-center flex-1"
      >
        {emptyText}
      </Text>
    );
  }

  return children;
};

// Products
export const TopSellingProducts = () => {
  const { range } = useIntervalRange();
  const { data, isLoading, isError, error } = useProductAnalytics(range);
  const topThreeSellers = data?.variantQuantitySold
    ?.filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            Top-Selling Products
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted ">
            Top products by quantity sold in the selected time period
          </Text>
        </div>

        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics?tab=products',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      <ChartStateWrapper
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={!topThreeSellers || topThreeSellers.length === 0}
      >
        <div className="max-w-72 flex-1 text-xs aspect-video">
          <BarChart
            isHorizontal
            data={topThreeSellers}
            yAxisDataKey="quantity"
            xAxisDataKey="title"
            lineColor="#a1a1aa"
            colorKeyField="title"
            hideTooltip
          />
        </div>
      </ChartStateWrapper>
    </Container>
  );
};

export const LowStockVariants = () => {
  const { range } = useIntervalRange();
  const { data, isLoading, isError, error } = useProductAnalytics(range);

  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            Low Stock Variants
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted">
            Products with inventory below threshold{' '}
          </Text>
        </div>

        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics?tab=products#:~:text=Low%20Stock%20Variants',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      <ChartStateWrapper
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={!data?.lowStockVariants || data.lowStockVariants.length === 0}
      >
        <div className="max-w-72 flex-1 text-xs aspect-video">
          <BarChart
            isHorizontal
            data={data?.lowStockVariants}
            xAxisDataKey="variantName"
            yAxisDataKey="inventoryQuantity"
            lineColor="#a1a1aa"
            colorKeyField="variantName"
            hideTooltip
          />
        </div>
      </ChartStateWrapper>
    </Container>
  );
};

export const BottomSellingProducts = () => {
  const { range } = useIntervalRange();
  const { data, isLoading, isError, error } = useProductAnalytics(range);
  const topThreeWorstSellingProducts = data?.variantQuantitySold
    ?.filter((item) => item.quantity > 0)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 3);

  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            Bottom-Selling Products
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted">
            Worst products by quantity sold in the selected time period
          </Text>
        </div>

        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics?tab=products',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      <ChartStateWrapper
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={
          !topThreeWorstSellingProducts ||
          topThreeWorstSellingProducts.length === 0
        }
      >
        <div className="max-w-72 flex-1 text-xs aspect-video">
          <BarChart
            isHorizontal
            data={topThreeWorstSellingProducts}
            yAxisDataKey="quantity"
            xAxisDataKey="title"
            lineColor="#a1a1aa"
            colorKeyField="title"
            hideTooltip
          />
        </div>
      </ChartStateWrapper>
    </Container>
  );
};

// Customers
export const NewVsReturningCustomers = () => {
  const { range } = useIntervalRange();
  const { data, isLoading, isError, error } = useCustomerAnalytics(range);

  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            New vs Returning Customers
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted">
            New and returning customers over time in the selected period
          </Text>
        </div>

        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics?tab=customers',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      <ChartStateWrapper
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={!data?.customer_count || data.customer_count.length === 0}
      >
        <div className="w-full max-w-72 mx-auto flex-1 aspect-video min-w-60">
          <LineChart
            data={data?.customer_count}
            xAxisDataKey="name"
            series={[
              { dataKey: 'new_customers', color: '#82ca9d' },
              { dataKey: 'returning_customers', color: '#a1a1aa' },
            ]}
            hideTooltip
          />
        </div>
      </ChartStateWrapper>
    </Container>
  );
};

export const TopCustomerGroupBySales = () => {
  const { range } = useIntervalRange();
  const { data, isLoading, isError, error } = useCustomerAnalytics(range);

  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            Top Customer Groups by Sales
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted">
            Sales breakdown by customer group in the selected period
          </Text>
        </div>

        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics?tab=customers#:~:text=Top%20Customer%20Groups%20by%20Sales',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      <ChartStateWrapper
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={!data?.customer_group || data.customer_group.length === 0}
      >
        <div className="w-full max-w-72 mx-auto flex-1 aspect-video min-w-60">
          <BarChart
            data={data?.customer_group ?? []}
            xAxisDataKey="name"
            yAxisDataKey="total"
            lineColor="#a1a1aa"
            hideTooltip
          />
        </div>
      </ChartStateWrapper>
    </Container>
  );
};

export const AverageSalesPerCustomer = () => {
  const { interval, range } = useIntervalRange();
  const ordersQuery = useOrderAnalytics(interval, range);
  const customersQuery = useCustomerAnalytics(range);

  const customersPerBucket = new Map(
    (customersQuery.data?.customer_count ?? []).map((point) => [
      point.name,
      (point.new_customers ?? 0) + (point.returning_customers ?? 0),
    ]),
  );

  const averageSalesPerCustomerTimeline = (
    ordersQuery.data?.order_sales ?? []
  ).map((point) => {
    const customersInBucket =
      customersPerBucket.get(point.name) ??
      customersQuery.data?.total_customers ??
      0;

    return {
      name: point.name,
      value:
        customersInBucket > 0
          ? Number((point.sales / customersInBucket).toFixed(2))
          : 0,
    };
  });

  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            Average Sales per Customer
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted">
            Average sales per customer over time in the selected period
          </Text>
        </div>
        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics#:~:text=Sales%20Over%20Time',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      <ChartStateWrapper
        isLoading={ordersQuery.isLoading || customersQuery.isLoading}
        isError={ordersQuery.isError || customersQuery.isError}
        errorMessage={
          ordersQuery.error?.message || customersQuery.error?.message
        }
        isEmpty={averageSalesPerCustomerTimeline.length === 0}
      >
        <div className="w-full max-w-72 mx-auto flex-1 aspect-video min-w-60">
          <LineChart
            data={averageSalesPerCustomerTimeline}
            xAxisDataKey="name"
            yAxisDataKey="value"
            lineColor="#a1a1aa"
            yAxisTickFormatter={(value) =>
              new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: ordersQuery.data?.currency_code || 'EUR',
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
        </div>
      </ChartStateWrapper>
    </Container>
  );
};
