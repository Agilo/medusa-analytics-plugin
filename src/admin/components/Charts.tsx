import { Button, Container, Text } from '@medusajs/ui';
import { BarChart } from '../components/BarChart';
import { PieChart } from './PieChart';
import { LineChart } from './LineChart';
import { useProductAnalytics } from '../hooks/product-analytics';
import { useIntervalRange } from '../hooks/use-interval-range';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { Skeleton } from './Skeleton';
import { withOptionalAnalyticsRange } from '../lib/analytics-widgets-links.ts';

// Orders
export const TopSellingProducts = () => {
  const { range } = useIntervalRange();
  const { data, isLoading } = useProductAnalytics(range);
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
      {isLoading ? (
        <Skeleton className="w-full h-44" />
      ) : topThreeSellers && topThreeSellers.length > 0 ? (
        <div className="max-w-72 flex-1 text-xs aspect-video">
          <BarChart
            isHorizontal
            data={topThreeSellers}
            yAxisDataKey="quantity"
            xAxisDataKey="title"
            lineColor="#82ca9d"
            useStableColors={true}
            colorKeyField="title"
            hideTooltip
          />
        </div>
      ) : (
        <Text
          size="xsmall"
          className="text-ui-fg-muted flex items-center justify-center flex-1"
        >
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};

export const LowStockVariants = () => {
  const { range } = useIntervalRange();
  const { data, isLoading } = useProductAnalytics(range);

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
      {isLoading ? (
        <Skeleton className="w-full h-44" />
      ) : data?.lowStockVariants && data?.lowStockVariants?.length > 0 ? (
        <div className="max-w-72 flex-1 text-xs aspect-video">
          <BarChart
            isHorizontal
            data={data?.lowStockVariants}
            xAxisDataKey="variantName"
            yAxisDataKey="inventoryQuantity"
            lineColor="#82ca9d"
            useStableColors={true}
            colorKeyField="variantName"
            hideTooltip
          />
        </div>
      ) : (
        <Text
          size="small"
          className="text-ui-fg-muted flex items-center justify-center flex-1"
        >
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};

export const BottomSellingProducts = () => {
  const { range } = useIntervalRange();
  const { data, isLoading } = useProductAnalytics(range);
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
      {isLoading ? (
        <Skeleton className="w-full h-44" />
      ) : topThreeWorstSellingProducts &&
        topThreeWorstSellingProducts.length > 0 ? (
        <div className="max-w-72 flex-1 text-xs aspect-video">
          <BarChart
            isHorizontal
            data={topThreeWorstSellingProducts}
            yAxisDataKey="quantity"
            xAxisDataKey="title"
            lineColor="#82ca9d"
            useStableColors={true}
            colorKeyField="title"
            hideTooltip
          />
        </div>
      ) : (
        <Text
          size="small"
          className="text-ui-fg-muted flex items-center justify-center flex-1"
        >
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};

// Customers
export const NewVsReturningCustomers = () => {
  const { range } = useIntervalRange();
  const { data, isLoading } = useCustomerAnalytics(range);

  //  Replace line chart with pie chart (optional - data)
  // const pieChartCustomers = [
  //   { count: data?.new_customers, name: 'New Customers' },
  //   { count: data?.returning_customers, name: 'Returning Customers' },
  // ];

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
      {isLoading ? (
        <Skeleton className="w-full h-44" />
      ) : data?.customer_count && data.customer_count.length > 0 ? (
        <div className="w-full max-w-72 mx-auto flex-1 aspect-video min-w-60">
          <LineChart
            data={data.customer_count}
            xAxisDataKey="name"
            series={[
              { dataKey: 'new_customers', color: '#82ca9d' },
              { dataKey: 'returning_customers', color: '#a1a1aa' },
            ]}
            hideTooltip
          />
        </div>
      ) : (
        //  Replace line chart with pie chart (optional - apparence)
        //  (
        //   <div className="w-full max-w-72 mx-auto flex-1 aspect-video min-w-60">
        //     <PieChart data={pieChartCustomers} dataKey="count" hideTooltip />
        //   </div>
        // )
        <Text
          size="xsmall"
          className="text-ui-fg-muted flex items-center justify-center flex-1"
        >
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};

export const TopCustomerGroupBySales = () => {
  const { range } = useIntervalRange();
  const { data, isLoading } = useCustomerAnalytics(range);

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
      {isLoading ? (
        <Skeleton className="w-full h-44" />
      ) : data?.customer_group && data.customer_group.length > 0 ? (
        <div className="w-full max-w-72 mx-auto flex-1 aspect-video min-w-60">
          <BarChart
            data={data.customer_group}
            xAxisDataKey="name"
            lineColor="#82ca9d"
            useStableColors={true}
            colorKeyField="name"
            yAxisDataKey="total"
            yAxisTickFormatter={(value) =>
              new Intl.NumberFormat(undefined, {
                currency: data.currency_code || 'EUR',
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
      ) : (
        <Text
          size="xsmall"
          className="text-ui-fg-muted flex items-center justify-center flex-1"
        >
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};
