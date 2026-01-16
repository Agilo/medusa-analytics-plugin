import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useOrderAnalytics } from '../hooks/order-analytics';
import { AverageOrderValue, TotalOrders, TotalSales } from '../components/KPI';
import { useIntervalRange } from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';

const OrderWidget = () => {
  const { interval, onIntervalChange, range } = useIntervalRange();
  const { data: orders, isLoading } = useOrderAnalytics(interval, range);

  return (
    <>
      <div className="flex justify-end">
        <SelectInterval
          interval={interval}
          onIntervalChange={onIntervalChange}
        />
      </div>

      <div className="flex flex-col items-stretch md:flex-row gap-4">
        <TotalSales data={orders} isLoading={isLoading} />
        <TotalOrders data={orders} isLoading={isLoading} />
        <AverageOrderValue data={orders} isLoading={isLoading} />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: 'order.list.before',
});

export default OrderWidget;
