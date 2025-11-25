import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Text } from "@medusajs/ui";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";
import { BarChart } from "../components/BarChart";
import {
  OrderAnalyticsResponse,
  useOrderAnalytics,
} from "../hooks/order-analytics";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChartNoAxesCombined,
  CircleSlash2,
  ShoppingCart,
} from "lucide-react";
import { LineChart } from "../components/LineChart";
import { SmallCardSkeleton } from "../skeletons/SmallCardSkeleton";

const today = new Date();

const OrderWidget = () => {
  const [interval, setInterval] = React.useState("this-month");
  const [range, setRange] = React.useState({
    from: startOfMonth(today),
    to: today,
  });
  const { data: orders, isPending } = useOrderAnalytics(interval, range);

  return (
    <>
      <div className="flex items-center justify-between w-full my-6">
        <h1 className="xl:text-3xl text-2xl">Order insights</h1>

        <div className="flex items-center gap-3">
          <p className="ml-auto text-ui-fg-muted text-sm">
            {interval === "this-month" ? "This Month" : "Last Month"}
          </p>

          <Button
            variant="secondary"
            className="p-2.5 size-9"
            onClick={() => {
              if (interval === "this-month") {
                setInterval("last-month");
                setRange({
                  from: startOfMonth(subMonths(today, 1)),
                  to: endOfMonth(subMonths(today, 1)),
                });
                return;
              }
              setInterval("this-month");
              setRange({
                from: startOfMonth(today),
                to: today,
              });
            }}
          >
            {interval === "this-month" ? (
              <ArrowDownWideNarrow />
            ) : (
              <ArrowUpWideNarrow />
            )}
          </Button>
        </div>
      </div>
      {isPending ? (
        <>
          <div className="flex gap-4 mb-4">
            {[...Array(3)].map((_, idx) => (
              <Container>
                <SmallCardSkeleton key={idx} />
              </Container>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            {[...Array(2)].map((_, idx) => (
              <BarChartSkeleton key={idx} />
            ))}
          </div>
        </>
      ) : (
        <>
          <KPIs orders={orders} />
          <div className="flex max-md:flex-col gap-4">
            <OrdersOverTime orders={orders?.order_count} />
            <BestPerformers regions={orders?.regions} />
          </div>
        </>
      )}
    </>
  );
};

const KPIs: React.FC<{
  orders?: OrderAnalyticsResponse;
}> = ({ orders }) => {
  console.log(orders);

  const totalSales = orders?.total_sales ?? 0;
  const totalOrders = orders?.total_orders ?? 0;
  const averageOrderValue =
    totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  return (
    <div className="flex gap-4">
      {/* Ante: Hoću li razbiti ovo u komponente */}
      <Container className="relative">
        <ShoppingCart className="absolute right-6 top-4 text-ui-fg-muted" />
        <Text size="small">Total Sales</Text>
        <Text size="xlarge" weight="plus">
          €{totalSales}
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {(orders?.prev_sales_percent || 0) > 0 && "+"}
          {orders?.prev_sales_percent || 0}% from previous period
        </Text>
      </Container>
      {/* Ante: Hoću li razbiti ovo u komponente */}
      <Container className="relative">
        <ChartNoAxesCombined className="absolute right-6 top-4 text-ui-fg-muted" />
        <Text size="small">Total Orders</Text>
        <Text size="xlarge" weight="plus">
          {totalOrders}
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {(orders?.prev_orders_percent || 0) > 0 && "+"}
          {orders?.prev_orders_percent || 0}% from previous period
        </Text>
      </Container>
      {/* Ante: Hoću li razbiti ovo u komponente */}
      <Container className="relative">
        <CircleSlash2 className="absolute right-6 top-4 text-ui-fg-muted" />
        <Text size="small">Average order value</Text>
        <Text size="xlarge" weight="plus">
          {averageOrderValue}%
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {averageOrderValue > 0 && "+"}
          {averageOrderValue}% from previous period
        </Text>
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
            <Button variant="transparent" className="text-ui-fg-muted">
              View more
            </Button>
          </a>
        </div>
        {orders ? (
          <div className="w-full aspect-video">
            <LineChart
              data={orders}
              xAxisDataKey="name"
              yAxisDataKey="count"
              lineColor="#82ca9d"
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
          <div className="w-full aspect-video">
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
