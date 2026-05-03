import { useMemo, useState } from "react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  PlusIcon,
  FloppyDiskIcon,
  CaretUpDownIcon,
  TrashIcon,
  CopyIcon,
} from "@phosphor-icons/react";
import { useTheme } from "../../hooks/use-theme";
import { useDebugTableData } from "../../hooks/use-console-mutations";
import { fetchProtected } from "../../hooks/fetch-protected";
import { Check } from "./check";
import { Dropdown } from "./dropdown";

const columnHelper = createColumnHelper<Record<string, unknown>>();

const padClass = (colId: string) => {
  if (colId === "__select__") {
    return "pl-2.5 pr-1 text-center";
  }
  if (colId === "__add__") {
    return "px-1";
  }
  return "px-3";
};

interface DebugTableProps {
  tableName: string;
}

export const DebugTable = ({ tableName }: DebugTableProps) => {
  const { isDarkMode } = useTheme();
  const { data, isPending, isError, refetch: refetchData } = useDebugTableData(tableName);
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(50);
  const [dirty, setDirty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSetSearch = useDebouncedCallback((term: string) => setSearchTerm(term), {
    wait: 200,
  });

  const columns = useMemo(() => {
    const colMeta = data?.columns ?? [];
    const dataCols = colMeta.map((col) =>
      columnHelper.accessor((row) => row[col.name], {
        cell: (info) => {
          const val = info.getValue();
          if (val === null || val === undefined) {
            return <span className="opacity-30">null</span>;
          }
          const str = typeof val === "string" ? val : JSON.stringify(val);
          if (str.length > 120) {
            return <span title={str}>{str.slice(0, 120)}&hellip;</span>;
          }
          return str;
        },
        header: ({ column }) => {
          const sorted = column.getIsSorted();
          return (
            <button
              className="flex items-center gap-1 group w-full"
              onClick={() => column.toggleSorting()}
              type="button"
            >
              <span>{col.name}</span>
              <span className="text-[9px] opacity-40">{col.type}</span>
              <CaretUpDownIcon
                className={(() => {
                  const base = "size-2.5 ml-auto";
                  if (sorted === "asc") {
                    return `${base} text-blue-400 rotate-0`;
                  }
                  if (sorted === "desc") {
                    return `${base} text-blue-400 rotate-180`;
                  }
                  return `${base} opacity-30`;
                })()}
                weight="bold"
              />
            </button>
          );
        },
        id: col.name,
      }),
    );

    return [
      columnHelper.display({
        cell: ({ row }) => (
          <Check checked={row.getIsSelected()} onChange={() => row.toggleSelected()} />
        ),
        enableSorting: false,
        header: ({ table }) => {
          const all = table.getIsAllRowsSelected();
          const some = table.getIsSomeRowsSelected();
          return (
            <Check
              checked={all}
              indeterminate={some && !all}
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
      columnHelper.display({
        cell: () => (
          <button
            aria-label="Add row"
            className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-50"
            onClick={() => setDirty(true)}
            type="button"
          >
            <PlusIcon className="size-3" />
          </button>
        ),
        enableSorting: false,
        header: () => (
          <button
            aria-label="Add column"
            className="p-1 rounded hover:bg-white/10 opacity-0 group-hover/th:opacity-50"
            onClick={() => setDirty(true)}
            type="button"
          >
            <PlusIcon className="size-3" />
          </button>
        ),
        id: "__add__",
        maxSize: 32,
        minSize: 32,
        size: 32,
      }),
    ];
  }, [data]);

  const allRows = useMemo(() => data?.rows ?? [], [data]);
  const filteredRows = useMemo(() => {
    if (!searchTerm) {
      return allRows;
    }
    const term = searchTerm.toLowerCase();
    return allRows.filter((row) =>
      Object.values(row).some((v) => {
        const s = String(v ?? "");
        return s.toLowerCase().includes(term);
      }),
    );
  }, [allRows, searchTerm]);
  const rows = useMemo(() => filteredRows.slice(0, pageSize), [filteredRows, pageSize]);

  const table = useReactTable({
    columnResizeMode: "onChange",
    columns,
    data: rows,
    defaultColumn: { minSize: 100, size: 160 },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (_row, index) => String(index),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: { rowSelection, sorting },
  });

  const columnBorder = isDarkMode ? "#333" : "#ccc";
  const selectedCount = Object.keys(rowSelection).length;

  const handleCopySelected = async () => {
    const selectedRows = rows.filter((_, i) => rowSelection[i]);
    const text = JSON.stringify(selectedRows, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable
    }
  };

  const handleDeleteSelected = async () => {
    const selectedIndexes = Object.keys(rowSelection);
    if (selectedIndexes.length === 0) {
      return;
    }

    const selectedRows = selectedIndexes.map((i) => rows[Number(i)]);
    const ids = selectedRows.map((row) => String(row.id ?? row.ID ?? "")).filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    try {
      await fetchProtected(`/api/console/debug/tables/${tableName}/rows`, {
        body: JSON.stringify({ ids }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      setRowSelection({});
      refetchData();
    } catch {
      // deletion failed silently
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Toolbar */}
      <div
        className={`shrink-0 flex items-center gap-3 px-4 py-2 border-b text-[11px] lowercase ${t("border-border-dark", "border-border-light")}`}
      >
        <span className={t("text-text-dark/70", "text-text-light/70")}>
          {tableName}
          {(() => {
            if (!data) {
              return "";
            }
            if (selectedCount > 0) {
              return ` (${allRows.length} rows, ${selectedCount} selected)`;
            }
            return ` (${allRows.length} rows)`;
          })()}
        </span>

        {selectedCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] lowercase ${t("text-text-dark/50 hover:text-text-dark/80 hover:bg-white/10", "text-text-light/50 hover:text-text-light/80 hover:bg-black/10")}`}
              onClick={handleCopySelected}
              type="button"
            >
              <CopyIcon className="size-3" />
              copy
            </button>
            <button
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] lowercase ${t("text-red-400/50 hover:text-red-400 hover:bg-red-500/10", "text-red-500/50 hover:text-red-600 hover:bg-red-500/10")}`}
              onClick={handleDeleteSelected}
              type="button"
            >
              <TrashIcon className="size-3" />
              delete
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {dirty && (
            <button
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${t("bg-blue-500/20 text-blue-400 hover:bg-blue-500/30", "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20")}`}
              onClick={() => setDirty(false)}
              type="button"
            >
              <FloppyDiskIcon className="size-3" />
              save
            </button>
          )}

          <span
            className={`flex items-center gap-1 text-[11px] lowercase ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            search
            <input
              className={`w-32 bg-transparent border-b outline-none text-[11px] lowercase ${t("border-border-dark text-text-dark/50 placeholder:text-text-dark/20 focus:text-text-dark/70", "border-border-light text-text-light/50 placeholder:text-text-light/20 focus:text-text-light/70")}`}
              onChange={(e) => debouncedSetSearch(e.target.value)}
              placeholder="..."
            />
            show
            <Dropdown
              onChange={(n) => setPageSize(n)}
              options={[20, 50, 100, 500]}
              value={pageSize}
            />
            <span>entries</span>
          </span>
        </div>
      </div>

      {/* Table */}
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
                        className={`sticky top-0 z-10 py-1 text-[11px] lowercase text-left border-b transition-colors duration-500 ease-out group/th ${padClass(header.id)} ${t("border-border-dark bg-[#171717]", "border-border-light bg-[#e8e8e8]")}`}
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
                      className={`group ${row.getIsSelected() ? t("bg-neutral-500/10", "bg-neutral-500/15") : ""}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`py-1 text-[11px] truncate border-b transition-colors duration-500 ease-out ${padClass(cell.column.id)} ${t("border-border-dark/50 hover:bg-white/3 text-text-dark/80", "border-border-light/50 hover:bg-black/3 text-text-light/80")}`}
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
