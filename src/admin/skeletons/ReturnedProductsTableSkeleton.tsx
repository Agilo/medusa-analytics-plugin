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
}));

const columnHelper = createDataTableColumnHelper<(typeof dummyData)[0]>();

const columns = (['a', 'b', 'c', 'd'] as const).map((key) =>
  columnHelper.accessor(key, {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
);

export const ReturnedProductsTableSkeleton = () => {
  const table = useDataTable({
    columns,
    data: dummyData,
    getRowId: (row) => row.id,
    rowCount: dummyData.length,
  });

  return (
    <DataTable instance={table}>
      <DataTable.Table />
    </DataTable>
  );
};
