// src/app/dashboard/attendance/meetings/[id]/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { MeetingDetailClient } from "./_components/meeting-detail-client";

export const metadata: Metadata = { title: "Detail Rapat" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:meeting")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <MeetingDetailClient meetingId={id} />
    </div>
  );
}
