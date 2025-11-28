import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useCustomerAnalytics } from "../hooks/customer-analytics";
import { startOfMonth } from "date-fns";
import { Container, Text } from "@medusajs/ui";
import { PieChart } from "../components/PieChart";
import { BarChart } from "../components/BarChart";
import { ReturningCustomers } from "../components/KPI";

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
      <ReturningCustomers data={customers} isLoading={isLoading} />
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
          {customers.customer_group && customers.customer_group.length > 0 ? (
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
  );
};

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default CustomerWidget;
