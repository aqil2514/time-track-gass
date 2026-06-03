// /* eslint-disable react-hooks/incompatible-library */
// "use client";

// import * as React from "react";
// import {
//   ColumnDef,
//   flexRender,
//   getCoreRowModel,
//   useReactTable,
//   RowSelectionState,
// } from "@tanstack/react-table";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Checkbox } from "@/components/ui/checkbox";

// interface DataTableProps<TData, TValue> {
//   columns: ColumnDef<TData, TValue>[];
//   data: TData[];
//   emptyMessage?: string;

//   // Opsional — hanya kalau butuh seleksi
//   enableRowSelection?: boolean;
//   onRowSelectionChange?: (selectedRows: TData[]) => void;
// }

// export function DataTable<TData, TValue>({
//   columns,
//   data,
//   emptyMessage = "No results found.",
//   enableRowSelection = false,
//   onRowSelectionChange,
// }: DataTableProps<TData, TValue>) {
//   const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

//   // Inject kolom checkbox secara otomatis kalau selection aktif
//   const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
//     if (!enableRowSelection) return columns;

//     const selectColumn: ColumnDef<TData, TValue> = {
//       id: "select",
//       header: ({ table }) => (
//         <Checkbox
//           checked={
//             table.getIsAllPageRowsSelected() ||
//             (table.getIsSomePageRowsSelected() && "indeterminate")
//           }
//           onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//           aria-label="Select all"
//           className="cursor-pointer"
//         />
//       ),
//       cell: ({ row }) => (
//         <Checkbox
//           checked={row.getIsSelected()}
//           disabled={!row.getCanSelect()}
//           onCheckedChange={(value) => row.toggleSelected(!!value)}
//           aria-label="Select row"
//           className="cursor-pointer"
//         />
//       ),
//       size: 40,
//       enableSorting: false,
//       enableHiding: false,
//     };

//     return [selectColumn, ...columns];
//   }, [columns, enableRowSelection]);

//   const table = useReactTable({
//     data,
//     columns: tableColumns,
//     state: { rowSelection },
//     enableRowSelection,
//     onRowSelectionChange: (updater) => {
//       const next =
//         typeof updater === "function" ? updater(rowSelection) : updater;
//       setRowSelection(next);

//       // Panggil callback dengan data original yang terseleksi
//       if (onRowSelectionChange) {
//         const selectedData = Object.keys(next)
//           .filter((key) => next[key])
//           .map((key) => data[Number(key)]);
//         onRowSelectionChange(selectedData);
//       }
//     },
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
//       <Table>
//         <TableHeader className="bg-slate-800/50 border-b border-slate-800">
//           {table.getHeaderGroups().map((headerGroup) => (
//             <TableRow
//               key={headerGroup.id}
//               className="border-slate-800 hover:bg-transparent"
//             >
//               {headerGroup.headers.map((header) => (
//                 <TableHead key={header.id} className="text-slate-400 py-4 px-4">
//                   {header.isPlaceholder
//                     ? null
//                     : flexRender(
//                         header.column.columnDef.header,
//                         header.getContext(),
//                       )}
//                 </TableHead>
//               ))}
//             </TableRow>
//           ))}
//         </TableHeader>
//         <TableBody>
//           {table.getRowModel().rows?.length ? (
//             table.getRowModel().rows.map((row) => (
//               <TableRow
//                 key={row.id}
//                 data-state={row.getIsSelected() && "selected"}
//                 className="border-slate-800 hover:bg-slate-800/20 transition-colors data-[state=selected]:bg-slate-800/40"
//               >
//                 {row.getVisibleCells().map((cell) => (
//                   <TableCell
//                     key={cell.id}
//                     className="py-4 px-4 text-slate-300 text-sm"
//                   >
//                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                   </TableCell>
//                 ))}
//               </TableRow>
//             ))
//           ) : (
//             <TableRow>
//               <TableCell
//                 colSpan={tableColumns.length}
//                 className="h-32 text-center text-slate-500 italic"
//               >
//                 {emptyMessage}
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }

/* eslint-disable react-hooks/incompatible-library */
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  HeaderContext,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;

  // Row selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  // Sorting
  enableSorting?: boolean;

  // Filtering
  enableFiltering?: boolean;
  filterPlaceholder?: string;
  globalFilterColumn?: string; // kolom spesifik yang ingin di-filter, default ke global
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results found.",
  enableRowSelection = false,
  onRowSelectionChange,
  enableSorting = false,
  enableFiltering = false,
  filterPlaceholder = "Search...",
  globalFilterColumn,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Inject kolom checkbox secara otomatis kalau selection aktif
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const enriched: ColumnDef<TData, TValue>[] = enableSorting
      ? columns.map((col): ColumnDef<TData, TValue> => {
          if (col.enableSorting === false) return col;

          return {
            ...col,
            header: (ctx: HeaderContext<TData, TValue>) => {
              const isSorted = ctx.column.getIsSorted();
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 gap-1.5"
                  onClick={() => ctx.column.toggleSorting(isSorted === "asc")}
                >
                  {typeof col.header === "string"
                    ? col.header
                    : typeof col.header === "function"
                      ? flexRender(col.header, ctx)
                      : null}
                  {isSorted === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : isSorted === "desc" ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                  )}
                </Button>
              );
            },
          } as ColumnDef<TData, TValue>; // ← cast di sini, bukan di return type arrow fn
        })
      : columns;

    if (!enableRowSelection) return enriched;

    const selectColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="cursor-pointer"
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    };

    return [selectColumn, ...enriched];
  }, [columns, enableRowSelection, enableSorting]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      rowSelection,
      ...(enableSorting && { sorting }),
      ...(enableFiltering &&
        (globalFilterColumn ? { columnFilters } : { globalFilter })),
    },
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);

      if (onRowSelectionChange) {
        const selectedData = Object.keys(next)
          .filter((key) => next[key])
          .map((key) => data[Number(key)]);
        onRowSelectionChange(selectedData);
      }
    },
    ...(enableSorting && {
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
    }),
    ...(enableFiltering &&
      (globalFilterColumn
        ? {
            onColumnFiltersChange: setColumnFilters,
            getFilteredRowModel: getFilteredRowModel(),
          }
        : {
            onGlobalFilterChange: setGlobalFilter,
            getFilteredRowModel: getFilteredRowModel(),
          })),
    getCoreRowModel: getCoreRowModel(),
  });

  // Nilai filter yang aktif saat ini
  const filterValue = globalFilterColumn
    ? ((table.getColumn(globalFilterColumn)?.getFilterValue() as string) ?? "")
    : globalFilter;

  const handleFilterChange = (value: string) => {
    if (globalFilterColumn) {
      table.getColumn(globalFilterColumn)?.setFilterValue(value);
    } else {
      setGlobalFilter(value);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter input */}
      {enableFiltering && (
        <Input
          placeholder={filterPlaceholder}
          value={filterValue}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="max-w-sm bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-slate-600"
        />
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/50 border-b border-slate-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-slate-800 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-400 py-4 px-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-slate-800 hover:bg-slate-800/20 transition-colors data-[state=selected]:bg-slate-800/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 px-4 text-slate-300 text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-32 text-center text-slate-500 italic"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
