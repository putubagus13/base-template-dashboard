// src/app/dashboard/finance/dues/[id]/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { DuesAgendaDetail } from "./_components/dues-agenda-detail";

export default async function DuesAgendaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Agenda Iuran"
        description="Kelola pembayaran iuran anggota"
      />
      <DuesAgendaDetail agendaId={id} />
    </div>
  );
}
