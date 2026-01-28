import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { AverageSalesPerCustomer } from '../components/KPI';
import {
  NewVsReturningCustomers,
  TopCustomerGroupBySales,
} from '../components/Charts';
import { useIntervalRange } from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';
import { useOrderAnalytics } from '../hooks/order-analytics';

const CustomerWidget = () => {
  const { interval, onIntervalChange, range } = useIntervalRange();
  const { data: customers, isLoading } = useCustomerAnalytics(range);
  const { data: orders, isLoading: isLoadingOrders } = useOrderAnalytics(
    interval,
    range,
  );

  return (
    <>
      <div className="flex justify-end">
        <SelectInterval
          interval={interval}
          onIntervalChange={onIntervalChange}
        />
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <NewVsReturningCustomers data={customers} isLoading={isLoading} />
        <TopCustomerGroupBySales data={customers} isLoading={isLoading} />

        <AverageSalesPerCustomer
          data={{ customersData: customers, ordersData: orders }}
          isLoading={isLoading || isLoadingOrders}
        />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
