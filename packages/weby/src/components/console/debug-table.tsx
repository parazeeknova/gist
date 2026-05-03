import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { useTheme } from "../../hooks/use-theme";
import { useDebugTableData } from "../../hooks/use-console-mutations";
import { Check } from "./check";

const columnHelper = createColumnHelper<Record<string, unknown>>();

interface DebugTableProps {
  tableName: string;
}

export const DebugTable = ({ tableName }: DebugTableProps) => {
  const { isDarkMode } = useTheme();
  const { data, isPending, isError } = useDebugTableData(tableName);
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(() => {
    if (!data) {
      return [];
    }
    const dataCols = data.columns.map((col) =>
      columnHelper.accessor((row) => row[col], {
        cell: (info) => {
          const val = info.getValue();
          if (val === null || val === undefined) {
            return <span className="opacity-30">null</span>;
          }
          const str = typeof val === "string" ? val : JSON.stringify(val);
          if (str.length > 120) {
            return <span title={str}>{str.slice(0, 120)}...</span>;
          }
          return str;
        },
        header: () => col,
        id: col,
      }),
    );
    return [
      columnHelper.display({
        cell: ({ row }) => (
          <Check checked={row.getIsSelected()} onChange={() => row.toggleSelected()} />
        ),
        header: ({ table }) => {
          const isAllSelected = table.getIsAllRowsSelected();
          const isSomeSelected = table.getIsSomeRowsSelected();
          return (
            <Check
              checked={isAllSelected}
              indeterminate={isSomeSelected && !isAllSelected}
              onChange={() => table.toggleAllRowsSelected()}
            />
          );
        },
        id: "__select__",
        maxSize: 36,
        minSize: 36,
        size: 36,
      }),
      ...dataCols,
    ];
  }, [data]);

  const rows = useMemo(() => data?.rows ?? [], [data]);

  const table = useReactTable({
    columnResizeMode: "onChange",
    columns,
    data: rows,
    defaultColumn: {
      minSize: 100,
      size: 160,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (_row, index) => String(index),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const columnBorder = isDarkMode ? "#333" : "#ccc";
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div
        className={`shrink-0 px-4 py-2 border-b lowercase text-[12px] ${t("border-border-dark text-text-dark/70", "border-border-light text-text-light/70")}`}
      >
        {tableName}
        {(() => {
          if (!data) {
            return "";
          }
          if (selectedCount > 0) {
            return ` (${rows.length} rows, ${selectedCount} selected)`;
          }
          return ` (${rows.length} rows)`;
        })()}
      </div>

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {(() => {
          if (isPending) {
            return (
              <div
                className={`flex items-center justify-center h-32 text-[11px] ${t("text-text-dark/30", "text-text-light/30")}`}
              >
                loading...
              </div>
            );
          }
          if (isError) {
            return (
              <div className="flex items-center justify-center h-32 text-[11px] text-red-400">
                failed to load table data
              </div>
            );
          }
          return (
            <table
              className="border-separate border-spacing-0"
              style={{ width: table.getCenterTotalSize() }}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`sticky top-0 z-10 py-1.5 text-[11px] lowercase font-medium text-left border-b transition-colors duration-500 ease-out ${header.id === "__select__" ? "pl-2.5 pr-3 text-center" : "px-3"} ${t("border-border-dark bg-[#171717]", "border-border-light bg-[#e8e8e8]")}`}
                        style={{
                          borderRight: `1px solid ${columnBorder}`,
                          position: "relative",
                          width: header.getSize(),
                        }}
                      >
                        <span className={t("text-text-dark/50", "text-text-light/50")}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanResize() && (
                          <div
                            aria-label="Resize column"
                            role="separator"
                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-colors ${
                              header.column.getIsResizing()
                                ? "bg-blue-400/50"
                                : `${t("bg-white/0 hover:bg-white/10", "bg-black/0 hover:bg-black/10")}`
                            }`}
                            onDoubleClick={() => header.column.resetSize()}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            style={{
                              transform: header.column.getIsResizing()
                                ? `translateX(${table.getState().columnSizingInfo.deltaOffset ?? 0}px)`
                                : undefined,
                            }}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length || 1}
                      className={`px-3 py-4 text-[11px] text-center ${t("text-text-dark/30", "text-text-light/30")}`}
                    >
                      no rows
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.getIsSelected() ? t("bg-neutral-500/10", "bg-neutral-500/15") : ""
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`px-3 py-1.5 text-[11px] truncate border-b transition-colors duration-500 ease-out ${cell.column.id === "__select__" ? "pl-2.5 pr-1" : ""} ${t("border-border-dark/50 hover:bg-white/3 text-text-dark/80", "border-border-light/50 hover:bg-black/3 text-text-light/80")}`}
                          style={{
                            borderRight: `1px solid ${columnBorder}`,
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
};
