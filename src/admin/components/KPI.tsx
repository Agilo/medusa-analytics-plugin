import * as React from 'react';
import { Button, Container, Text } from '@medusajs/ui';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { OrderAnalyticsResponse } from '../hooks/order-analytics';
import { CustomerAnalyticsResponse } from '../hooks/customer-analytics';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';

type KPIProps<T = OrderAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

export const TotalSales: React.FC<KPIProps> = ({ data, isLoading }) => {
  const top3Sales = data?.order_count
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return (
    <Container>
      <div className="flex justify-between items-center">
        <Text>Total Sales</Text>
        <a href="/http://localhost:9000/app/analytics?range=last-3-months#:~:text=Sales%20Over%20Time">
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

          <div className="aspect-video flex-1 mt-2.5 max-w-60">
            <BarChart
              data={top3Sales}
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
  const top3Sales = data?.order_sales
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  return (
    <Container className="relative">
      <div className="flex justify-between items-center">
        <Text>Total Orders</Text>
        <a href="/app/analytics?range=last-3-months#:~:text=Orders%20Over%20Time">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
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

            <div className="aspect-video flex-1 mt-2.5 max-w-60">
              <BarChart
                data={top3Sales}
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

export const AverageOrderValue: React.FC<KPIProps> = ({ isLoading, data }) => {
  return (
    <Container className="relative">
      <div className="flex justify-between items-center">
        <Text>Average order value</Text>
        <a href="/app/analytics?range=last-3-months#:~:text=Orders%20Over%20Time">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
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

export const ReturningCustomers: React.FC<
  KPIProps<CustomerAnalyticsResponse> & {
    specificTimeline?: string;
  }
> = ({ data, isLoading, specificTimeline }) => {
  return (
    <Container className="relative">
      <div className="flex justify-between items-center">
        <Text>
          Returning Customers{' '}
          {specificTimeline && (
            <span className="text-ui-fg-muted">({specificTimeline})</span>
          )}
        </Text>
        <a href="/app/analytics?tab=customers">
          <Button variant="transparent" className="text-ui-fg-muted text-xs">
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
