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
    <Container className="min-h-[9.375rem] flex-1  flex flex-col">
      <div className="flex justify-between">
        <div>
          <Text size="xlarge" weight="plus">
            Top-Selling Products
          </Text>
          <Text size="xsmall" className="mb-8 text-ui-fg-muted ">
            Top products by quantity sold in the{' '}
            {specificTimeline ?? 'selected period'}
          </Text>
        </div>

        <a href="/app/analytics?tab=products">
          <Button
            variant="transparent"
            className="text-ui-fg-muted text-xs lg:text-sm"
          >
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <BarChartSkeleton />
      ) : topThreeSellers && topThreeSellers.length > 0 ? (
        <div className="aspect-video text-sm">
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

export const TopCustomerGroupBySales: React.FC<
  BarChartTypes<CustomerAnalyticsResponse>
> = ({ data, isLoading, specificTimeline }) => (
  <Container className="min-h-[9.375rem] ">
    <div className="flex justify-between">
      <div>
        <Text size="xlarge" weight="plus">
          Top Customer Groups by Sales
        </Text>
        <Text size="xsmall" className="mb-8 text-ui-fg-muted">
          Sales breakdown by customer group in the{' '}
          {specificTimeline ?? 'selected period'}
        </Text>
      </div>

      <a href="/app/analytics?tab=customers#:~:text=Top%20Customer%20Groups%20by%20Sales">
        <Button
          variant="transparent"
          className="text-ui-fg-muted text-xs lg:text-sm"
        >
          View more
        </Button>
      </a>
    </div>
    {isLoading ? (
      <BarChartSkeleton />
    ) : data?.customer_group && data.customer_group.length > 0 ? (
      <div className="max-w-80 mx-auto aspect-video">
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
      <Text size="xsmall" className="text-ui-fg-muted text-center">
        No data available for the selected period.
      </Text>
    )}
  </Container>
);
