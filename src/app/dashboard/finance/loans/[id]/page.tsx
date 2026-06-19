// src/app/dashboard/finance/loans/[id]/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { LoanDetailClient } from "./_components/loan-detail-client";

type PageProps = { params: Promise<{ id: string }> };

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Pinjaman"
        description="Informasi lengkap pinjaman dan riwayat pembayaran"
      />
      <LoanDetailClient loanId={id} />
    </div>
  );
}
