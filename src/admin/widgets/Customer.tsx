import { defineWidgetConfig } from '@medusajs/admin-sdk';
import {
  CustomerAnalyticsResponse,
  useCustomerAnalytics,
} from '../hooks/customer-analytics';
import { Button, Container, Text } from '@medusajs/ui';
import { PieChart } from '../components/PieChart';
import { ReturningCustomers } from '../components/KPI';
import { BarChartTypes, TopCustomerGroupBySales } from '../components/Charts';
import { BarChartSkeleton } from '../skeletons/BarChartSkeleton';

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));
const daysPrior90 = new Date(new Date().setDate(today.getDate() - 90));

const CustomerWidget = () => {
  const { data: customersLast30Days, isLoading: isLoadingLast30Days } =
    useCustomerAnalytics({
      from: daysPrior30,
      to: today,
    });

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
      <ReturningCustomers
        data={customersLast90Days}
        isLoading={isLoadingLast90Days}
        specificTimeline="last 90 days"
      />
      <div className="flex gap-4 flex-col md:flex-row">
        <OrderBreakdownPie
          data={customersLast30Days}
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
    </>
  );
};

const OrderBreakdownPie: React.FC<BarChartTypes<CustomerAnalyticsResponse>> = ({
  data,
  isLoading,
  specificTimeline,
}) => {
  const pieChartCustomers = [
    { count: data?.total_customers, name: 'Total Customers' },
    { count: data?.new_customers, name: 'New Customers' },
    {
      count: data?.returning_customers,
      name: 'Returning Customers',
    },
  ];
  return (
    <Container className="min-h-[9.375rem]">
      <div className="flex justify-between">
        <div>
          <Text size="xlarge" weight="plus">
            Order Status Breakdown
          </Text>
          <Text size="small" className="mb-8 text-ui-fg-muted">
            Distribution of orders by status in the {specificTimeline}
          </Text>
        </div>

        <a href="/app/analytics?range=this-month&tab=orders#:~:text=Order%20Status%20Breakdown">
          <Button
            variant="transparent"
            className="text-ui-fg-muted text-xs lg:text-sm"
          >
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <BarChartSkeleton />
      ) : data ? (
        <div className="max-w-80 mx-auto aspect-video">
          <PieChart data={pieChartCustomers} dataKey="count" />
        </div>
      ) : (
        <Text
          size="small"
          className="text-ui-fg-muted flex items-center justify-center flex-1"
        >
          No data available for the selected period.
        </Text>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
