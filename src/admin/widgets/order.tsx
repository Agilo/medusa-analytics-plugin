import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button } from "@medusajs/ui";
import { useOrderAnalytics } from "../hooks/order-analytics";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { AverageOrderValue, TotalOrders, TotalSales } from "../components/KPI";

const today = new Date();

const OrderWidget = () => {
  // TODO: Handle last 30 days and 60 days as well (not this and previous month)
  const [interval, setInterval] = React.useState("this-month");
  const [range, setRange] = React.useState({
    from: startOfMonth(today),
    to: today,
  });
  const { data: orders, isLoading } = useOrderAnalytics(interval, range);

  return (
    <>
      <div className="flex items-center justify-between w-full mt-6 mb-4">
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

      <div className="flex items-center gap-4">
        <TotalSales data={orders} isLoading={isLoading} />
        <TotalOrders data={orders} isLoading={isLoading} />
        <AverageOrderValue data={orders} isLoading={isLoading} />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "order.list.before",
});

export default OrderWidget;
