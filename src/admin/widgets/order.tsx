import * as React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button } from "@medusajs/ui";
import { useOrderAnalytics } from "../hooks/order-analytics";
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { AverageOrderValue, TotalOrders, TotalSales } from "../components/KPI";

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));
const daysPrior60 = new Date(new Date().setDate(today.getDate() - 60));

const OrderWidget = () => {
  const [interval, setInterval] = React.useState<"30-days-ago" | "60-days-ago">(
    "30-days-ago"
  );
  const [range, setRange] = React.useState({
    from: daysPrior30,
    to: today,
  });
  const { data: orders, isLoading } = useOrderAnalytics(interval, range);

  return (
    <>
      <div className="flex items-center justify-between w-full mt-6 mb-4">
        <h1 className="xl:text-3xl text-2xl">Order insights</h1>

        <div className="flex items-center gap-3">
          <p className="ml-auto text-ui-fg-muted text-sm">
            {interval === "30-days-ago" ? "Last 30 Days" : "Last 60 Days"}
          </p>

          <Button
            variant="secondary"
            className="p-2.5 size-9"
            onClick={() => {
              if (interval === "30-days-ago") {
                setInterval("60-days-ago");
                setRange({
                  from: daysPrior60,
                  to: today,
                });
                return;
              }
              setInterval("30-days-ago");
              setRange({
                from: daysPrior30,
                to: today,
              });
            }}
          >
            {interval === "30-days-ago" ? (
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
