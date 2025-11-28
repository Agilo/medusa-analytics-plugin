import { Container, Text } from "@medusajs/ui";
import * as React from "react";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";
import { BarChart } from "./BarChart";
import { ProductAnalyticsResponse } from "../hooks/product-analytics";

export type BarChartTypes<T = ProductAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

export const TopSellingProducts: React.FC<BarChartTypes> = ({
  data,
  isLoading,
}) => {
  return (
    <Container className="mb-4 min-h-[9.375rem]">
      <Text size="xlarge" weight="plus">
        Top-Selling Products
      </Text>
      <Text size="small" className="mb-8 text-ui-fg-muted">
        Products by quantity sold in selected period
      </Text>
      {isLoading ? (
        <BarChartSkeleton />
      ) : data?.variantQuantitySold &&
        data?.variantQuantitySold?.some((item) => item.quantity > 0) ? (
        <div className="w-full" style={{ aspectRatio: "16/9" }}>
          <BarChart
            data={data.variantQuantitySold}
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
