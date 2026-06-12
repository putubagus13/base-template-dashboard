// src/app/dashboard/finance/donations/_components/donation-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useCreateDonor, useMemberSearch } from "@/hooks/use-donors";
import { useCashAccounts } from "@/hooks/use-cash-accounts";
import { useCreateCashTransaction } from "@/hooks/use-cash-transactions";
import { useState, useEffect, useRef } from "react";
import { MemberSearchResult } from "@/app/api/members/search/route";
import { TransactionType } from "@prisma/client";

// ─── Schema ───────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0] ?? "";

const donationSchema = z.object({
  isMember: z.boolean(),
  memberId: z.string().optional().nullable(),
  name: z.string().min(2, "Nama donatur minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  //   email: z.string().email("Email tidak valid").optional().nullable(),
  address: z.string().optional().nullable(),
  accountId: z.string().min(1, "Akun kas wajib dipilih"),
  amount: z
    .string()
    .transform((val) => (val === "" ? 0 : parseFloat(val)))
    .pipe(z.number().positive("Jumlah harus lebih dari 0")),
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  notes: z.string().optional().nullable(),
});

type DonationInput = z.infer<typeof donationSchema>;

// ─── Member Autocomplete ──────────────────────────────────────

function MemberAutocomplete({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (memberId: string | null, member: MemberSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: members, isLoading } = useMemberSearch(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Ketik nama anggota..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Mencari...</div>
          ) : !members?.data?.length ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              Tidak ditemukan
            </div>
          ) : (
            members.data.map((m: MemberSearchResult) => (
              <button
                key={m.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  value === m.id ? "bg-brand-50 text-brand-700" : ""
                }`}
                onClick={() => {
                  onChange(m.id, m);
                  setQuery(m.fullName);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium">{m.fullName}</div>
                {(m.phone || m.email) && (
                  <div className="text-xs text-slate-500">
                    {m.phone && <span>{m.phone}</span>}
                    {m.phone && m.email && <span> · </span>}
                    {m.email && <span>{m.email}</span>}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────

export function DonationForm() {
  const createDonor = useCreateDonor();
  const createTransaction = useCreateCashTransaction();
  const { data: accountsData } = useCashAccounts({ isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accounts = accountsData?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DonationInput>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      isMember: false,
      memberId: null,
      name: "",
      phone: "",
      //   email: "",
      address: "",
      accountId: "",
      amount: 0,
      transactionDate: todayStr(),
      notes: "",
    },
  });

  const isMemberValue = watch("isMember");

  const onSubmit = async (data: DonationInput) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create or link donor
      const donorPayload = {
        name: data.name,
        phone: data.phone || null,
        // email: data.email || null,
        address: data.address || null,
        isMember: data.isMember,
        memberId: data.isMember ? data.memberId ?? null : null,
      };

      const donorResponse = await createDonor.mutateAsync(donorPayload);
      const donorId = donorResponse?.data?.id;

      // Step 2: Create cash transaction (INCOME, PENDING)
      await createTransaction.mutateAsync({
        type: TransactionType.INCOME,
        accountId: data.accountId,
        amount: data.amount,
        description: `Donasi dari ${data.name}`,
        donorId: donorId ?? null,
        transactionDate: data.transactionDate,
        notes: data.notes || null,
      });

      // Reset form
      reset({
        isMember: false,
        memberId: null,
        name: "",
        phone: "",
        // email: "",
        address: "",
        accountId: "",
        amount: 0,
        transactionDate: todayStr(),
        notes: "",
      });
    } catch {
      // Errors handled by individual mutations
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Donasi</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Member Toggle */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
            <Checkbox
              id="isMember"
              label="Donatur adalah Anggota Organisasi"
              checked={isMemberValue}
              onChange={(e) => {
                const checked = (e.target as HTMLInputElement).checked;
                setValue("isMember", checked);
                if (!checked) {
                  setValue("memberId", null);
                  setValue("name", "");
                  setValue("phone", "");
                  //   setValue("email", "");
                  setValue("address", "");
                }
              }}
            />
          </div>

          {/* Member Search or Manual Input */}
          {isMemberValue ? (
            <div className="space-y-4">
              <FormField
                label="Pilih Anggota"
                htmlFor="memberId"
                error={errors.memberId?.message}
                required
              >
                <MemberAutocomplete
                  value={watch("memberId")}
                  onChange={(memberId, member) => {
                    setValue("memberId", memberId);
                    setValue("name", member.fullName);
                    setValue("phone", member.phone ?? "");
                    // setValue("email", member.email ?? "");
                  }}
                />
              </FormField>

              <FormField label="Nama (otomatis)" htmlFor="name-auto">
                <Input
                  id="name-auto"
                  readOnly
                  placeholder="Terisi otomatis"
                  {...register("name")}
                />
              </FormField>
            </div>
          ) : (
            <div className="space-y-4">
              <FormField
                label="Nama Donatur"
                htmlFor="name"
                error={errors.name?.message}
                required
              >
                <Input
                  id="name"
                  placeholder="Nama lengkap donatur"
                  error={errors.name?.message}
                  {...register("name")}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Telepon"
                  htmlFor="phone"
                  error={errors.phone?.message}
                >
                  <Input
                    id="phone"
                    placeholder="No. telepon"
                    error={errors.phone?.message}
                    {...register("phone")}
                  />
                </FormField>

                {/* <FormField
                  label="Email"
                  htmlFor="email"
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email donatur"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </FormField> */}
              </div>

              <FormField
                label="Alamat"
                htmlFor="address"
                error={errors.address?.message}
              >
                <Input
                  id="address"
                  placeholder="Alamat donatur"
                  error={errors.address?.message}
                  {...register("address")}
                />
              </FormField>
            </div>
          )}

          {/* Cash Account Selection */}
          <FormField
            label="Akun Kas"
            htmlFor="accountId"
            error={errors.accountId?.message}
            required
          >
            <Select
              options={accounts.map((acc) => ({
                value: acc.id,
                label: acc.name,
              }))}
              value={watch("accountId")}
              placeholder="Pilih akun kas..."
              onChange={(e) => setValue("accountId", e.target.value)}
            />
          </FormField>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Jumlah Donasi"
              htmlFor="amount"
              error={errors.amount?.message}
              required
            >
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0"
                error={errors.amount?.message}
                {...register("amount")}
              />
            </FormField>

            <FormField
              label="Tanggal Transaksi"
              htmlFor="transactionDate"
              error={errors.transactionDate?.message}
              required
            >
              <Input
                id="transactionDate"
                type="date"
                error={errors.transactionDate?.message}
                {...register("transactionDate")}
              />
            </FormField>
          </div>

          {/* Notes */}
          <FormField
            label="Catatan"
            htmlFor="notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="notes"
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              {...register("notes")}
            />
          </FormField>

          {/* Info Box */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Donasi yang dicatat akan masuk sebagai transaksi dengan status{" "}
            <strong>Menunggu Verifikasi</strong>. Saldo akun kas akan bertambah
            setelah transaksi disetujui.
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Catat Donasi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
