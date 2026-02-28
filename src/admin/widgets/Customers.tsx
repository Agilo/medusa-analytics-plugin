import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { AverageSalesPerCustomer } from '../components/Charts';
import {
  NewVsReturningCustomers,
  TopCustomerGroupBySales,
} from '../components/Charts';
import { IntervalRangeContextProvider } from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';

const CustomerWidget = () => {
  return (
    <IntervalRangeContextProvider>
      <div className="flex justify-end">
        <SelectInterval />
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <NewVsReturningCustomers />
        <TopCustomerGroupBySales />
        <AverageSalesPerCustomer />
      </div>
    </IntervalRangeContextProvider>
  );
};

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
