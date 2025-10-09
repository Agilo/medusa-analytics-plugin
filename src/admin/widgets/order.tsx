import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Text } from "@medusajs/ui";
import { PieChartSkeleton } from "../skeletons/PieChartSkeleton";
import { PieChart } from "../components/PieChart";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";
import { BarChart } from "../components/BarChart";

const OrderWidget = () => (
  <div className="flex max-md:flex-col gap-4">
    <SalesSummary />
    <OrdersOverTime />
    <BestPerformers />
  </div>
);

const SalesSummary = () => {
  return (
    <div className="flex-1">
      <Container className="min-h-[9.375rem]">
        <Text size="xlarge" weight="plus">
          Sales Summary
        </Text>
        <Text size="small" className="mb-6 text-ui-fg-muted">
          Total sales and orders in the last 30 days
        </Text>
        {false ? (
          <BarChartSkeleton />
        ) : true ? (
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            <BarChart
              data={[]}
              xAxisDataKey="name"
              yAxisDataKey="sales"
              lineColor="#82ca9d"
              useStableColors={true}
              colorKeyField="name"
              yAxisTickFormatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  // currency: orders.currency_code,
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
    </div>
  );
};

const OrdersOverTime = () => {
  return (
    <div className="flex-1">
      <Container className="min-h-[9.375rem]">
        <Text size="xlarge" weight="plus">
          Orders Over Time
        </Text>
        <Text size="small" className="mb-6 text-ui-fg-muted">
          Distribution of successful orders
        </Text>
        {false ? (
          <PieChartSkeleton />
        ) : true ? (
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            <PieChart data={[]} dataKey="count" />
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-muted text-center">
            No data available for the selected period.
          </Text>
        )}
      </Container>
    </div>
  );
};

const BestPerformers = () => {
  return (
    <div className="flex-1">
      <Container className="min-h-[9.375rem]">
        <Text size="xlarge" weight="plus">
          Best performers
        </Text>
        <Text size="small" className="mb-6 text-ui-fg-muted">
          Top 3 regions by sales
        </Text>
        {false ? (
          <BarChartSkeleton />
        ) : true ? (
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            <BarChart
              data={[]}
              xAxisDataKey="name"
              yAxisDataKey="sales"
              lineColor="#82ca9d"
              useStableColors={true}
              colorKeyField="name"
              yAxisTickFormatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  // currency: orders.currency_code,
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
    </div>
  );
};
export const config = defineWidgetConfig({
  zone: "order.list.before",
});

export default OrderWidget;
