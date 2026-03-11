import * as React from "react";
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Skeleton } from "../components/Skeleton";

const dummyData = [
  {
    a: "a",
    b: "b",
    c: 0,
  },
  {
    a: "a",
    b: "b",
    c: 0,
  },
  {
    a: "a",
    b: "b",
    c: 0,
  },
  {
    a: "a",
    b: "b",
    c: 0,
  },
  {
    a: "a",
    b: "b",
    c: 0,
  },
  {
    a: "a",
    b: "b",
    c: 0,
  },
];

const columnHelper = createDataTableColumnHelper<(typeof dummyData)[0]>();

const columns = [
  columnHelper.accessor("a", {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
  columnHelper.accessor("b", {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
  columnHelper.accessor("c", {
    header: () => null,
    cell: () => <Skeleton className="w-full h-5" />,
  }),
];

export const ProductsTableSkeleton = () => {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState<string>("");

  const table = useDataTable({
    columns,
    data: dummyData,
    getRowId: (product) => product.a,
    rowCount: dummyData.length,
    search: {
      state: search,
      onSearchChange: setSearch,
    },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="px-0 pt-0">
        <DataTable.Search placeholder={t("analytics.table.search")} />
      </DataTable.Toolbar>
      <DataTable.Table />
    </DataTable>
  );
};
