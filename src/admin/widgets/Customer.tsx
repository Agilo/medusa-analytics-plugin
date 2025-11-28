import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useCustomerAnalytics } from "../hooks/customer-analytics";
import { startOfMonth } from "date-fns";
import { Container, Text } from "@medusajs/ui";
import { PieChart } from "../components/PieChart";
import { BarChart } from "../components/BarChart";
import { User } from "lucide-react";
import { SmallCardSkeleton } from "../skeletons/SmallCardSkeleton";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";

const today = new Date();

const CustomerWidget = () => {
  const { data: customers, isLoading } = useCustomerAnalytics({
    from: startOfMonth(today),
    to: today,
  });

  console.log(customers);

  if (!customers) return;

  const pieChartCustomers = [
    { count: customers.total_customers, name: "Total Customers" },
    { count: customers.new_customers, name: "New Customers" },
    { count: customers.returning_customers, name: "Returning Customers" },
  ];
  console.log("Customer pending", isLoading);

  return (
    <>
      <h1 className="xl:text-3xl text-2xl mt-6 mb-4">Customer insights</h1>

      {isLoading ? (
        <>
          <Container>
            <SmallCardSkeleton />
          </Container>

          <div className="flex gap-4">
            {[...Array(2)].map((_, idx) => (
              <Container key={idx} className="min-h-[9.375rem]">
                <BarChartSkeleton />
              </Container>
            ))}
          </div>
        </>
      ) : (
        <>
          <Container className="relative">
            <User className="absolute right-6 text-ui-fg-muted top-4 size-[15px]" />
            <Text size="small">Returning Customers</Text>

            <>
              <Text size="xlarge" weight="plus">
                {customers?.returning_customers || 0}
              </Text>
            </>
          </Container>
          <div className="flex gap-4 ">
            <Container className="min-h-[9.375rem]">
              <Text size="xlarge" weight="plus">
                Order Status Breakdown
              </Text>
              <Text size="small" className="mb-8 text-ui-fg-muted">
                Distribution of orders by status in the selected period
              </Text>
              {customers ? (
                <div className="w-full" style={{ aspectRatio: "16/9" }}>
                  <PieChart data={pieChartCustomers} dataKey="count" />
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-muted text-center">
                  No data available for the selected period.
                </Text>
              )}
            </Container>
            <Container className="min-h-[9.375rem]">
              <Text size="xlarge" weight="plus">
                Top Customer Groups by Sales
              </Text>
              <Text size="small" className="mb-8 text-ui-fg-muted">
                Sales breakdown by customer group in the selected period
              </Text>
              {customers.customer_group &&
              customers.customer_group.length > 0 ? (
                <div className="w-full" style={{ aspectRatio: "16/9" }}>
                  <BarChart
                    data={customers.customer_group}
                    xAxisDataKey="name"
                    lineColor="#82ca9d"
                    useStableColors={true}
                    colorKeyField="name"
                    yAxisDataKey="total"
                    yAxisTickFormatter={(value: number) =>
                      new Intl.NumberFormat("en-US", {
                        currency: customers.currency_code || "EUR",
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
        </>
      )}
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default CustomerWidget;
