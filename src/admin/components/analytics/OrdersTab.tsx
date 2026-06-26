import { ShoppingCart } from '@medusajs/icons';
import { ChartNoAxesCombined } from 'lucide-react';
import { LineChart } from '../LineChart';
import { BarChart } from '../BarChart';
import { PieChart } from '../PieChart';
import { ChartPanelCard, StatCard } from '../AnalyticsPanelCards';
import { formatAxisCurrency } from '../../lib/utils';
import { useOrderAnalytics } from '../../hooks/order-analytics';
import { isDatePreset } from '../../lib/date-range';
import { useDateRangeParams } from '../../hooks/use-date-range-params';

export const OrdersTab = () => {
  const { date, rangeParam } = useDateRangeParams();
  const { data, isLoading, isError, error } = useOrderAnalytics(
    isDatePreset(rangeParam) ? rangeParam : 'custom',
    date,
  );
  const currency = data?.currency_code || 'EUR';

  const hasOrderCounts = data?.order_count?.some((item) => item.count > 0);
  const hasOrderSales = data?.order_sales?.some((item) => item.sales > 0);

  return (
    <>
      <div className="flex max-md:flex-col gap-4 mb-4">
        <div className="space-y-4 flex-1">
          <StatCard
            label="Total Orders"
            icon={<ShoppingCart />}
            isLoading={isLoading}
            value={data?.total_orders || 0}
            trend={data?.prev_orders_percent || 0}
          />

          <ChartPanelCard
            title="Orders Over Time"
            description="Total number of orders in the selected period"
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.message}
            isEmpty={!data?.order_count?.length || !hasOrderCounts}
          >
            <LineChart
              data={data?.order_count}
              xAxisDataKey="name"
              yAxisDataKey="count"
            />
          </ChartPanelCard>
        </div>

        <div className="space-y-4 flex-1">
          <StatCard
            label="Total Sales"
            icon={<ChartNoAxesCombined className="size-[15px]" />}
            isLoading={isLoading}
            value={new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency,
            }).format(data?.total_sales || 0)}
            trend={data?.prev_sales_percent || 0}
          />

          <ChartPanelCard
            title="Sales Over Time"
            description={
              <>Total sales in the selected period ({data?.currency_code})</>
            }
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.message}
            isEmpty={!data?.order_sales?.length || !hasOrderSales}
          >
            <LineChart
              data={data?.order_sales ?? []}
              xAxisDataKey="name"
              yAxisDataKey="sales"
              lineColor="#82ca9d"
              yAxisTickFormatter={(value) =>
                formatAxisCurrency(value, currency)
              }
            />
          </ChartPanelCard>
        </div>
      </div>

      <div className="flex max-md:flex-col gap-4">
        <div className="flex-1">
          <ChartPanelCard
            title="Top Regions by Sales"
            description="Sales breakdown by region in the selected period"
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.message}
            isEmpty={!data?.regions?.length}
          >
            <BarChart
              data={data?.regions ?? []}
              xAxisDataKey="name"
              yAxisDataKey="sales"
              lineColor="#82ca9d"
              useStableColors
              colorKeyField="name"
              yAxisTickFormatter={(value) =>
                formatAxisCurrency(value, currency)
              }
            />
          </ChartPanelCard>
        </div>
        <div className="flex-1">
          <ChartPanelCard
            title="Order Status Breakdown"
            description="Distribution of orders by status in the selected period"
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.message}
            isEmpty={!data?.statuses?.length}
          >
            <PieChart data={data?.statuses} dataKey="count" />
          </ChartPanelCard>
        </div>
      </div>
    </>
  );
};
