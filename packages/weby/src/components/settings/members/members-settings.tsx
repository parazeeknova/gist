import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { CaretUpDownIcon, MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import { useTheme } from "#/hooks/use-theme";
import {
  useDeleteUser,
  useUpdateUserActive,
  useUpdateUserRole,
  useUsers,
} from "#/hooks/use-console-mutations";
import type { ConsoleUser } from "#/types";

const columnHelper = createColumnHelper<ConsoleUser>();

const ROLE_OPTIONS = ["owner", "admin", "member"] as const;

const getInitials = (text: string) =>
  text
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const tc = (isDarkMode: boolean, dark: string, light: string) => (isDarkMode ? dark : light);

interface TableBodyProps {
  columnsLength: number;
  filteredUsers: ConsoleUser[];
  isDarkMode: boolean;
  isPending: boolean;
  tableRows: ReturnType<ReturnType<typeof useReactTable<ConsoleUser>>["getRowModel"]>["rows"];
  usersLength: number;
}

const TableBody = ({
  columnsLength,
  filteredUsers,
  isDarkMode,
  isPending,
  tableRows,
  usersLength,
}: TableBodyProps) => {
  if (isPending) {
    return (
      <tr>
        <td
          className={`px-3 py-8 text-center text-[11px] ${tc(isDarkMode, "text-text-dark/30", "text-text-light/30")}`}
          colSpan={columnsLength}
        >
          loading members...
        </td>
      </tr>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <tr>
        <td
          className={`px-3 py-8 text-center text-[11px] ${tc(isDarkMode, "text-text-dark/30", "text-text-light/30")}`}
          colSpan={columnsLength}
        >
          {usersLength === 0 ? "no members yet" : "no members match your search"}
        </td>
      </tr>
    );
  }

  return tableRows.map((row) => (
    <tr
      key={row.id}
      className={`border-b ${tc(isDarkMode, "border-border-dark/50", "border-border-light/50")} ${tc(isDarkMode, "hover:bg-white/[0.02]", "hover:bg-black/[0.02]")}`}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-3 py-2">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  ));
};

export const MembersSettings = () => {
  const { isDarkMode } = useTheme();
  const { data: users, isPending } = useUsers();
  const updateRole = useUpdateUserRole();
  const updateActive = useUpdateUserActive();
  const deleteUser = useDeleteUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users ?? [];
    }
    const term = searchQuery.toLowerCase();
    return (users ?? []).filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.name.toLowerCase().includes(term),
    );
  }, [users, searchQuery]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => {
          const user = info.row.original;
          const initials = getInitials(user.name || user.username);
          return (
            <div className="flex items-center gap-2">
              {user.avatar_url ? (
                <img
                  alt=""
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  src={user.avatar_url}
                />
              ) : (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium flex-shrink-0 bg-white/10 text-text-dark/60">
                  {initials}
                </span>
              )}
              <div className="flex flex-col">
                <span className="text-[11px]">{user.name || user.username}</span>
                <span
                  className={`text-[10px] ${tc(isDarkMode, "text-text-dark/30", "text-text-light/30")}`}
                >
                  @{user.username}
                </span>
              </div>
            </div>
          );
        },
        header: "user",
      }),
      columnHelper.accessor("email", {
        cell: (info) => <span className="text-[11px]">{info.getValue()}</span>,
        header: "email",
      }),
      columnHelper.accessor("role", {
        cell: (info) => {
          const user = info.row.original;
          return (
            <select
              className={`bg-transparent text-[11px] lowercase outline-none cursor-pointer ${tc(isDarkMode, "text-text-dark/70", "text-text-light/70")}`}
              onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value })}
              value={user.role}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          );
        },
        header: "role",
      }),
      columnHelper.accessor("is_active", {
        cell: (info) => {
          const user = info.row.original;
          const isActive = info.getValue();
          return (
            <button
              className={`text-[10px] lowercase px-1.5 py-0.5 border ${
                isActive
                  ? tc(
                      isDarkMode,
                      "border-green-500/30 text-green-400/80",
                      "border-green-500/30 text-green-600/80",
                    )
                  : tc(
                      isDarkMode,
                      "border-red-500/30 text-red-400/80",
                      "border-red-500/30 text-red-600/80",
                    )
              }`}
              onClick={() => updateActive.mutate({ id: user.id, isActive: !isActive })}
              type="button"
            >
              {isActive ? "active" : "inactive"}
            </button>
          );
        },
        header: "status",
      }),
      columnHelper.accessor("last_seen", {
        cell: (info) => {
          const val = info.getValue();
          if (!val) {
            return (
              <span
                className={`text-[11px] ${tc(isDarkMode, "text-text-dark/20", "text-text-light/20")}`}
              >
                never
              </span>
            );
          }
          const date = new Date(val);
          return (
            <span
              className={`text-[11px] ${tc(isDarkMode, "text-text-dark/40", "text-text-light/40")}`}
            >
              {date.toLocaleDateString()}
            </span>
          );
        },
        header: "last seen",
      }),
      columnHelper.display({
        cell: ({ row }) => {
          const user = row.original;
          const isConfirm = confirmDelete === user.id;
          return (
            <button
              className={`text-[10px] lowercase flex items-center gap-1 ${
                isConfirm
                  ? "text-red-400"
                  : tc(
                      isDarkMode,
                      "text-text-dark/30 hover:text-red-400",
                      "text-text-light/30 hover:text-red-600",
                    )
              }`}
              onClick={() => {
                if (isConfirm) {
                  deleteUser.mutate(user.id);
                  setConfirmDelete(null);
                } else {
                  setConfirmDelete(user.id);
                  setTimeout(
                    () => setConfirmDelete((curr) => (curr === user.id ? null : curr)),
                    3000,
                  );
                }
              }}
              type="button"
            >
              <TrashIcon size={10} />
              {isConfirm ? "confirm?" : "delete"}
            </button>
          );
        },
        header: "",
        id: "actions",
      }),
    ],
    [isDarkMode, updateRole, updateActive, deleteUser, confirmDelete],
  );

  const table = useReactTable({
    columns,
    data: filteredUsers,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        manage members
      </h1>

      <div className="flex items-center gap-2 mb-4">
        <MagnifyingGlassIcon className={t("text-text-dark/20", "text-text-light/20")} size={12} />
        <input
          className={`w-full bg-transparent py-1 text-[11px] lowercase outline-none ${t("placeholder:text-text-dark/20 text-text-dark/60", "placeholder:text-text-light/20 text-text-light/60")}`}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search members"
          type="text"
          value={searchQuery}
        />
      </div>

      <div className={`border ${t("border-border-dark", "border-border-light")} overflow-x-auto`}>
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className={`border-b ${t("border-border-dark", "border-border-light")}`}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-3 py-2 text-[10px] uppercase tracking-wider ${t("text-text-dark/30", "text-text-light/30")}`}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-1 group"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <CaretUpDownIcon
                            className={`size-2.5 ${
                              header.column.getIsSorted()
                                ? "text-blue-400"
                                : t("text-text-dark/20", "text-text-light/20")
                            }`}
                            weight="bold"
                          />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <TableBody
              columnsLength={columns.length}
              filteredUsers={filteredUsers}
              isDarkMode={isDarkMode}
              isPending={isPending}
              tableRows={table.getRowModel().rows}
              usersLength={users?.length ?? 0}
            />
          </tbody>
        </table>
      </div>

      <div className={`mt-4 text-[10px] lowercase ${t("text-text-dark/20", "text-text-light/20")}`}>
        {pluralize(filteredUsers.length, "member")}
      </div>
    </div>
  );
};
