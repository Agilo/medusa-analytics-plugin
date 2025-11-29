import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useCustomerAnalytics } from "../hooks/customer-analytics";
import { Container, Text } from "@medusajs/ui";
import { PieChart } from "../components/PieChart";
import { ReturningCustomers } from "../components/KPI";
import { BarChartTypes, TopCustomerGroupBySales } from "../components/Charts";
import { BarChartSkeleton } from "../skeletons/BarChartSkeleton";

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

  // Getting data for the last 90 days for returning customers rate
  const { data: customersLast90Days, isLoading: isLoadingLast90Days } =
    useCustomerAnalytics({
      from: daysPrior90,
      to: today,
    });

  return (
    <>
      <h1 className="xl:text-3xl text-2xl mt-6 mb-4 font-medium">
        Customer insights
      </h1>
      <div className="lg:w-4/5">
        <ReturningCustomers
          data={customersLast90Days}
          isLoading={isLoadingLast90Days}
          specificTimeline="last 90 days"
        />
        <div className="flex gap-4 my-4 flex-col md:flex-row">
          <OrderBreakdownPie
            data={pieChartCustomers}
            isLoading={isLoadingLast30Days}
            specificTimeline="last 30 days"
          />

          {/* Defined to be the last 90 days for returning customers */}
          <TopCustomerGroupBySales
            data={customersLast30Days}
            isLoading={isLoadingLast30Days}
            specificTimeline="last 30 days"
          />
        </div>
      </div>
    </>
  );
};

const OrderBreakdownPie: React.FC<
  Required<
    BarChartTypes<
      {
        count: number | undefined;
        name: string;
      }[]
    >
  >
> = ({ data, isLoading, specificTimeline }) => (
  <Container className="min-h-[9.375rem]">
    <Text size="xlarge" weight="plus">
      Order Status Breakdown
    </Text>
    <Text size="small" className="mb-8 text-ui-fg-muted">
      Distribution of orders by status in the {specificTimeline}
    </Text>
    {isLoading ? (
      <BarChartSkeleton />
    ) : data ? (
      <div className="w-full" style={{ aspectRatio: "16/9" }}>
        <PieChart data={data} dataKey="count" />
      </div>
    ) : (
      <Text size="small" className="text-ui-fg-muted text-center">
        No data available for the selected period.
      </Text>
    )}
  </Container>
);

export const config = defineWidgetConfig({
  zone: "customer.list.before",
});

export default CustomerWidget;
