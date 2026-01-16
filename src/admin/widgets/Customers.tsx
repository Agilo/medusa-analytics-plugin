import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { ReturningCustomers } from '../components/KPI';
import {
  NewVsReturningCustomers,
  TopCustomerGroupBySales,
} from '../components/Charts';
import { useIntervalRange } from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';

const CustomerWidget = () => {
  const { interval, onIntervalChange, range } = useIntervalRange();
  const { data: customers, isLoading } = useCustomerAnalytics(range);

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
        <ReturningCustomers data={customers} isLoading={isLoading} />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
