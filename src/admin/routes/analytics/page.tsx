import { defineRouteConfig } from '@medusajs/admin-sdk';
import { Container, Heading, Tabs } from '@medusajs/ui';
import { ChartBar } from '@medusajs/icons';
import { useSearchParams } from 'react-router-dom';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { OrdersTab } from '../../components/analytics/OrdersTab';
import { ProductsTab } from '../../components/analytics/ProductsTab';
import { CustomersTab } from '../../components/analytics/CustomersTab';
import { useDateRangeParams } from '../../hooks/use-date-range-params';
import { useProductAnalytics } from '../../hooks/product-analytics';
import { useOrderAnalytics } from '../../hooks/order-analytics';
import { isDatePreset } from '../../lib/utils/date-range';
import { useCustomerAnalytics } from '../../hooks/customer-analytics';

const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { date, rangeParam, preset, updateDatePreset, handleDateRangeChange } =
    useDateRangeParams();

  const productQuery = useProductAnalytics(date);
  const orderQuery = useOrderAnalytics(
    isDatePreset(rangeParam) ? rangeParam : 'custom',
    date,
  );
  const customerQuery = useCustomerAnalytics(date);

  const isLoading =
    orderQuery.isLoading || productQuery.isLoading || customerQuery.isLoading;
  const activeTab = searchParams.get('tab') || 'orders';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    setSearchParams(params);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap gap-x-2 gap-y-4 items-center justify-between px-6 py-4">
        <Heading level="h1">Analytics</Heading>
        <DateRangeFilter
          value={date}
          preset={preset}
          onPresetChange={updateDatePreset}
          onRangeChange={handleDateRangeChange}
          isDisabled={isLoading}
        />
      </div>
      <div className="px-6 py-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Trigger value="orders" disabled={isLoading}>
              Orders
            </Tabs.Trigger>
            <Tabs.Trigger value="products" disabled={isLoading}>
              Products
            </Tabs.Trigger>
            <Tabs.Trigger value="customers" disabled={isLoading}>
              Customers
            </Tabs.Trigger>
          </Tabs.List>
          <div className="mt-8">
            <Tabs.Content value="orders">
              <OrdersTab />
            </Tabs.Content>
            <Tabs.Content value="products">
              <ProductsTab />
            </Tabs.Content>
            <Tabs.Content value="customers">
              <CustomersTab />
            </Tabs.Content>
          </div>
        </Tabs>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: 'Analytics',
  icon: ChartBar,
});

export default AnalyticsPage;
