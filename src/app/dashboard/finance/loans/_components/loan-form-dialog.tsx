// src/app/dashboard/finance/loans/_components/loan-form-dialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button, Input, Select, FormField } from "@/components/ui";
import { useCashAccounts } from "@/hooks/use-cash-accounts";
import { useBorrowerSearch, useCreateBorrower } from "@/hooks/use-borrowers";
import { useCreateLoan, useUpdateLoan } from "@/hooks/use-loans";
import { useMembers } from "@/hooks/use-members";
import { useDebounce } from "@/hooks/use-debounce";
import { toLocalDateString } from "@/utils/format";
import type { LoanProfile, CreateLoanPayload } from "@/types";

type LoanFormDialogProps = {
  open: boolean;
  onClose: () => void;
  loan: LoanProfile | null;
};

export function LoanFormDialog({ open, onClose, loan }: LoanFormDialogProps) {
  const isEdit = Boolean(loan);

  const [borrowerType, setBorrowerType] = useState<"member" | "external">(
    "external"
  );
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("");
  const [newBorrowerName, setNewBorrowerName] = useState("");
  const [newBorrowerPhone, setNewBorrowerPhone] = useState("");
  const [newBorrowerAddress, setNewBorrowerAddress] = useState("");
  const [accountId, setAccountId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [loanDate, setLoanDate] = useState(toLocalDateString());
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const debouncedSearch = useDebounce(borrowerSearch, 300);
  const { data: borrowerResults } = useBorrowerSearch(
    borrowerType === "external" ? debouncedSearch : ""
  );
  const { data: memberResults } = useMembers({
    search: borrowerType === "member" ? debouncedSearch : "",
    limit: 10,
  });
  const { data: accountsData } = useCashAccounts();
  const createLoan = useCreateLoan();
  const updateLoan = useUpdateLoan(loan?.id ?? "");
  const createBorrower = useCreateBorrower();

  // Extract data from API responses
  const accounts =
    (accountsData as { data?: { data?: { id: string; name: string }[] } })?.data
      ?.data ?? [];
  const membersList =
    (
      memberResults as {
        data?: {
          data?: { id: string; fullName: string; memberNumber: string }[];
        };
      }
    )?.data?.data ?? [];
  const borrowerList =
    (
      borrowerResults as {
        data?: { id: string; name: string; phone: string | null }[];
      }
    )?.data ?? [];

  useEffect(() => {
    if (open) {
      if (loan) {
        setBorrowerType(loan.borrower.isMember ? "member" : "external");
        setSelectedBorrowerId(loan.borrowerId);
        setBorrowerSearch(loan.borrower.name);
        setAccountId(loan.accountId);
        setPrincipal(String(loan.principal));
        setInterestRate(String(parseFloat(loan.interestRate) * 100));
        setDurationMonths(String(loan.durationMonths));
        setLoanDate(toLocalDateString(loan.loanDate));
        setPurpose(loan.purpose ?? "");
        setNotes(loan.notes ?? "");
      } else {
        setBorrowerType("external");
        setBorrowerSearch("");
        setSelectedBorrowerId("");
        setNewBorrowerName("");
        setNewBorrowerPhone("");
        setNewBorrowerAddress("");
        setAccountId("");
        setPrincipal("");
        setInterestRate("");
        setDurationMonths("");
        setLoanDate(toLocalDateString());
        setPurpose("");
        setNotes("");
      }
      setShowConfirmation(false);
    }
  }, [open, loan]);

  const calc = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(interestRate) || 0) / 100;
    const d = parseInt(durationMonths) || 0;
    const totalInterest = p * r * d;
    const totalOwed = p + totalInterest;
    const monthlyInstallment = d > 0 ? totalOwed / d : 0;
    return { totalInterest, totalOwed, monthlyInstallment };
  }, [principal, interestRate, durationMonths]);

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const handleSubmit = async () => {
    let finalBorrowerId = selectedBorrowerId;

    if (borrowerType === "member") {
      finalBorrowerId = selectedBorrowerId;
    } else if (!selectedBorrowerId && newBorrowerName) {
      try {
        const result = await createBorrower.mutateAsync({
          name: newBorrowerName,
          phone: newBorrowerPhone || null,
          address: newBorrowerAddress || null,
        });
        finalBorrowerId = (result as unknown as { data: { id: string } }).data
          .id;
      } catch {
        return;
      }
    }

    const payload: CreateLoanPayload = {
      borrowerId: finalBorrowerId,
      accountId,
      principal: parseFloat(principal),
      interestRate: (parseFloat(interestRate) || 0) / 100,
      durationMonths: parseInt(durationMonths) || 0,
      loanDate,
      purpose: purpose || null,
      notes: notes || null,
    };

    if (isEdit) {
      updateLoan.mutate(payload, { onSuccess: () => onClose() });
    } else {
      createLoan.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const isLoading =
    createLoan.isPending || updateLoan.isPending || createBorrower.isPending;

  return (
    <>
      <Dialog
        open={open && !showConfirmation}
        onClose={onClose}
        title={isEdit ? "Edit Pinjaman" : "Ajukan Pinjaman Baru"}
        size="xl"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Tipe Peminjam
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="borrowerType"
                  checked={borrowerType === "member"}
                  onChange={() => {
                    setBorrowerType("member");
                    setSelectedBorrowerId("");
                    setBorrowerSearch("");
                  }}
                  className="accent-brand-600"
                />
                Anggota
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="borrowerType"
                  checked={borrowerType === "external"}
                  onChange={() => {
                    setBorrowerType("external");
                    setSelectedBorrowerId("");
                    setBorrowerSearch("");
                  }}
                  className="accent-brand-600"
                />
                Eksternal
              </label>
            </div>
          </div>

          {borrowerType === "member" && (
            <FormField label="Cari Anggota" htmlFor="member-search">
              <Input
                id="member-search"
                placeholder="Ketik nama anggota..."
                value={borrowerSearch}
                onChange={(e) => {
                  setBorrowerSearch(e.target.value);
                  setSelectedBorrowerId("");
                }}
              />
              {membersList.length > 0 && !selectedBorrowerId && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {membersList.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedBorrowerId(m.id);
                        setBorrowerSearch(m.fullName);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {m.fullName} ({m.memberNumber})
                    </button>
                  ))}
                </div>
              )}
            </FormField>
          )}

          {borrowerType === "external" && (
            <div className="space-y-3">
              <FormField
                label="Cari Peminjam Existing"
                htmlFor="borrower-search"
              >
                <Input
                  id="borrower-search"
                  placeholder="Ketik nama untuk mencari..."
                  value={borrowerSearch}
                  onChange={(e) => {
                    setBorrowerSearch(e.target.value);
                    setSelectedBorrowerId("");
                  }}
                />
                {borrowerList.length > 0 && !selectedBorrowerId && (
                  <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                    {borrowerList.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBorrowerId(b.id);
                          setBorrowerSearch(b.name);
                          setNewBorrowerName("");
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {b.name} {b.phone && `(${b.phone})`}
                      </button>
                    ))}
                  </div>
                )}
              </FormField>
              {!selectedBorrowerId && (
                <>
                  <FormField
                    label="Nama Peminjam Baru"
                    htmlFor="new-borrower-name"
                    required
                  >
                    <Input
                      id="new-borrower-name"
                      placeholder="Nama lengkap"
                      value={newBorrowerName}
                      onChange={(e) => setNewBorrowerName(e.target.value)}
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="No. HP" htmlFor="new-borrower-phone">
                      <Input
                        id="new-borrower-phone"
                        placeholder="08xxxxxxxxxx"
                        value={newBorrowerPhone}
                        onChange={(e) => setNewBorrowerPhone(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Alamat" htmlFor="new-borrower-address">
                      <Input
                        id="new-borrower-address"
                        placeholder="Alamat"
                        value={newBorrowerAddress}
                        onChange={(e) => setNewBorrowerAddress(e.target.value)}
                      />
                    </FormField>
                  </div>
                </>
              )}
            </div>
          )}

          <FormField label="Akun Kas" htmlFor="account-select" required>
            <Select
              id="account-select"
              options={[
                { value: "", label: "Pilih akun kas..." },
                ...accounts.map((a) => ({ value: a.id, label: a.name })),
              ]}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nominal Pinjaman" htmlFor="principal" required>
              <Input
                id="principal"
                type="number"
                placeholder="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </FormField>
            <FormField
              label="Bunga per Bulan (%)"
              htmlFor="interest-rate"
              required
            >
              <Input
                id="interest-rate"
                type="number"
                step="0.1"
                placeholder="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jangka Waktu (Bulan)" htmlFor="duration" required>
              <Input
                id="duration"
                type="number"
                placeholder="0"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                Untuk perhitungan bunga & jatuh tempo
              </p>
            </FormField>
            <FormField label="Tanggal Pinjaman" htmlFor="loan-date" required>
              <Input
                id="loan-date"
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
              />
            </FormField>
          </div>

          {calc.totalOwed > 0 && (
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Rincian Perhitungan
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Total Bunga:</span>
                  <p className="font-semibold">
                    {formatCurrency(calc.totalInterest)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Total Bayar:</span>
                  <p className="font-semibold">
                    {formatCurrency(calc.totalOwed)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Cicilan/Bulan:</span>
                  <p className="font-semibold">
                    {formatCurrency(calc.monthlyInstallment)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <FormField label="Tujuan Pinjaman" htmlFor="purpose">
            <Input
              id="purpose"
              placeholder="Misal: Modal usaha, biaya pendidikan..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </FormField>
          <FormField label="Catatan" htmlFor="notes">
            <Input
              id="notes"
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </div>

        <DialogFooter className="mt-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-5 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={
              !accountId ||
              !principal ||
              !interestRate ||
              !durationMonths ||
              !loanDate ||
              (!selectedBorrowerId && !newBorrowerName)
            }
          >
            {isEdit ? "Simpan Perubahan" : "Ajukan Pinjaman"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Konfirmasi Pengajuan Pinjaman"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Pastikan data berikut sudah benar sebelum diajukan. Data yang sudah
            diverifikasi tidak dapat diubah.
          </p>
          <div className="rounded-lg border border-slate-200 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal:</span>
              <span className="font-semibold">
                {formatCurrency(parseFloat(principal) || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bunga:</span>
              <span className="font-semibold">{interestRate}%/bulan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jangka Waktu:</span>
              <span className="font-semibold">{durationMonths} bulan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Bunga:</span>
              <span className="font-semibold">
                {formatCurrency(calc.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-700 font-medium">Total Bayar:</span>
              <span className="font-bold text-brand-700">
                {formatCurrency(calc.totalOwed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{loanDate}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-5 rounded-b-2xl">
          <Button variant="outline" onClick={() => setShowConfirmation(false)}>
            Periksa Lagi
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Konfirmasi & Ajukan
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
