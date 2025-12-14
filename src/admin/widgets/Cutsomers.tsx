import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useCustomerAnalytics } from '../hooks/customer-analytics';
import { ReturningCustomers } from '../components/KPI';
import {
  NewVsReturningCustomers,
  TopCustomerGroupBySales,
} from '../components/Charts';

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));
const daysPrior90 = new Date(new Date().setDate(today.getDate() - 90));

const CustomerWidget = () => {
  const { data: customersLast30Days, isLoading: isLoadingLast30Days } =
    useCustomerAnalytics({
      from: daysPrior30,
      to: today,
    });

  // Getting data for the last 90 days for returning customers rate
  const { data: customersLast90Days, isLoading: isLoadingLast90Days } =
    useCustomerAnalytics({
      from: daysPrior90,
      to: today,
    });

  return (
    <>
      <h1 className="xl:text-3xl text-2xl mt-6 mb-4 font-medium">
        Customer insights
      </h1>
      <div className="flex gap-4 flex-col lg:flex-row">
        <NewVsReturningCustomers
          data={customersLast30Days}
          isLoading={isLoadingLast30Days}
        />

        {/* Defined to be the last 90 days for returning customers */}
        <TopCustomerGroupBySales
          data={customersLast30Days}
          isLoading={isLoadingLast30Days}
        />
        <ReturningCustomers
          data={customersLast90Days}
          isLoading={isLoadingLast90Days}
        />
      </div>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: 'customer.list.before',
});

export default CustomerWidget;
