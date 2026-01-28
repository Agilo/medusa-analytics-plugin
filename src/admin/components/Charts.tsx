import * as React from 'react';
import { Button, Container, Text } from '@medusajs/ui';
import { BarChart } from '../components/BarChart';
import { ProductAnalyticsResponse } from '../hooks/product-analytics';
import { BarChartSkeleton } from '../skeletons/BarChartSkeleton';
import { CustomerAnalyticsResponse } from '../hooks/customer-analytics';
import { PieChart } from './PieChart';

export type BarChartTypes<T = ProductAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

// Orders
export const TopSellingProducts: React.FC<BarChartTypes> = ({
  data,
  isLoading,
}) => {
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

        <a href="/app/analytics?tab=products">
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <BarChartSkeleton />
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

export const LowStockVariants: React.FC<BarChartTypes> = ({
  data,
  isLoading,
}) => (
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

      <a href="/app/analytics?range=2025-09-01-2025-11-30&tab=products#:~:text=Out%2Dof%2DStock%20Variants">
        <Button variant="transparent" className="text-ui-fg-muted text-xs ">
          View more
        </Button>
      </a>
    </div>
    {isLoading ? (
      <BarChartSkeleton />
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

export const BottomSellingProducts: React.FC<BarChartTypes> = ({
  data,
  isLoading,
}) => {
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

        <a href="/app/analytics?tab=products">
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <BarChartSkeleton />
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
export const NewVsReturningCustomers: React.FC<
  BarChartTypes<CustomerAnalyticsResponse>
> = ({ data, isLoading }) => {
  const pieChartCustomers = [
    { count: data?.new_customers, name: 'New Customers' },
    { count: data?.returning_customers, name: 'Returning Customers' },
  ];
  return (
    <Container className="flex flex-col min-h-44">
      <div className="flex justify-between">
        <div>
          <Text size="large" weight="plus">
            New vs Returning Customers
          </Text>
          <Text size="xsmall" className="mb-4 text-ui-fg-muted">
            Distribution of new and returning customers in the selected period
          </Text>
        </div>

        <a href="/app/analytics?range=this-month&tab=orders#:~:text=Order%20Status%20Breakdown">
          <Button variant="transparent" className="text-ui-fg-muted text-xs ">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <BarChartSkeleton />
      ) : data ? (
        <div className="max-w-72 min-h-32 mx-auto flex-1 aspect-video">
          <PieChart data={pieChartCustomers} dataKey="count" />
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

export const TopCustomerGroupBySales: React.FC<
  BarChartTypes<CustomerAnalyticsResponse>
> = ({ data, isLoading }) => (
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

      <a href="/app/analytics?tab=customers#:~:text=Top%20Customer%20Groups%20by%20Sales">
        <Button variant="transparent" className="text-ui-fg-muted text-xs ">
          View more
        </Button>
      </a>
    </div>
    {isLoading ? (
      <BarChartSkeleton />
    ) : data?.customer_group && data.customer_group.length > 0 ? (
      <div className="max-w-72 mx-auto flex-1 aspect-video min-w-60">
        <BarChart
          data={data.customer_group}
          xAxisDataKey="name"
          lineColor="#82ca9d"
          useStableColors={true}
          colorKeyField="name"
          yAxisDataKey="total"
          yAxisTickFormatter={(value: number) =>
            new Intl.NumberFormat('en-US', {
              currency: data.currency_code || 'EUR',
              maximumFractionDigits: 0,
            }).format(value)
          }
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
