import { Button, clx, Container, Text } from '@medusajs/ui';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { LineChart } from './LineChart';
import { useIntervalRange } from '../hooks/use-interval-range';
import { useOrderAnalytics } from '../hooks/order-analytics';
import { ArrowDownMini, ArrowUpMini } from '@medusajs/icons';

const KPITimelineLabel: React.FC<{
  percentage: number;
}> = ({ percentage }) => {
  return (
    <Text size="small" className="text-ui-fg-muted">
      <span
        className={clx(
          percentage > 0 ? 'text-ui-tag-green-text' : 'text-ui-fg-error',
          'inline-flex items-baseline gap-0.5',
        )}
      >
        {percentage > 0 ? (
          <ArrowUpMini className="size-3 self-center" viewBox="0 0 15 15" />
        ) : (
          <ArrowDownMini className="size-3 self-center" viewBox="0 0 15 15" />
        )}
        {new Intl.NumberFormat(undefined, {
          style: 'percent',
          maximumFractionDigits: 2,
        }).format(Math.abs(percentage))}
      </span>{' '}
      from the previous period
    </Text>
  );
};

// KPIS
export const AverageOrderValue: React.FC = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading } = useOrderAnalytics(interval, range);

  const salesChange = (data?.prev_sales_percent ?? 0) / 100;
  const ordersChange = (data?.prev_orders_percent ?? 0) / 100;
  const aovChangeFormula =
    1 + ordersChange === 0 ? 0 : (1 + salesChange) / (1 + ordersChange) - 1;

  return (
    <Container className="flex flex-col min-h-44">
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
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: (data?.currency_code || 'EUR').toUpperCase(),
              }).format(
                data?.total_sales && data?.total_orders
                  ? data.total_sales / data.total_orders
                  : 0,
              )}
            </Text>
            <KPITimelineLabel percentage={aovChangeFormula} />
          </div>
        </div>
      )}
    </Container>
  );
};

// KPI + Graphs
export const TotalSales: React.FC = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading } = useOrderAnalytics(interval, range);

  return (
    <Container className="min-h-44">
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
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: data?.currency_code || 'EUR',
              }).format(data?.total_sales || 0)}
            </Text>
            <KPITimelineLabel
              percentage={(data?.prev_sales_percent ?? 0) / 100}
            />
          </div>

          <div className="aspect-video flex-1 mt-2.5 max-w-64">
            <LineChart
              data={data?.order_sales ?? []}
              xAxisDataKey="name"
              yAxisDataKey="count"
              lineColor="#a1a1aa"
              hideTooltip
            />
          </div>
        </div>
      )}
    </Container>
  );
};

export const TotalOrders: React.FC = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading } = useOrderAnalytics(interval, range);

  return (
    <Container className="min-h-44">
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
            <KPITimelineLabel
              percentage={(data?.prev_orders_percent ?? 0) / 100}
            />
          </div>

          <div className="aspect-video flex-1 mt-2.5 max-w-64">
            <LineChart
              data={data?.order_count}
              xAxisDataKey="name"
              yAxisDataKey="count"
              lineColor="#a1a1aa"
              yAxisTickFormatter={(value) =>
                new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: data?.currency_code || 'EUR',
                  maximumFractionDigits: 0,
                }).format(value)
              }
              hideTooltip
            />
          </div>
        </div>
      )}
    </Container>
  );
};

export const AverageSalesPerCustomer: React.FC = () => {
  const { interval, range } = useIntervalRange();
  const ordersQuery = useOrderAnalytics(interval, range);
  const customersQuery = useCustomerAnalytics(range);

  const averageSalesPerCustomer =
    customersQuery.data?.total_customers &&
    customersQuery.data.total_customers > 0
      ? +(
          (ordersQuery.data?.total_sales || 0) /
          customersQuery.data.total_customers
        ).toFixed(2)
      : 0;
  const isLoading = ordersQuery.isLoading || customersQuery.isLoading;

  return (
    <Container className="min-h-44">
      <div className="flex justify-between items-center">
        <Text size="large">Average Sales per Customer</Text>
        <a href="/app/analytics#:~:text=Sales%20Over%20Time">
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
              {new Intl.NumberFormat(undefined, {
                currency: customersQuery.data?.currency_code || 'EUR',
                style: 'currency',
              }).format(averageSalesPerCustomer)}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              in the selected time period
            </Text>
          </div>

          <div className="aspect-video flex-1 mt-2.5 max-w-64">
            <LineChart
              // TODO: Put maybe the other fields to show trend over time?
              data={[
                {
                  count: averageSalesPerCustomer,
                  name: 'Customers',
                },
              ]}
              xAxisDataKey="name"
              yAxisDataKey="count"
              lineColor="#82ca9d"
            />
          </div>
        </div>
      )}
    </Container>
  );
};
