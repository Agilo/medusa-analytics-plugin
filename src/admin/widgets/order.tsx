import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Text } from "@medusajs/ui";
import { PieChart } from "../components/PieChart";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";
import { BarChart } from "../components/BarChart";
import {
  OrderAnalyticsResponse,
  useOrderAnalytics,
} from "../hooks/order-analytics";
import { startOfMonth } from "date-fns";
import { ArrowUp, ArrowUpDown } from "lucide-react";

const today = new Date();
const OrderWidget = () => {
  const { data: orders, isPending } = useOrderAnalytics("this-month", {
    from: startOfMonth(today),
    to: today,
  });

  if (isPending) {
    return (
      <div className="flex gap-4">
        {[...Array(3)].map((_, idx) => (
          <BarChartSkeleton key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex max-md:flex-col gap-4">
      <SalesSummary sales={orders?.order_sales} />
      <OrdersOverTime orders={orders?.order_count} />
      <BestPerformers regions={orders?.regions} />
    </div>
  );
};

const SalesSummary: React.FC<{
  sales?: OrderAnalyticsResponse["regions"];
}> = ({ sales }) => {
  const [interval, setInterval] = React.useState<"this-month" | "last-month">(
    "this-month"
  );
  return (
    <div className="flex-1">
      <Container className="min-h-[9.375rem]">
        <div className="flex justify-between">
          <div>
            <Text size="xlarge" weight="plus">
              Sales Summary
            </Text>
            <Text size="small" className="mb-6 text-ui-fg-muted">
              Total sales and orders{" "}
              {interval === "this-month" ? "for this month" : "for last month"}
            </Text>
          </div>
          <Button variant="secondary" className="p-2.5 size-9">
            {interval === "this-month" ? <ArrowUpDown /> : <ArrowUp />}
          </Button>
        </div>
        {sales ? (
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            <BarChart
              data={sales}
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

const OrdersOverTime: React.FC<{
  orders?: OrderAnalyticsResponse["order_count"];
}> = ({ orders }) => {
  return (
    <div className="flex-1">
      <Container className="min-h-[9.375rem]">
        <div className="flex justify-between">
          <div>
            <Text size="xlarge" weight="plus">
              Orders Over Time
            </Text>
            <Text size="small" className="mb-6 text-ui-fg-muted">
              Distribution of successful orders for this month
            </Text>
          </div>

          <a href="/app/analytics">
            <Button variant="transparent">View more</Button>
          </a>
        </div>
        {orders ? (
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            <PieChart data={orders} dataKey="count" />
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

const BestPerformers: React.FC<{
  regions?: OrderAnalyticsResponse["regions"];
}> = ({ regions }) => {
  return (
    <div className="flex-1">
      <Container className="min-h-[9.375rem]">
        <Text size="xlarge" weight="plus">
          Best performers
        </Text>
        <Text size="small" className="mb-6 text-ui-fg-muted">
          Top 3 regions by sales
        </Text>

        {regions ? (
          <div className="w-full" style={{ aspectRatio: "16/9" }}>
            {/* TODO: Make horizontal bar chart */}
            <BarChart
              data={regions}
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
