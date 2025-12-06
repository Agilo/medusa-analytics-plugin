import * as React from 'react';
import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useProductAnalytics } from '../hooks/product-analytics';
import { BarChartTypes, TopSellingProducts } from '../components/Charts';
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

  // Getting top 3 selling products
  const topThreeSellers = products?.variantQuantitySold
    ?.filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  const productsWithTopVariants = products
    ? { ...products, variantQuantitySold: topThreeSellers ?? [] }
    : undefined;

  return (
    <>
      <h1 className="xl:text-3xl text-2xl mt-6 mb-4 font-medium">
        Product insights
      </h1>

      <div className="flex items-center gap-4 flex-col md:flex-row">
        <TopSellingProducts
          data={productsWithTopVariants}
          isLoading={isLoading}
          specificTimeline="last 30 days"
        />

        <LowStockVariants
          data={products}
          isLoading={isLoading}
          specificTimeline="last 30 days"
        />
      </div>
    </>
  );
};

const LowStockVariants: React.FC<Required<BarChartTypes>> = ({
  data,
  isLoading,
  specificTimeline,
}) => (
  <Container className="min-h-[9.375rem] flex-1 mb-4">
    <div className="flex justify-between w-full">
      <div>
        <Text size="xlarge" weight="plus">
          Low Stock Variants
        </Text>
        <Text size="small" className="mb-8 text-ui-fg-muted">
          Variants with low inventory levels in the {specificTimeline}
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
    ) : data?.lowStockVariants && data?.lowStockVariants?.length > 0 ? (
      <div className="w-full">
        <BarChart
          data={data?.lowStockVariants}
          xAxisDataKey="variantName"
          yAxisDataKey="inventoryQuantity"
          lineColor="#82ca9d"
          useStableColors={true}
          colorKeyField="variantName"
        />
      </div>
    ) : (
      <Text size="small" className="text-ui-fg-muted text-center">
        No data available for the selected period.
      </Text>
    )}
  </Container>
);

export const config = defineWidgetConfig({
  zone: 'product.list.before',
});

export default ProductWidget;
