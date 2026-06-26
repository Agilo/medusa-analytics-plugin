import { User } from '@medusajs/icons';
import { ChartNoAxesCombined } from 'lucide-react';
import { BarChart } from '../BarChart';
import { StackedBarChart } from '../StackedBarChart';
import { ChartPanelCard, PanelCard, StatCard } from '../AnalyticsPanelCards';
import { CustomersTable } from '../CustomersTable';
import { CustomersTableSkeleton } from '../../skeletons/CustomerTableSkeleton';
import { useCustomerAnalytics } from '../../hooks/customer-analytics';
import { useOrderAnalytics } from '../../hooks/order-analytics';
import { formatAxisCurrency } from '../../lib/utils';
import { useDateRangeParams } from '../../hooks/use-date-range-params';
import { isDatePreset } from '../../lib/date-range';

export const CustomersTab = () => {
  const { date, rangeParam } = useDateRangeParams();

  const customerQuery = useCustomerAnalytics(date);
  const orderQuery = useOrderAnalytics(
    isDatePreset(rangeParam) ? rangeParam : 'custom',
    date,
  );

  const currency = customerQuery.data?.currency_code || 'EUR';

  const hasCustomerCounts = customerQuery.data?.customer_count?.some(
    (item) =>
      (item.new_customers || 0) > 0 || (item.returning_customers || 0) > 0,
  );

  const averageSalesPerCustomer =
    customerQuery.data?.total_customers &&
    customerQuery.data.total_customers > 0
      ? (orderQuery.data?.total_sales || 0) / customerQuery.data.total_customers
      : 0;

  return (
    <>
      <div className="flex max-md:flex-col gap-4 mb-4">
        <div className="space-y-4 flex-1">
          <StatCard
            label="Total Customers"
            icon={<User />}
            isLoading={customerQuery.isLoading}
            value={customerQuery.data?.total_customers || 0}
          />
          <StatCard
            label="New Customers"
            icon={<User />}
            isLoading={customerQuery.isLoading}
            value={customerQuery.data?.new_customers || 0}
          />
        </div>

        <div className="space-y-4 flex-1">
          <StatCard
            label="Returning Customers"
            icon={<User className="size-[15px]" />}
            isLoading={customerQuery.isLoading}
            value={customerQuery.data?.returning_customers || 0}
          />
          <StatCard
            label="Average Sales per Customer"
            icon={<ChartNoAxesCombined className="size-[15px]" />}
            isLoading={customerQuery.isLoading || orderQuery.isLoading}
            value={new Intl.NumberFormat(undefined, {
              currency,
              style: 'currency',
            }).format(averageSalesPerCustomer)}
          />
        </div>
      </div>

      <div className="flex max-md:flex-col gap-4 mb-4">
        <div className="flex-1">
          <ChartPanelCard
            title="New vs. Returning Customers"
            description="Distribution of new and returning customers in the selected period"
            isLoading={customerQuery.isLoading}
            isError={customerQuery.isError}
            errorMessage={customerQuery.error?.message}
            isEmpty={
              !customerQuery.data?.customer_count?.length || !hasCustomerCounts
            }
          >
            <StackedBarChart
              data={customerQuery.data?.customer_count ?? []}
              xAxisDataKey="name"
              lineColor="#82ca9d"
              useStableColors
              colorKeyField="returning_customers"
              dataKeys={['new_customers', 'returning_customers']}
            />
          </ChartPanelCard>
        </div>
        <div className="flex-1">
          <ChartPanelCard
            title="Top Customer Groups by Sales"
            description="Sales breakdown by customer group in the selected period"
            isLoading={customerQuery.isLoading}
            isError={customerQuery.isError}
            errorMessage={customerQuery.error?.message}
            isEmpty={!customerQuery.data?.customer_group?.length}
          >
            <BarChart
              data={customerQuery.data?.customer_group ?? []}
              xAxisDataKey="name"
              lineColor="#82ca9d"
              useStableColors
              colorKeyField="name"
              yAxisDataKey="total"
              yAxisTickFormatter={(value) =>
                formatAxisCurrency(value, currency)
              }
            />
          </ChartPanelCard>
        </div>
      </div>

      <div className="flex gap-4 max-xl:flex-col">
        <PanelCard
          title="Top Customers by Sales"
          description="Customers by sales in the selected period"
        >
          {customerQuery.isLoading ? (
            <CustomersTableSkeleton />
          ) : (
            <CustomersTable
              customers={customerQuery.data?.customer_sales || []}
              currencyCode={currency}
            />
          )}
        </PanelCard>
      </div>
    </>
  );
};
