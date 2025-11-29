import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useCustomerAnalytics } from "../hooks/customer-analytics";
import { Container, Text } from "@medusajs/ui";
import { PieChart } from "../components/PieChart";
import { ReturningCustomers } from "../components/KPI";
import { TopCustomerGroupBySales } from "../components/Charts";

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));
const daysPrior90 = new Date(new Date().setDate(today.getDate() - 90));

const CustomerWidget = () => {
  const { data: customersLast30Days, isLoading: isLoadingLast30Days } =
    useCustomerAnalytics({
      from: daysPrior30,
      to: today,
    });

  const pieChartCustomers = [
    { count: customersLast30Days?.total_customers, name: "Total Customers" },
    { count: customersLast30Days?.new_customers, name: "New Customers" },
    {
      count: customersLast30Days?.returning_customers,
      name: "Returning Customers",
    },
  ];

  //Getting data for the last 90 days for returning customers rate
  const { data: customersLast90Days, isLoading: isLoadingLast90Days } =
    useCustomerAnalytics({
      from: daysPrior90,
      to: today,
    });

  return (
    <>
      <h1 className="xl:text-3xl text-2xl mt-6 mb-4">Customer insights</h1>
      <ReturningCustomers
        data={customersLast30Days}
        isLoading={isLoadingLast30Days}
      />
      <div className="flex gap-4 ">
        <Container className="min-h-[9.375rem]">
          <Text size="xlarge" weight="plus">
            Order Status Breakdown
          </Text>
          <Text size="small" className="mb-8 text-ui-fg-muted">
            Distribution of orders by status in the selected period
          </Text>
          {customersLast30Days ? (
            <div className="w-full" style={{ aspectRatio: "16/9" }}>
              <PieChart data={pieChartCustomers} dataKey="count" />
            </div>
          ) : (
            <Text size="small" className="text-ui-fg-muted text-center">
              No data available for the selected period.
            </Text>
          )}
        </Container>

        {/* Defined to be the last 90 days for returning customers */}
        <TopCustomerGroupBySales
          data={customersLast90Days}
          isLoading={isLoadingLast90Days}
        />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default CustomerWidget;
