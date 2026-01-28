import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { AverageSalesPerCustomer } from '../components/KPI';
import {
  NewVsReturningCustomers,
  TopCustomerGroupBySales,
} from '../components/Charts';
import {
  useIntervalRange,
  withIntervalRange,
} from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';

const CustomerWidget = withIntervalRange(() => {
  const { range } = useIntervalRange();
  const { data: customers, isLoading } = useCustomerAnalytics(range);

  return (
    <>
      <div className="flex justify-end">
        <SelectInterval />
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <NewVsReturningCustomers data={customers} isLoading={isLoading} />
        <TopCustomerGroupBySales data={customers} isLoading={isLoading} />
        <AverageSalesPerCustomer />
      </div>
    </>
  );
});

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
