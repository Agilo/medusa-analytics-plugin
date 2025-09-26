import * as React from 'react';
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
} from '@medusajs/ui';

import { Skeleton } from '../components/Skeleton';

const dummyData = [
  {
    a: 'a',
    b: 'b',
    c: 0,
    d: 0,
    e: new Date(),
  },
  {
    a: 'a',
    b: 'b',
    c: 0,
    d: 0,
    e: new Date(),
  },
  {
    a: 'a',
    b: 'b',
    c: 0,
    d: 0,
    e: new Date(),
  },
  {
    a: 'a',
    b: 'b',
    c: 0,
    d: 0,
    e: new Date(),
  },
  {
    a: 'a',
    b: 'b',
    c: 0,
    d: 0,
    e: new Date(),
  },
  {
    a: 'a',
    b: 'b',
    c: 0,
    d: 0,
    e: new Date(),
  },
];

const columnHelper = createDataTableColumnHelper<(typeof dummyData)[0]>();

const columns = [
  columnHelper.accessor('a', {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
  columnHelper.accessor('b', {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
  columnHelper.accessor('c', {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
  columnHelper.accessor('d', {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
  columnHelper.accessor('e', {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
];

export const CustomersTableSkeleton = () => {
  const [search, setSearch] = React.useState<string>('');

  const table = useDataTable({
    columns,
    data: dummyData,
    getRowId: (customer) => customer.a,
    rowCount: dummyData.length,
    search: {
      state: search,
      onSearchChange: setSearch,
    },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="px-0 pt-0">
        <DataTable.Search placeholder="Search..." />
      </DataTable.Toolbar>
      <DataTable.Table />
    </DataTable>
  );
};
