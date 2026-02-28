import { Button, clx, Container, Text } from '@medusajs/ui';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { LineChart } from './LineChart';
import { Skeleton } from './Skeleton';
import { useIntervalRange } from '../hooks/use-interval-range';
import { useOrderAnalytics } from '../hooks/order-analytics';
import { ArrowDownMini, ArrowUpMini } from '@medusajs/icons';
import { withOptionalAnalyticsRange } from '../lib/analytics-widgets-links.ts';

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

// Orders
export const AverageOrderValue = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading } = useOrderAnalytics(interval, range);

  const salesChange = (data?.prev_sales_percent ?? 0) / 100;
  const ordersChange = (data?.prev_orders_percent ?? 0) / 100;
  const aovChangeFormula =
    1 + ordersChange === 0 ? 0 : (1 + salesChange) / (1 + ordersChange) - 1;

  const orderSales = data?.order_sales ?? [];
  const orderCount = data?.order_count ?? [];

  const aovTimeline = orderSales.map((point, index) => {
    const count = orderCount[index].count;
    const sales = point.sales;

    return {
      name: point.name,
      value: count > 0 ? sales / count : 0,
    };
  });

  return (
    <Container className="flex flex-col">
      <div className="flex justify-between items-center">
        <Text size="large">Average order value</Text>
        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics?tab=orders#:~:text=Orders%20Over%20Time',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <div className="flex gap-4 justify-between flex-1">
          <div>
            <SmallCardSkeleton />
          </div>
          <Skeleton className="aspect-video w-64 mt-2.5" />
        </div>
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

          <div className="flex-1 flex mt-2.5">
            <div className="aspect-video mt-auto w-full max-w-64 ml-auto">
              <LineChart
                data={aovTimeline}
                xAxisDataKey="name"
                yAxisDataKey="value"
                lineColor="#a1a1aa"
                yAxisTickFormatter={(value) =>
                  new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: (data?.currency_code || 'EUR').toUpperCase(),
                    maximumFractionDigits: 0,
                  }).format(
                    typeof value === 'number'
                      ? value
                      : typeof value === 'string'
                        ? Number(value)
                        : 0,
                  )
                }
                hideTooltip
              />
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export const TotalSales = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading } = useOrderAnalytics(interval, range);

  return (
    <Container className="flex flex-col">
      <div className="flex justify-between items-center">
        <Text size="large">Total Sales</Text>
        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics#:~:text=Sales%20Over%20Time',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <div className="flex gap-4 justify-between flex-1">
          <div>
            <SmallCardSkeleton />
          </div>
          <Skeleton className="aspect-video w-64 mt-2.5" />
        </div>
      ) : (
        <div className="flex gap-4 justify-between flex-1">
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

          <div className="flex-1 flex mt-2.5">
            <div className="aspect-video mt-auto w-full max-w-64 ml-auto">
              <LineChart
                data={data?.order_sales ?? []}
                xAxisDataKey="name"
                yAxisDataKey="sales"
                lineColor="#a1a1aa"
                yAxisTickFormatter={(value) =>
                  new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: data?.currency_code || 'EUR',
                    maximumFractionDigits: 0,
                  }).format(
                    typeof value === 'number'
                      ? value
                      : typeof value === 'string'
                        ? Number(value)
                        : 0,
                  )
                }
                hideTooltip
              />
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export const TotalOrders = () => {
  const { interval, range } = useIntervalRange();
  const { data, isLoading } = useOrderAnalytics(interval, range);

  return (
    <Container className="flex flex-col">
      <div className="flex justify-between items-center">
        <Text size="large">Total Orders</Text>
        <a
          href={withOptionalAnalyticsRange(
            '/app/analytics#:~:text=Orders%20Over%20Time',
            range,
          )}
        >
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
            View more
          </Button>
        </a>
      </div>
      {isLoading ? (
        <div className="flex gap-4 justify-between flex-1">
          <div>
            <SmallCardSkeleton />
          </div>
          <Skeleton className="aspect-video w-64 mt-2.5" />
        </div>
      ) : (
        <div className="flex gap-4 justify-between flex-1">
          <div>
            <Text size="xlarge" weight="plus">
              {data?.total_orders || 0}
            </Text>
            <KPITimelineLabel
              percentage={(data?.prev_orders_percent ?? 0) / 100}
            />
          </div>

          <div className="flex-1 flex mt-2.5">
            <div className="aspect-video mt-auto w-full max-w-64 ml-auto">
              <LineChart
                data={data?.order_count}
                xAxisDataKey="name"
                yAxisDataKey="count"
                lineColor="#a1a1aa"
                hideTooltip
              />
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};
