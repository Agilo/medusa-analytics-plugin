import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  ProductAnalyticsResponse,
  useProductAnalytics,
} from "../hooks/product-analytics";
import { startOfMonth } from "date-fns";

import { Button, Container, Text } from "@medusajs/ui";
import { BarChart } from "../components/BarChart";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";

const today = new Date();

export const StoreWidget = () => {
  const { data: products, isPending } = useProductAnalytics({
    from: startOfMonth(today),
    to: today,
  });

  console.log(products);

  return (
    <>
      <h1 className="xl:text-3xl text-2xl my-6">Product insights</h1>
      <div className="flex items-center gap-4 mb-4">
        {isPending ? (
          [...Array(2)].map((_, idx) => <BarChartSkeleton key={idx} />)
        ) : (
          <>
            <TopSellingProducts products={products} />
            <LowStockVariants />
          </>
        )}
      </div>
    </>
  );
};

const TopSellingProducts: React.FC<{
  products?: ProductAnalyticsResponse;
}> = ({ products }) => {
  const topThreeSelersAboveZero = products?.variantQuantitySold
    ?.filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);
  return (
    <Container className="min-h-[9.375rem] flex-1 h-full">
      <Text size="xlarge" weight="plus">
        Top-Selling Products
      </Text>
      <Text size="small" className="mb-8 text-ui-fg-muted">
        Products by quantity sold in selected period
      </Text>
      {topThreeSelersAboveZero && topThreeSelersAboveZero?.length > 0 ? (
        <div className="w-full aspect-video">
          <BarChart
            data={topThreeSelersAboveZero}
            xAxisDataKey="title"
            yAxisDataKey="quantity"
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

const LowStockVariants: React.FC<{
  products?: ProductAnalyticsResponse;
}> = ({ products }) => {
  const lowStockVariants = products?.lowStockVariants;
  return (
    <Container className="min-h-[9.375rem] flex-1">
      <div className="flex justify-between">
        <div>
          <Text size="xlarge" weight="plus">
            Low Stock Variants
          </Text>
          <Text size="small" className="mb-8 text-ui-fg-muted">
            Variants with low inventory levels
          </Text>
        </div>

        <a href="/app/analytics?tab=products">
          <Button variant="transparent" className="text-ui-fg-muted">
            View more
          </Button>
        </a>
      </div>
      {lowStockVariants && lowStockVariants?.length > 0 ? (
        <div className="w-full">
          <BarChart
            data={lowStockVariants}
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
};

export const config = defineWidgetConfig({
  zone: "product.list.before",
});

export default StoreWidget;
