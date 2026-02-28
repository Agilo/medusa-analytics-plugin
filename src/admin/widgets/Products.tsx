import { defineWidgetConfig } from '@medusajs/admin-sdk';
import {
  LowStockVariants,
  TopSellingProducts,
  BottomSellingProducts,
} from '../components/Charts';
import { IntervalRangeContextProvider } from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';

export const ProductWidget = () => {
  return (
    <IntervalRangeContextProvider>
      <div className="flex justify-end">
        <SelectInterval />
      </div>

      <div className="flex gap-4 flex-col lg:flex-row items-stretch">
        <TopSellingProducts />
        <LowStockVariants />
        <BottomSellingProducts />
      </div>
    </IntervalRangeContextProvider>
  );
};

export const config = defineWidgetConfig({
  zone: 'product.list.before',
});

export default ProductWidget;
