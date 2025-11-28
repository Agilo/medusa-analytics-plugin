import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useCustomerAnalytics } from "../hooks/customer-analytics";
import { startOfMonth } from "date-fns";
import { Container, Text } from "@medusajs/ui";
import { PieChart } from "../components/PieChart";
import { ReturningCustomers } from "../components/KPI";
import { TopCustomerGroupBySales } from "../components/Charts";

const today = new Date();

const CustomerWidget = () => {
  const { data: customers, isLoading } = useCustomerAnalytics({
    from: startOfMonth(today),
    to: today,
  });

  console.log(customers);

  const pieChartCustomers = [
    { count: customers?.total_customers, name: "Total Customers" },
    { count: customers?.new_customers, name: "New Customers" },
    { count: customers?.returning_customers, name: "Returning Customers" },
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
        <TopCustomerGroupBySales data={customers} isLoading={isLoading} />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default CustomerWidget;
