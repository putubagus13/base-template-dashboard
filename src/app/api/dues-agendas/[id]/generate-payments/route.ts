// src/app/api/dues-agendas/[id]/generate-payments/route.ts
// ============================================================
// POST /api/dues-agendas/:id/generate-payments
// Auto-generate MemberDuesPayment for all active members
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:duesAgenda")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id } = await params;
    const orgId = authUser.activeOrganization.id;

    const agenda = await prisma.duesAgenda.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { rates: { where: { deletedAt: null } } },
    });
    if (!agenda) return ApiResponseBuilder.notFound("Dues Agenda");

    // Get all active members
    const members = await prisma.member.findMany({
      where: { organizationId: orgId, isActive: true, deletedAt: null },
      select: { id: true, statusId: true },
    });

    // Get existing payments for this agenda
    const existingPayments = await prisma.memberDuesPayment.findMany({
      where: { duesAgendaId: id, deletedAt: null },
      select: { memberId: true },
    });
    const existingSet = new Set(existingPayments.map((p) => p.memberId));

    // Build rate map for MANDATORY type
    const rateMap = new Map<string, number>();
    if (agenda.type === "MANDATORY") {
      for (const rate of agenda.rates) {
        rateMap.set(rate.memberStatusTypeId, Number(rate.amount));
      }
    }

    // Filter out members who already have payments
    const newMembers = members.filter((m) => !existingSet.has(m.id));

    if (newMembers.length === 0) {
      return ApiResponseBuilder.success(
        { generated: 0, skipped: members.length },
        "All members already have payment records for this agenda.",
        200
      );
    }

    // Create payment records
    const paymentData = newMembers.map((member) => {
      let amount = 0;
      if (agenda.type === "MANDATORY") {
        amount = member.statusId ? rateMap.get(member.statusId) ?? 0 : 0;
      } else {
        amount = Number(agenda.amount ?? 0);
      }

      return {
        duesAgendaId: id,
        memberId: member.id,
        amount,
        createdBy: authUser.id,
      };
    });

    await prisma.memberDuesPayment.createMany({ data: paymentData });

    await writeAuditLog({
      userId: authUser.id,
      action: "generate_dues_payments",
      subject: "duesAgenda",
      subjectId: id,
      newValues: { generated: newMembers.length, agendaId: id },
      request,
    });

    return ApiResponseBuilder.success(
      { generated: newMembers.length, skipped: existingSet.size },
      `Generated ${newMembers.length} payment records.`,
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[POST /api/dues-agendas/:id/generate-payments]", error);
    return ApiResponseBuilder.internalError();
  }
}
