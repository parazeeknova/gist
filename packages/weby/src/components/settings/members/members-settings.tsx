import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  CaretDownIcon,
  CaretUpDownIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useTheme } from "#/hooks/use-theme";
import { Check } from "#/components/console/check";
import {
  useDeleteUser,
  useUpdateUserActive,
  useUpdateUserRole,
  useUsers,
} from "#/hooks/use-console-mutations";
import type { ConsoleUser } from "#/types";

const columnHelper = createColumnHelper<ConsoleUser>();

const ROLE_OPTIONS = ["owner", "admin", "member"] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "can manage workspaces and members, but cannot delete the workspace.",
  member: "can join groups and spaces within workspaces. no management access.",
  owner: "full control. can manage workspaces, members, and delete the workspace.",
};

interface RoleDropdownProps {
  currentRole: string;
  onChange: (role: string) => void;
}

const RoleDropdown = ({ currentRole, onChange }: RoleDropdownProps) => {
  const { isDarkMode } = useTheme();
  const t = (dark: string, light: string) => (isDarkMode ? dark : light);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleScrollOrResize = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const handleToggle = () => {
    const nextOpen = !open;
    if (nextOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ left: rect.left, top: rect.bottom + 4 });
    }
    setOpen(nextOpen);
  };

  const menu = (
    <div
      ref={menuRef}
      className={`absolute border text-[11px] lowercase overflow-hidden z-[9999] shadow-lg w-56 ${t("border-border-dark bg-bg-dark", "border-border-light bg-bg-light")}`}
      style={{ left: pos.left, top: pos.top }}
    >
      {ROLE_OPTIONS.map((role) => (
        <button
          key={role}
          className={`block w-full px-3 py-2 text-left cursor-pointer ${role === currentRole ? t("bg-white/5 text-text-dark/90", "bg-black/5 text-text-light/90") : t("hover:bg-white/5 hover:text-text-dark/80", "hover:bg-black/5 hover:text-text-light/80")}`}
          onClick={() => {
            onChange(role);
            setOpen(false);
          }}
          type="button"
        >
          <span
            className={`block ${role === currentRole ? t("text-text-dark", "text-text-light") : t("text-text-dark/70", "text-text-light/70")}`}
          >
            {role}
          </span>
          <span
            className={`block text-[10px] mt-0.5 ${t("text-text-dark/30", "text-text-light/30")}`}
          >
            {ROLE_DESCRIPTIONS[role]}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        className={`flex items-center gap-0.5 text-[11px] lowercase outline-none cursor-pointer ${t("text-text-dark/70 hover:text-text-dark/90", "text-text-light/70 hover:text-text-light/90")}`}
        onClick={handleToggle}
        type="button"
      >
        {currentRole}
        <CaretDownIcon className="size-2.5" />
      </button>
      {open && createPortal(menu, document.body)}
    </>
  );
};

const getInitials = (text: string) =>
  text
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return diffSec <= 5 ? "just now" : `${diffSec} sec ago`;
  }
  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }
  if (diffHour < 24) {
    return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  }
  if (diffDay < 30) {
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  }
  if (diffMonth < 12) {
    return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
  }
  if (diffYear < 100) {
    return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
  }
  return "a century ago";
};

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
      className={`border-b ${tc(isDarkMode, "border-border-dark/50", "border-border-light/50")} ${tc(isDarkMode, "hover:bg-white/2", "hover:bg-black/2")}`}
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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
      columnHelper.display({
        cell: ({ row }) => (
          <Check checked={row.getIsSelected()} onChange={() => row.toggleSelected()} />
        ),
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
        id: "select",
      }),
      columnHelper.accessor("name", {
        cell: (info) => {
          const user = info.row.original;
          const initials = getInitials(user.name || user.username);
          return (
            <div className="flex items-center gap-2">
              {user.avatar_url ? (
                <img
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  src={user.avatar_url}
                />
              ) : (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium shrink-0 bg-white/10 text-text-dark/60">
                  {initials}
                </span>
              )}
              <div className="flex flex-col">
                <span className="text-[11px]">{user.name || user.username}</span>
                <span
                  className={`text-[11px] ${tc(isDarkMode, "text-text-dark/30", "text-text-light/30")}`}
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
            <RoleDropdown
              currentRole={user.role}
              onChange={(role) => updateRole.mutate({ id: user.id, role })}
            />
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
              className={`text-[11px] lowercase ${
                isActive
                  ? tc(isDarkMode, "text-text-dark/50", "text-text-light/50")
                  : tc(isDarkMode, "text-text-dark/30", "text-text-light/30")
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
          return (
            <span
              className={`text-[11px] ${tc(isDarkMode, "text-text-dark/40", "text-text-light/40")}`}
            >
              {formatRelativeTime(val)}
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
              className={`text-[11px] lowercase flex items-center gap-1 ${
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
              <TrashIcon size={11} />
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
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: { rowSelection, sorting },
  });

  const t = (dark: string, light: string) => (isDarkMode ? dark : light);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1
        className={`text-center text-sm font-normal lowercase mb-8 ${t("text-text-dark", "text-text-light")}`}
      >
        manage members
      </h1>

      <div className="flex items-center gap-3 mb-4">
        <MagnifyingGlassIcon className={t("text-text-dark/20", "text-text-light/20")} size={12} />
        <input
          className={`w-[40%] bg-transparent py-1 text-[11px] lowercase outline-none border-b ${t("border-border-dark", "border-border-light")} ${t("placeholder:text-text-dark/20 text-text-dark/60", "placeholder:text-text-light/20 text-text-light/60")}`}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search members"
          type="text"
          value={searchQuery}
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`flex items-center gap-1 text-[10px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
            onClick={() => table.toggleAllRowsSelected()}
            type="button"
          >
            select all
          </button>
          <button
            className={`flex items-center gap-1 text-[10px] lowercase ${t("text-text-dark/40 hover:text-text-dark/70", "text-text-light/40 hover:text-text-light/70")}`}
            type="button"
          >
            filter
          </button>
          <button
            className={`flex items-center gap-1 px-2 py-1 text-[10px] lowercase border ${t("text-text-dark/60 border-border-dark hover:bg-white/5", "text-text-light/60 border-border-light hover:bg-black/3")}`}
            type="button"
          >
            invite
          </button>
        </div>
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
