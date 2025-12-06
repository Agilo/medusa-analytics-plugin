import * as React from 'react';
import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { Button, Container, Text } from '@medusajs/ui';
import {
  OrderAnalyticsResponse,
  useOrderAnalytics,
} from '../hooks/order-analytics';
import { TimelineVertical } from '@medusajs/icons';
import { twJoin } from 'tailwind-merge';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { BarChart } from '../components/BarChart';

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));
const daysPrior60 = new Date(new Date().setDate(today.getDate() - 60));

const OrderWidget = () => {
  const [interval, setInterval] = React.useState<'30-days-ago' | '60-days-ago'>(
    '30-days-ago',
  );
  const [range, setRange] = React.useState({
    from: daysPrior30,
    to: today,
  });
  const { data: orders, isLoading } = useOrderAnalytics(interval, range);

  return (
    <>
      <div className="flex items-center justify-between w-full mt-6 mb-4">
        <h1 className="xl:text-3xl text-2xl font-medium">Order insights</h1>

        <div className="flex items-center gap-3">
          <p
            className={twJoin(
              'ml-auto text-sm',
              interval === '60-days-ago' ? 'text-ui-fg-muted' : undefined,
            )}
          >
            {interval === '30-days-ago' ? 'Last 30 Days' : 'Last 60 Days'}
          </p>

          <Button
            variant="secondary"
            className="p-2.5 size-9"
            onClick={() => {
              if (interval === '30-days-ago') {
                setInterval('60-days-ago');
                setRange({
                  from: daysPrior60,
                  to: today,
                });
                return;
              }
              setInterval('30-days-ago');
              setRange({
                from: daysPrior30,
                to: today,
              });
            }}
          >
            <TimelineVertical
              className={
                interval === '60-days-ago' ? 'text-ui-fg-muted' : undefined
              }
            />
          </Button>
        </div>
      </div>

      <AverageOrderValue data={orders} isLoading={isLoading} />
      <div className="flex items-center flex-col md:flex-row gap-4">
        <TotalSales data={orders} isLoading={isLoading} />
        <TotalOrders data={orders} isLoading={isLoading} />
      </div>
    </>
  );
};

type KPIProps<T = OrderAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

const AverageOrderValue: React.FC<KPIProps> = ({ isLoading, data }) => {
  return (
    <Container className="relative">
      <div className="flex justify-between items-center">
        <Text size="large">Average order value</Text>
        <a href="/app/analytics?range=this-month&tab=orders#:~:text=Orders%20Over%20Time">
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
            {data?.total_sales && data?.total_orders
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: data?.currency_code || 'EUR',
                }).format(Math.round(data?.total_sales / data?.total_orders))
              : new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: data?.currency_code || 'EUR',
                }).format(0)}
          </Text>
        </>
      )}
    </Container>
  );
};

const TotalSales: React.FC<KPIProps> = ({ data, isLoading }) => {
  const topThreeSales = data?.order_count
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return (
    <Container>
      <div className="flex justify-between items-center">
        <Text>Total Sales</Text>
        <a href="/app/analytics#:~:text=Sales%20Over%20Time">
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
            <BarChart
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

const TotalOrders: React.FC<KPIProps> = ({ isLoading, data }) => {
  const topThreeOrders = data?.order_sales
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  return (
    <Container className="relative">
      <div className="flex justify-between items-center">
        <Text>Total Orders</Text>
        <a href="/app/analytics?range=2025-09-01-2025-11-30#:~:text=Orders%20Over%20Time">
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
              <BarChart
                data={topThreeOrders}
                xAxisDataKey="name"
                yAxisDataKey="sales"
                lineColor="#82ca9d"
              />
            </div>
          </div>
        </>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: 'order.list.before',
});

export default OrderWidget;
