// src/app/dashboard/finance/loans/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { LoansTable } from "./_components/loans-table";

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catatan Pinjaman"
        description="Kelola pinjaman dan pembayaran kas organisasi"
      />
      <LoansTable />
    </div>
  );
}
