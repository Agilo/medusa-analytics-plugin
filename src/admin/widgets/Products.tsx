import * as React from 'react';
import { defineWidgetConfig } from '@medusajs/admin-sdk';
import {
  ProductAnalyticsResponse,
  useProductAnalytics,
} from '../hooks/product-analytics';
import { Button, Container, Text } from '@medusajs/ui';
import { BarChart } from '../components/BarChart';
import { BarChartSkeleton } from '../skeletons/BarChartSkeleton';

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));

export const ProductWidget = () => {
  const { data: products, isLoading } = useProductAnalytics({
    from: daysPrior30,
    to: today,
  });

  return (
    <>
      <h1 className="xl:text-3xl text-2xl mt-6 mb-4 font-medium">
        Product insights
      </h1>

      <div className="flex gap-4 flex-col xl:flex-row items-stretch">
        <TopSellingProducts
          data={products}
          isLoading={isLoading}
          specificTimeline="last 30 days"
        />

        <LowStockVariants
          data={products}
          isLoading={isLoading}
          specificTimeline="last 30 days"
        />

        <WorstSellingProducts
          data={products}
          isLoading={isLoading}
          specificTimeline="last 30 days"
        />
      </div>
    </>
  );
};

export type BarChartTypes<T = ProductAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
  specificTimeline?: string;
};

const TopSellingProducts: React.FC<BarChartTypes> = ({
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

const LowStockVariants: React.FC<Required<BarChartTypes>> = ({
  data,
  isLoading,
  specificTimeline,
}) => (
  <Container className="min-h-[9.375rem] flex flex-col flex-1">
    <div className="flex justify-between">
      <div>
        <Text size="xlarge" weight="plus">
          Low Stock Variants
        </Text>
        <Text size="small" className="mb-8 text-ui-fg-muted">
          Variants with low inventory levels in the {specificTimeline}
        </Text>
      </div>

      <a href="/app/analytics?range=2025-09-01-2025-11-30&tab=products#:~:text=Out%2Dof%2DStock%20Variants">
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
    ) : data?.lowStockVariants && data?.lowStockVariants?.length > 0 ? (
      <div className="w-full">
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

const WorstSellingProducts: React.FC<Required<BarChartTypes>> = ({
  data,
  isLoading,
  specificTimeline,
}) => {
  const topThreeWorstSellingProducts = data?.variantQuantitySold
    ?.filter((item) => item.quantity > 0)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 3);

  return (
    <Container className="min-h-[9.375rem] flex flex-col flex-1">
      <div className="flex justify-between">
        <div>
          <Text size="xlarge" weight="plus">
            Bottom-Selling Products
          </Text>
          <Text size="small" className="mb-8 text-ui-fg-muted">
            Worst products by quantity sold {specificTimeline}
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
      ) : topThreeWorstSellingProducts &&
        topThreeWorstSellingProducts.length > 0 ? (
        <div className="aspect-video text-sm">
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

export const config = defineWidgetConfig({
  zone: 'product.list.before',
});

export default ProductWidget;
