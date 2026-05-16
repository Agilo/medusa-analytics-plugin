import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { AverageOrderValue, TotalOrders, TotalSales } from '../components/KPI';
import { SelectInterval } from '../components/SelectInterval';
import { IntervalRangeContextProvider } from '../hooks/use-interval-range';

const OrderWidget = () => {
  return (
    <IntervalRangeContextProvider>
      <div className="flex justify-end">
        <SelectInterval />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <TotalSales />
        <TotalOrders />
        <AverageOrderValue />
      </div>
    </IntervalRangeContextProvider>
  );
};

export const config = defineWidgetConfig({
  zone: 'order.list.before',
});

export default OrderWidget;
