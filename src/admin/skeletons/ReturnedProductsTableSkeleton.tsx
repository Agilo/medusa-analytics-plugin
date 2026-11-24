import * as React from 'react';
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
} from '@medusajs/ui';

import { Skeleton } from '../components/Skeleton';

const dummyData = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
  a: '',
  b: '',
  c: '',
  d: '',
  e: '',
}));

const columnHelper = createDataTableColumnHelper<(typeof dummyData)[0]>();

// One column per ReturnedProductsTable column.
const columns = (['a', 'b', 'c', 'd', 'e'] as const).map((key) =>
  columnHelper.accessor(key, {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
);

export const ReturnedProductsTableSkeleton = () => {
  const [search, setSearch] = React.useState<string>('');

  const table = useDataTable({
    columns,
    data: dummyData,
    getRowId: (row) => row.id,
    rowCount: dummyData.length,
    search: {
      state: search,
      onSearchChange: setSearch,
    },
  });

  // Same toolbar layout as ReturnedProductsTable, so nothing jumps on load.
  return (
    <DataTable instance={table}>
      <div className="flex items-center justify-end gap-2 mb-4">
        <DataTable.Search placeholder="Search..." />
      </div>
      <DataTable.Table />
    </DataTable>
  );
};
