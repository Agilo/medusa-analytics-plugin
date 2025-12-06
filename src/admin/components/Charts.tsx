import { Button, Container, Text } from '@medusajs/ui';
import * as React from 'react';
import { BarChartSkeleton } from '../skeletons/BarChartSkeleton';
import { BarChart } from './BarChart';
import { ProductAnalyticsResponse } from '../hooks/product-analytics';
import { CustomerAnalyticsResponse } from '../hooks/customer-analytics';

export type BarChartTypes<T = ProductAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
  specificTimeline?: string;
};

export const TopSellingProducts: React.FC<BarChartTypes> = ({
  data,
  isLoading,
  specificTimeline,
}) => {
  const topThreeSellers = data?.variantQuantitySold
    ?.filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  return (
    <Container className="min-h-[9.375rem] flex-1 mb-4">
      <div className="flex justify-between">
        <div>
          <Text size="xlarge" weight="plus">
            Top-Selling Products
          </Text>
          <Text size="small" className="mb-8 text-ui-fg-muted">
            Top products by quantity sold in the{' '}
            {specificTimeline ?? 'selected period'}
          </Text>
        </div>

        <a href="/app/analytics?tab=products">
          <Button variant="transparent" className="text-ui-fg-muted">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <BarChartSkeleton />
      ) : topThreeSellers && topThreeSellers.length > 0 ? (
        <div className="aspect-video">
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
        <Text size="small" className="text-ui-fg-muted text-center">
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};

export const TopCustomerGroupBySales: React.FC<
  BarChartTypes<CustomerAnalyticsResponse>
> = ({ data, isLoading, specificTimeline }) => (
  <Container className="min-h-[9.375rem]">
    <Text size="xlarge" weight="plus">
      Top Customer Groups by Sales
    </Text>
    <Text size="small" className="mb-8 text-ui-fg-muted">
      Sales breakdown by customer group in the{' '}
      {specificTimeline ?? 'selected period'}
    </Text>
    {isLoading ? (
      <BarChartSkeleton />
    ) : data?.customer_group && data.customer_group.length > 0 ? (
      <div className="w-full" style={{ aspectRatio: '16/9' }}>
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
      <Text size="small" className="text-ui-fg-muted text-center">
        No data available for the selected period.
      </Text>
    )}
  </Container>
);
