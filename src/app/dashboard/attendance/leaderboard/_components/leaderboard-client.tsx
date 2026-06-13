// src/app/dashboard/attendance/leaderboard/_components/leaderboard-client.tsx
"use client";

import { useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { MonthPicker } from "@/components/shared/month-picker";
import { useAttendanceLeaderboard } from "@/hooks/use-attendance";
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
import { Badge } from "@/components/ui";
import type { AttendanceLeaderboardEntry } from "@/types";

const RANK_ICONS = [
  <Trophy key="gold" className="h-5 w-5 text-amber-500" />,
  <Medal key="silver" className="h-5 w-5 text-slate-400" />,
  <Award key="bronze" className="h-5 w-5 text-amber-700" />,
];

const RANK_BG = [
  "bg-amber-50 border-amber-200",
  "bg-slate-50 border-slate-200",
  "bg-orange-50 border-orange-200",
];

export function LeaderboardClient() {
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);

  const dateFrom =
    new Date(filterYear, filterMonth - 1, 1).toISOString().split("T")[0] ?? "";
  const dateTo =
    new Date(filterYear, filterMonth, 0).toISOString().split("T")[0] ?? "";

  const { data, isLoading, isError } = useAttendanceLeaderboard({
    dateFrom,
    dateTo,
    limit: 50,
  });

  const entries = (data?.data ?? []) as AttendanceLeaderboardEntry[];

  return (
    <div className="space-y-6">
      {/* Month Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Periode:</p>
        <MonthPicker
          year={filterYear}
          month={filterMonth}
          onChange={(y, m) => {
            setFilterYear(y);
            setFilterMonth(m);
          }}
        />
      </div>

      {/* Top 3 Cards */}
      {!isLoading && !isError && entries.length >= 3 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((idx) => {
            const entry = entries[idx];
            if (!entry) return null;
            return (
              <div
                key={entry.memberId}
                className={`rounded-xl border p-5 text-center ${
                  RANK_BG[idx] ?? "bg-white border-slate-200"
                }`}
              >
                <div className="flex justify-center mb-2">
                  {RANK_ICONS[idx]}
                </div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  #{idx + 1}
                </p>
                <p className="font-bold text-slate-900">{entry.fullName}</p>
                <p className="text-xs text-slate-500 mb-2">
                  {entry.memberNumber}
                </p>
                <div className="flex justify-center gap-4">
                  <div>
                    <p className="text-lg font-bold text-brand-600">
                      {entry.totalHadir}
                    </p>
                    <p className="text-xs text-slate-500">Hadir</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">
                      {entry.totalPoints}
                    </p>
                    <p className="text-xs text-slate-500">Poin</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <TableRoot>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Peringkat</TableHead>
            <TableHead>Nama Anggota</TableHead>
            <TableHead>No. Anggota</TableHead>
            <TableHead>Total Hadir</TableHead>
            <TableHead>Total Poin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={5} rows={10} />
          ) : isError ? (
            <TableEmpty
              colSpan={5}
              message="Gagal memuat data. Silakan segarkan halaman."
            />
          ) : entries.length === 0 ? (
            <TableEmpty
              colSpan={5}
              message="Belum ada data leaderboard."
              icon={<Trophy className="h-10 w-10" />}
            />
          ) : (
            entries.map((entry, idx) => (
              <TableRow
                key={entry.memberId}
                className={idx < 3 ? RANK_BG[idx] : undefined}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {idx < 3 ? (
                      RANK_ICONS[idx]
                    ) : (
                      <span className="text-sm font-medium text-slate-500">
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-slate-900">
                    {entry.fullName}
                  </span>
                </TableCell>
                <TableCell className="text-slate-600">
                  {entry.memberNumber}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{entry.totalHadir} kali</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="default"
                    className="bg-emerald-100 text-emerald-700 border-emerald-200"
                  >
                    {entry.totalPoints} pts
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableRoot>
    </div>
  );
}
