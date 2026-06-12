// src/app/dashboard/finance/donations/_components/donor-leaderboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { Trophy } from "lucide-react";
import { useDonorLeaderboard } from "@/hooks/use-donors";

const RANK_STYLES = [
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-400",
    text: "text-amber-700",
    label: "Emas",
    icon: "text-amber-500",
  },
  {
    bg: "bg-slate-50",
    border: "border-slate-200",
    bar: "bg-slate-400",
    text: "text-slate-700",
    label: "Perak",
    icon: "text-slate-500",
  },
  {
    bg: "bg-orange-50",
    border: "border-orange-200",
    bar: "bg-orange-400",
    text: "text-orange-700",
    label: "Perunggu",
    icon: "text-orange-500",
  },
];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

export function DonorLeaderboard() {
  const { data: leaderboard, isLoading } = useDonorLeaderboard();

  const donors = leaderboard?.data ?? [];
  const maxDonated = donors.length > 0 ? donors[0]?.totalDonated ?? 1 : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top 3 Donatur
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Belum ada data donasi yang terverifikasi.
          </div>
        ) : (
          <div className="space-y-4">
            {donors.map((donor, index) => {
              const style = RANK_STYLES[index] ?? RANK_STYLES[2]!;
              const percentage = (donor.totalDonated / maxDonated) * 100;

              return (
                <div
                  key={donor.id}
                  className={`rounded-lg border ${style.border} ${style.bg} p-3`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${style.bar} text-white text-xs font-bold`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${style.text}`}>
                          {donor.name}
                        </p>
                        {donor.isMember && donor.member && (
                          <p className="text-xs text-slate-500">
                            {donor.member.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  {/* Rank Bar */}
                  <div className="relative h-6 w-full overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full ${style.bar} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(percentage, 10)}%` }}
                    >
                      <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                        {formatCurrency(donor.totalDonated)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
