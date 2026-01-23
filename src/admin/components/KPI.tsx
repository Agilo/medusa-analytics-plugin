import { Button, Container, Text } from '@medusajs/ui';
import { CustomerAnalyticsResponse } from '../hooks/customer-analytics';
import { OrderAnalyticsResponse } from '../hooks/order-analytics';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { MoveUpRight, MoveDownRight } from 'lucide-react';

type KPIProps<T = OrderAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

// KPIS
export const AverageOrderValue: React.FC<KPIProps> = ({ isLoading, data }) => {
  const salesChange = (data?.prev_sales_percent ?? 0) / 100;
  const ordersChange = (data?.prev_orders_percent ?? 0) / 100;
  const aovChangeFormula =
    1 + ordersChange === 0 ? 0 : (1 + salesChange) / (1 + ordersChange) - 1;

  return (
    <Container className="flex flex-col">
      <div className="flex justify-between items-center">
        <Text size="large">Average order value</Text>
        <a href="/app/analytics?range=this-month&tab=orders#:~:text=Orders%20Over%20Time">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <div className="flex gap-4 justify-between flex-1">
          <div>
            <Text size="xlarge" weight="plus">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: (data?.currency_code || 'EUR').toUpperCase(),
              }).format(
                data?.total_sales && data?.total_orders
                  ? data.total_sales / data.total_orders
                  : 0,
              )}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {aovChangeFormula > 0 ? '+' : '-'}
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                maximumFractionDigits: 2,
              }).format(aovChangeFormula)}
              from the previous period
            </Text>
          </div>
          <div className="self-end mt-auto flex-1 flex justify-end">
            {aovChangeFormula > 0 ? (
              <MoveUpRight className="lg:size-24 size-16 text-ui-tag-green-text" />
            ) : (
              <MoveDownRight className="lg:size-24 size-16 text-ui-fg-error" />
            )}
          </div>
        </div>
      )}
    </Container>
  );
};

export const ReturningCustomers: React.FC<
  KPIProps<CustomerAnalyticsResponse>
> = ({ data, isLoading }) => {
  return (
    <Container className="flex flex-col">
      <div className="flex justify-between items-center">
        <Text size="large">Returning Customers</Text>
        <a href="/app/analytics?tab=customers">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <div className="flex gap-4 justify-between flex-1">
          <div>
            <Text size="xlarge" weight="plus">
              {data?.returning_customers || 0}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              in the selected time period
            </Text>
          </div>
          <div className="aspect-video flex-1 mt-2.5 self-end">
            <BarChart
              xAxisDataKey="name"
              yAxisDataKey="count"
              data={[
                {
                  name: `Returning customers (${data?.currency_code || 'EUR'})`,
                  count: data?.returning_customers
                    ? data.returning_customers
                    : 0,
                },
              ]}
            />
          </div>
        </div>
      )}
    </Container>
  );
};

// KPI + Graphs

export const TotalSales: React.FC<KPIProps> = ({ data, isLoading }) => {
  const topThreeSales = data?.order_count
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return (
    <Container>
      <div className="flex justify-between items-center">
        <Text size="large">Total Sales</Text>
        <a href="/app/analytics#:~:text=Sales%20Over%20Time">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <div className="flex gap-4 justify-between">
          <div>
            <Text size="xlarge" weight="plus">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: data?.currency_code || 'EUR',
              }).format(data?.total_sales || 0)}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {(data?.prev_sales_percent || 0) > 0 && '+'}
              {data?.prev_sales_percent || 0}% from previous period
            </Text>
          </div>

          <div className="aspect-video flex-1 mt-2.5 max-w-64">
            <LineChart
              data={topThreeSales}
              xAxisDataKey="name"
              yAxisDataKey="count"
            />
          </div>
        </div>
      )}
    </Container>
  );
};

export const TotalOrders: React.FC<KPIProps> = ({ isLoading, data }) => {
  const topThreeOrders = data?.order_sales
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  return (
    <Container>
      <div className="flex justify-between items-center">
        <Text size="large">Total Orders</Text>
        <a href="/app/analytics?range=2025-09-01-2025-11-30#:~:text=Orders%20Over%20Time">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <div className="flex gap-4 justify-between">
          <div>
            <Text size="xlarge" weight="plus">
              {data?.total_orders || 0}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {(data?.prev_orders_percent || 0) > 0 && '+'}
              {data?.prev_orders_percent || 0}% from previous period
            </Text>
          </div>

          <div className="aspect-video flex-1 mt-2.5 max-w-64">
            <LineChart
              data={topThreeOrders}
              xAxisDataKey="name"
              yAxisDataKey="sales"
              lineColor="#82ca9d"
            />
          </div>
        </div>
      )}
    </Container>
  );
};
