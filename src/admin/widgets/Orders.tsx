import * as React from 'react';
import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { Select } from '@medusajs/ui';
import { useOrderAnalytics } from '../hooks/order-analytics';
import { twJoin } from 'tailwind-merge';
import { AverageOrderValue, TotalOrders, TotalSales } from '../components/KPI';

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
      <div className="flex items-center justify-end mb-4">
        <Select
          size="small"
          value={interval}
          onValueChange={(value) => {
            if (value === '30-days-ago') {
              setInterval('30-days-ago');
              setRange({
                from: daysPrior30,
                to: today,
              });
            } else {
              setInterval('60-days-ago');
              setRange({
                from: daysPrior60,
                to: today,
              });
            }
          }}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="30-days-ago">Last 30 Days</Select.Item>
            <Select.Item value="60-days-ago">Last 60 Days</Select.Item>
          </Select.Content>
          {/* <TimelineVertical
              className={
                interval === '60-days-ago' ? 'text-ui-fg-muted' : undefined
              }
            /> */}
        </Select>
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
