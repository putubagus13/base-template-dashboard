// src/app/dashboard/finance/dues/_components/dues-agenda-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus } from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button, Input, Select, Textarea, FormField } from "@/components/ui";
import { useCreateDuesAgenda, useUpdateDuesAgenda } from "@/hooks/use-dues";
import { useMemberStatusType } from "@/hooks/use-member-status-type";
import type { DuesAgendaProfile } from "@/types";

// ─── Schema ──────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0] ?? "";

const duesAgendaSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  description: z.string().optional().nullable(),
  type: z.enum(["MANDATORY", "VOLUNTARY"], {
    required_error: "Tipe wajib dipilih",
  }),
  amount: z
    .preprocess(
      (v) => (v === "" || v === null ? undefined : Number(v)),
      z.number().min(0)
    )
    .optional()
    .nullable(),
  periodMonth: z
    .preprocess(
      (v) => (v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(1).max(12)
    )
    .optional()
    .nullable(),
  periodYear: z
    .preprocess(
      (v) => (v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(2000).max(2100)
    )
    .optional()
    .nullable(),
  dueDate: z.string().optional().nullable(),
});

type DuesAgendaInput = z.infer<typeof duesAgendaSchema>;

type RateRow = {
  memberStatusTypeId: string;
  amount: number;
  effectiveDate: string;
};

// ─── Component ───────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  agenda: DuesAgendaProfile | null;
};

export function DuesAgendaFormDialog({ open, onClose, agenda }: Props) {
  const isEdit = !!agenda;
  const createAgenda = useCreateDuesAgenda();
  const updateAgenda = useUpdateDuesAgenda(agenda?.id ?? "");
  const { data: statusTypesData } = useMemberStatusType();

  const statusTypes = (statusTypesData?.data ?? []) as Array<{
    id: string;
    name: string;
    color: string | null;
  }>;

  const [rates, setRates] = useState<RateRow[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,

    formState: { errors },
  } = useForm<DuesAgendaInput>({
    resolver: zodResolver(duesAgendaSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "MANDATORY",
      amount: 0,
      periodMonth: null,
      periodYear: null,
      dueDate: "",
    },
  });

  const watchedType = watch("type");

  // Populate form when editing
  useEffect(() => {
    if (open && agenda) {
      reset({
        title: agenda.title,
        description: agenda.description ?? "",
        type: agenda.type,
        amount: agenda.amount ?? 0,
        periodMonth: agenda.periodMonth,
        periodYear: agenda.periodYear,
        dueDate: agenda.dueDate
          ? new Date(agenda.dueDate).toISOString().split("T")[0]
          : "",
      });
      if (agenda.rates) {
        setRates(
          agenda.rates.map((r) => ({
            memberStatusTypeId: r.memberStatusTypeId,
            amount: Number(r.amount),
            effectiveDate:
              new Date(r.effectiveDate).toISOString().split("T")[0] ??
              todayStr(),
          }))
        );
      }
    } else if (open) {
      reset({
        title: "",
        description: "",
        type: "MANDATORY",
        amount: 0,
        periodMonth: null,
        periodYear: null,
        dueDate: "",
      });
      // Initialize rates with all status types
      setRates(
        statusTypes.map((st) => ({
          memberStatusTypeId: st.id,
          amount: 0,
          effectiveDate: todayStr(),
        }))
      );
    }
  }, [open, agenda, reset, statusTypes]);

  const handleRateChange = (
    statusTypeId: string,
    field: "amount" | "effectiveDate",
    value: string | number
  ) => {
    setRates((prev) =>
      prev.map((r) =>
        r.memberStatusTypeId === statusTypeId ? { ...r, [field]: value } : r
      )
    );
  };

  const addRateRow = () => {
    const usedIds = new Set(rates.map((r) => r.memberStatusTypeId));
    const available = statusTypes.find((st) => !usedIds.has(st.id));
    if (available) {
      setRates((prev) => [
        ...prev,
        {
          memberStatusTypeId: available.id,
          amount: 0,
          effectiveDate: todayStr(),
        },
      ]);
    }
  };

  const removeRateRow = (statusTypeId: string) => {
    setRates((prev) =>
      prev.filter((r) => r.memberStatusTypeId !== statusTypeId)
    );
  };

  const onSubmit = (data: DuesAgendaInput) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      type: data.type,
      amount: data.type === "VOLUNTARY" ? Number(data.amount ?? 0) : null,
      periodMonth: data.periodMonth ?? null,
      periodYear: data.periodYear ?? null,
      dueDate: data.dueDate || null,
      ...(data.type === "MANDATORY"
        ? {
            rates: rates
              .filter((r) => r.amount > 0)
              .map((r) => ({
                memberStatusTypeId: r.memberStatusTypeId,
                amount: r.amount,
                effectiveDate: r.effectiveDate,
              })),
          }
        : {}),
    };

    const mutation = isEdit
      ? updateAgenda.mutateAsync(payload)
      : createAgenda.mutateAsync(payload);

    void mutation.then(() => {
      onClose();
    });
  };

  const isLoading = createAgenda.isPending || updateAgenda.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Agenda Iuran" : "Tambah Agenda Iuran"}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Title */}
        <FormField
          label="Judul Agenda"
          htmlFor="title"
          error={errors.title?.message}
          required
        >
          <Input
            id="title"
            placeholder="Contoh: Iuran Bulanan Juni 2026"
            error={errors.title?.message}
            {...register("title")}
          />
        </FormField>

        {/* Description */}
        <FormField
          label="Deskripsi"
          htmlFor="description"
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            placeholder="Deskripsi agenda (opsional)"
            rows={2}
            {...register("description")}
          />
        </FormField>

        {/* Type + Amount row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Tipe Iuran"
            htmlFor="type"
            error={errors.type?.message}
            required
          >
            <Select
              id="type"
              options={[
                { value: "MANDATORY", label: "Iuran Wajib" },
                { value: "VOLUNTARY", label: "Iuran Sukarela" },
              ]}
              value={watchedType}
              onChange={(e) =>
                setValue("type", e.target.value as "MANDATORY" | "VOLUNTARY")
              }
            />
          </FormField>

          {watchedType === "VOLUNTARY" && (
            <FormField
              label="Nominal (Rp)"
              htmlFor="amount"
              error={errors.amount?.message}
              required
            >
              <Input
                id="amount"
                type="number"
                min={0}
                placeholder="0"
                error={errors.amount?.message}
                {...register("amount")}
              />
            </FormField>
          )}
        </div>

        {/* Period */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Bulan" htmlFor="periodMonth">
            <Select
              id="periodMonth"
              options={[
                { value: "", label: "-- Pilih Bulan --" },
                ...Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label:
                    [
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
                    ][i + 1] ?? String(i + 1),
                })),
              ]}
              value={watch("periodMonth")?.toString() ?? ""}
              onChange={(e) =>
                setValue(
                  "periodMonth",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </FormField>
          <FormField label="Tahun" htmlFor="periodYear">
            <Input
              id="periodYear"
              type="number"
              min={2020}
              max={2100}
              placeholder="2026"
              error={errors.periodYear?.message}
              {...register("periodYear")}
            />
          </FormField>
        </div>

        {/* Due Date */}
        <FormField label="Tanggal Jatuh Tempo" htmlFor="dueDate">
          <Input
            id="dueDate"
            type="date"
            error={errors.dueDate?.message}
            {...register("dueDate")}
          />
        </FormField>

        {/* Rates Table (MANDATORY only) */}
        {watchedType === "MANDATORY" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Tarif per Tipe Anggota
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRateRow}
                disabled={rates.length >= statusTypes.length}
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>
            <div className="space-y-2">
              {rates.map((rate) => {
                const st = statusTypes.find(
                  (s) => s.id === rate.memberStatusTypeId
                );
                return (
                  <div
                    key={rate.memberStatusTypeId}
                    className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {st?.name ?? "Unknown"}
                      </p>
                    </div>
                    <div className="w-full sm:w-28">
                      <Input
                        type="number"
                        min={0}
                        value={rate.amount}
                        onChange={(e) =>
                          handleRateChange(
                            rate.memberStatusTypeId,
                            "amount",
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        placeholder="0"
                        className="text-right"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <Input
                        type="date"
                        value={rate.effectiveDate}
                        onChange={(e) =>
                          handleRateChange(
                            rate.memberStatusTypeId,
                            "effectiveDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRateRow(rate.memberStatusTypeId)}
                      className="text-red-500 hover:text-red-700 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              {rates.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Belum ada tarif. Klik &quot;Tambah&quot; untuk menambahkan.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEdit ? "Perbarui" : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
