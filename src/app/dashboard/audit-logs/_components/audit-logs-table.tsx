// src/app/dashboard/audit-logs/_components/audit-logs-table.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { SearchBar } from "@/components/shared/search-bar";
import { Avatar } from "@/components/shared/avatar";
import { Pagination } from "@/components/ui/pagination";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PaginationMeta } from "@/types/api";

type AuditLog = {
  id: string;
  action: string;
  subject: string;
  subjectId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

// type AuditLogsResponse = {
//   data: AuditLog[];
//   meta: PaginationMeta;
// };

const ACTION_VARIANT: Record<
  string,
  "success" | "destructive" | "warning" | "default"
> = {
  create: "success",
  delete: "destructive",
  update: "warning",
  login: "default",
  logout: "secondary" as "default",
};

export function AuditLogsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(search ? { search } : {}),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", { page, search }],
    queryFn: () => apiClient.get<AuditLog[]>(`/api/audit-logs?${params}`),
    placeholderData: (prev) => prev,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const logs = (data?.data as unknown as AuditLog[] | undefined) ?? [];
  const meta = data?.meta as unknown as PaginationMeta | undefined;

  return (
    <div>
      <div className="flex items-center border-b border-slate-200 py-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Cari tindakan, subjek, atau pengguna..."
          className="max-w-sm w-full"
        />
      </div>
      <TableRoot
        pagination={
          meta && (
            <div className="border-t border-slate-200">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )
        }
      >
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Tindakan</TableHead>
            <TableHead>Subjek</TableHead>
            <TableHead>Alamat IP</TableHead>
            <TableHead>Waktu Stempel</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={5} rows={10} />
          ) : isError ? (
            <TableEmpty colSpan={5} message="Failed to load audit logs." />
          ) : !logs.length ? (
            <TableEmpty
              colSpan={5}
              message={
                search ? `No logs matching "${search}"` : "No audit logs found."
              }
              icon={<Activity className="h-10 w-10" />}
            />
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.user ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={log.user.name} size="xs" />
                      <div>
                        <p className="text-xs font-medium text-slate-800">
                          {log.user.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {log.user.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">System</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={ACTION_VARIANT[log.action] ?? "default"}
                    className="text-[11px]"
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-700">{log.subject}</span>
                  {log.subjectId && (
                    <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                      #{log.subjectId.slice(0, 8)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-slate-500">
                    {log.ipAddress ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableRoot>
    </div>
  );
}
