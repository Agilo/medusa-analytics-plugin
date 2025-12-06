import { defineWidgetConfig } from '@medusajs/admin-sdk';
import {
  CustomerAnalyticsResponse,
  useCustomerAnalytics,
} from '../hooks/customer-analytics';
import { Button, Container, Text } from '@medusajs/ui';
import { PieChart } from '../components/PieChart';
import { BarChartSkeleton } from '../skeletons/BarChartSkeleton';
import { OrderAnalyticsResponse } from '../hooks/order-analytics';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { BarChart } from '../components/BarChart';
import { ProductAnalyticsResponse } from '../hooks/product-analytics';

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

type KPIProps<T = OrderAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

const ReturningCustomers: React.FC<
  KPIProps<CustomerAnalyticsResponse> & {
    specificTimeline?: string;
  }
> = ({ data, isLoading, specificTimeline }) => {
  return (
    <Container className="relative">
      <div className="flex justify-between items-center">
        <Text size="large">
          Returning Customers{' '}
          {specificTimeline && (
            <span className="text-ui-fg-muted">({specificTimeline})</span>
          )}
        </Text>
        <a href="/app/analytics?tab=customers">
          <Button
            variant="transparent"
            className="text-ui-fg-muted text-xs lg:text-sm"
          >
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <>
          <Text size="xlarge" weight="plus">
            {data?.returning_customers || 0}
          </Text>
        </>
      )}
    </Container>
  );
};

type BarChartTypes<T = ProductAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
  specificTimeline?: string;
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

const TopCustomerGroupBySales: React.FC<
  BarChartTypes<CustomerAnalyticsResponse>
> = ({ data, isLoading, specificTimeline }) => (
  <Container className="min-h-[9.375rem] ">
    <div className="flex justify-between">
      <div>
        <Text size="xlarge" weight="plus">
          Top Customer Groups by Sales
        </Text>
        <Text size="xsmall" className="mb-8 text-ui-fg-muted">
          Sales breakdown by customer group in the{' '}
          {specificTimeline ?? 'selected period'}
        </Text>
      </div>

      <a href="/app/analytics?tab=customers#:~:text=Top%20Customer%20Groups%20by%20Sales">
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
    ) : data?.customer_group && data.customer_group.length > 0 ? (
      <div className="max-w-80 mx-auto aspect-video">
        <BarChart
          data={data.customer_group}
          xAxisDataKey="name"
          lineColor="#82ca9d"
          useStableColors={true}
          colorKeyField="name"
          yAxisDataKey="total"
          yAxisTickFormatter={(value: number) =>
            new Intl.NumberFormat('en-US', {
              currency: data.currency_code || 'EUR',
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
      </div>
    ) : (
      <Text size="xsmall" className="text-ui-fg-muted text-center">
        No data available for the selected period.
      </Text>
    )}
  </Container>
);

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
