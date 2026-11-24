import * as React from 'react';
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
  DataTableSortingState,
} from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';
import type { ReturnAnalyticsResponse } from '../lib/data/return-analytics';

type ReturnedProduct = ReturnAnalyticsResponse['top_returned_variants'][0];

type ReturnedProductsTableProps = {
  products: ReturnedProduct[];
};

const columnHelper = createDataTableColumnHelper<ReturnedProduct>();

const columns = [
  columnHelper.accessor('title', {
    header: 'Product',
    enableSorting: true,
    sortLabel: 'Product',
    sortAscLabel: 'A-Z',
    sortDescLabel: 'Z-A',
  }),
  columnHelper.accessor('returned_quantity', {
    header: 'Returned qty',
    enableSorting: true,
    sortLabel: 'Returned qty',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
  }),
  columnHelper.accessor('sold_quantity', {
    header: 'Sold qty',
    enableSorting: true,
    sortLabel: 'Sold qty',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
  }),
  columnHelper.accessor('return_rate', {
    header: 'Return rate',
    enableSorting: true,
    sortLabel: 'Return rate',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
    cell: ({ getValue }) => `${getValue()}%`,
  }),
];

export const ReturnedProductsTable: React.FC<ReturnedProductsTableProps> = ({
  products,
}) => {
  const [sorting, setSorting] = React.useState<DataTableSortingState | null>(
    null,
  );
  const navigate = useNavigate();

  const shownProducts = React.useMemo(() => {
    if (!sorting?.id) {
      return products;
    }
    const id = sorting.id as keyof ReturnedProduct;
    return products.slice().sort((a, b) => {
      const aVal = a[id] ?? '';
      const bVal = b[id] ?? '';
      if (aVal < bVal) return sorting.desc ? 1 : -1;
      if (aVal > bVal) return sorting.desc ? -1 : 1;
      return 0;
    });
  }, [products, sorting]);

  const table = useDataTable({
    columns,
    data: shownProducts,
    getRowId: (product) => product.variant_id ?? product.title,
    rowCount: products.length,
    sorting: {
      state: sorting,
      onSortingChange: setSorting,
    },
    onRowClick: (_, row) => {
      // DataTable passes the TanStack row at runtime (typed as the data item).
      const { product_id, variant_id } = (
        row as unknown as { original: ReturnedProduct }
      ).original;
      if (product_id && variant_id) {
        navigate(`/products/${product_id}/variants/${variant_id}`);
      }
    },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Table
        emptyState={{
          empty: {
            heading: 'No returned products available',
          },
        }}
      />
    </DataTable>
  );
};
