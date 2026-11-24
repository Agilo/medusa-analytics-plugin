import * as React from 'react';
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
} from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';
import type { ReturnAnalyticsResponse } from '../lib/data/return-analytics';

type ReturnedProduct = ReturnAnalyticsResponse['returned_variants'][number];

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
    header: 'Returned quantity',
    enableSorting: true,
    sortLabel: 'Returned quantity',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
  }),
  columnHelper.accessor('sold_quantity', {
    header: 'Sold quantity',
    enableSorting: true,
    sortLabel: 'Sold quantity',
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

const PAGE_SIZE = 10;

export const ReturnedProductsTable: React.FC<ReturnedProductsTableProps> = ({
  products,
}) => {
  const [pagination, setPagination] = React.useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  });

  const [search, setSearch] = React.useState<string>('');

  const [sorting, setSorting] = React.useState<DataTableSortingState | null>(
    null,
  );

  const navigate = useNavigate();

  // Search and sort the whole list; pagination counts and slices this list.
  // Without a sort, rows keep the API order (most returned first).
  const filteredProducts = React.useMemo(() => {
    let filtered = products.filter((product) =>
      product.title.toLowerCase().includes(search.toLowerCase()),
    );

    if (sorting && sorting.id) {
      const id = sorting.id as keyof ReturnedProduct;
      filtered = filtered.slice().sort((a, b) => {
        const aVal = a[id] ?? '';
        const bVal = b[id] ?? '';
        if (aVal < bVal) return sorting.desc ? 1 : -1;
        if (aVal > bVal) return sorting.desc ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }, [products, search, sorting]);

  const shownProducts = React.useMemo(
    () =>
      filteredProducts.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [filteredProducts, pagination],
  );

  // A new search starts on the first page.
  const handleSearchChange = React.useCallback((value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, []);

  // Keep the page in range when the list shrinks (e.g. a new date range).
  React.useEffect(() => {
    const lastPageIndex = Math.max(
      0,
      Math.ceil(filteredProducts.length / pagination.pageSize) - 1,
    );
    if (pagination.pageIndex > lastPageIndex) {
      setPagination((current) => ({ ...current, pageIndex: lastPageIndex }));
    }
  }, [filteredProducts.length, pagination.pageIndex, pagination.pageSize]);

  const table = useDataTable({
    columns,
    data: shownProducts,
    // Custom line items have no variant, so fall back to the title + position.
    getRowId: (product, index) =>
      product.variant_id ?? `${product.title}-${index}`,
    rowCount: filteredProducts.length,
    search: {
      state: search,
      onSearchChange: handleSearchChange,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
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
      <div className="flex items-center justify-end gap-2 mb-4">
        <DataTable.Search placeholder="Search..." />
        <DataTable.SortingMenu />
      </div>
      <DataTable.Table
        emptyState={{
          filtered: {
            heading: 'No returned products found',
          },
          empty: {
            heading: 'No returned products available',
          },
        }}
      />
      {filteredProducts.length > PAGE_SIZE && <DataTable.Pagination />}
    </DataTable>
  );
};
