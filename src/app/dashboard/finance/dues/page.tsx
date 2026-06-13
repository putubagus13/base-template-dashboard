// src/app/dashboard/finance/dues/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { DuesAgendaList } from "./_components/dues-agenda-list";

export default function DuesAgendaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Iuran Anggota"
        description="Kelola agenda iuran dan pembayaran anggota"
      />
      <DuesAgendaList />
    </div>
  );
}
