// src/app/dashboard/finance/dues/[id]/_components/dues-agenda-detail.tsx
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Banknote,
  Search,
  Zap,
  CreditCard,
} from "lucide-react";
import {
  useDuesAgenda,
  useGenerateDuesPayments,
  useDuesPayments,
} from "@/hooks/use-dues";
import { usePermissions } from "@/hooks/use-permission";
import {
  Button,
  Input,
  Select,
  Badge,
  StatCard,
  Skeleton,
} from "@/components/ui";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DuesPaymentDialog } from "./dues-payment-dialog";
import type { DuesAgendaProfile, MemberDuesPaymentProfile } from "@/types";

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

export function DuesAgendaDetail({ agendaId }: { agendaId: string }) {
  const { can } = usePermissions();
  const { data: agendaData, isLoading: agendaLoading } =
    useDuesAgenda(agendaId);
  const generatePayments = useGenerateDuesPayments(agendaId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: paymentsData, isLoading: paymentsLoading } = useDuesPayments(
    agendaId,
    {
      search,
      ...(statusFilter ? { status: statusFilter } : {}),
      page,
      limit: 50,
    }
  );

  const [paymentTarget, setPaymentTarget] =
    useState<MemberDuesPaymentProfile | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const agenda = agendaData?.data as DuesAgendaProfile | undefined;
  const payments = (paymentsData?.data ?? []) as MemberDuesPaymentProfile[];
  const paymentMeta = paymentsData?.meta as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;
  const summary = agenda?._summary;

  if (agendaLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">Agenda iuran tidak ditemukan.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const hasPayments = (summary?.totalMembers ?? 0) > 0;
  const period =
    agenda.periodMonth && agenda.periodYear
      ? `${MONTH_NAMES[agenda.periodMonth]} ${agenda.periodYear}`
      : agenda.periodMonth
      ? MONTH_NAMES[agenda.periodMonth]
      : "-";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => (window.location.href = "/dashboard/finance/dues")}
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Iuran
      </Button>

      {/* Agenda Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{agenda.title}</h2>
            {agenda.description && (
              <p className="mt-0.5 text-sm text-slate-500">
                {agenda.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                agenda.type === "MANDATORY"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }
            >
              {agenda.type === "MANDATORY" ? "Wajib" : "Sukarela"}
            </Badge>
            <Badge variant={agenda.isActive ? "default" : "secondary"}>
              {agenda.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Periode</p>
            <p className="font-semibold text-slate-800">{period}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Jatuh Tempo</p>
            <p className="font-semibold text-slate-800">
              {agenda.dueDate
                ? new Date(agenda.dueDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </p>
          </div>
          {agenda.type === "VOLUNTARY" && agenda.amount !== null && (
            <div>
              <p className="text-xs text-slate-500">Nominal</p>
              <p className="font-semibold text-slate-800">
                {formatCurrency(Number(agenda.amount))}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">Terkumpul</p>
            <p className="font-semibold text-emerald-700">
              {formatCurrency(summary?.totalCollected ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Rates Card (MANDATORY) */}
      {agenda.type === "MANDATORY" &&
        agenda.rates &&
        agenda.rates.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Tarif per Tipe Anggota
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {agenda.rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: rate.memberStatusType.color ?? "#6b7280",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {rate.memberStatusType.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Berlaku{" "}
                      {new Date(rate.effectiveDate).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {formatCurrency(Number(rate.amount))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Anggota"
          value={summary?.totalMembers ?? 0}
          icon={Users}
        />
        <StatCard
          label="Sudah Bayar"
          value={summary?.paid ?? 0}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Belum Bayar"
          value={summary?.unpaid ?? 0}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          label="Terkumpul"
          value={formatCurrency(summary?.totalCollected ?? 0)}
          icon={Banknote}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Payments Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-slate-800">
            Daftar Pembayaran
          </h3>
          <div className="flex items-center gap-2">
            {!hasPayments && can("update:duesAgenda") && (
              <Button
                size="sm"
                onClick={() => setShowGenerateConfirm(true)}
                isLoading={generatePayments.isPending}
              >
                <Zap className="h-4 w-4" />
                Generate Pembayaran
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama anggota..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            options={[
              { value: "", label: "Semua Status" },
              { value: "UNPAID", label: "Belum Bayar" },
              { value: "PAID", label: "Sudah Bayar" },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          />
        </div>

        {/* Table */}
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableHead>Anggota</TableHead>
              <TableHead>No. Anggota</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tgl Bayar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : payments.length === 0 ? (
              <TableEmpty
                colSpan={7}
                message={
                  !hasPayments
                    ? "Belum ada data pembayaran. Klik 'Generate Pembayaran' untuk membuat."
                    : "Tidak ada data pembayaran ditemukan."
                }
              />
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <span className="font-medium text-slate-900">
                      {payment.member.fullName}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {payment.member.memberNumber}
                  </TableCell>
                  <TableCell>
                    {payment.member.status ? (
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              payment.member.status.color ?? "#6b7280",
                          }}
                        />
                        <span className="text-sm text-slate-600">
                          {payment.member.status.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {formatCurrency(Number(payment.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "PAID" ? "default" : "secondary"
                      }
                      className={
                        payment.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {payment.status === "PAID" ? "Lunas" : "Belum Bayar"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {payment.status === "UNPAID" &&
                        can("update:memberDuesPayment") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentTarget(payment)}
                          >
                            <CreditCard className="h-4 w-4" />
                            Bayar
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </TableRoot>
        {paymentMeta && paymentMeta.totalPages > 1 && (
          <div className="border-t border-slate-100">
            <Pagination
              meta={
                paymentMeta as unknown as import("@/types/api").PaginationMeta
              }
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Generate Payments Confirm */}
      <ConfirmDialog
        open={showGenerateConfirm}
        title="Generate Data Pembayaran"
        description="Sistem akan membuat data pembayaran untuk semua anggota aktif berdasarkan tarif yang sudah dikonfigurasi. Lanjutkan?"
        confirmLabel="Generate"
        variant="warning"
        isLoading={generatePayments.isPending}
        onConfirm={() =>
          generatePayments.mutate(undefined, {
            onSuccess: () => setShowGenerateConfirm(false),
          })
        }
        onClose={() => setShowGenerateConfirm(false)}
      />

      {/* Payment Dialog */}
      {paymentTarget && (
        <DuesPaymentDialog
          payment={paymentTarget}
          agendaTitle={agenda.title}
          onClose={() => setPaymentTarget(null)}
        />
      )}
    </div>
  );
}
