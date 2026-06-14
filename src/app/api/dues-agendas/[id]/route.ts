// src/app/api/dues-agendas/[id]/route.ts
// ============================================================
// GET    /api/dues-agendas/:id  (requires read:duesAgenda)
// PATCH  /api/dues-agendas/:id  (requires update:duesAgenda)
// DELETE /api/dues-agendas/:id  (requires delete:duesAgenda)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import type { DuesPaymentSummary } from "@/types";

const updateDuesAgendaSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["MANDATORY", "VOLUNTARY"]).optional(),
  amount: z.number().min(0).optional().nullable(),
  periodMonth: z.number().int().min(1).max(12).optional().nullable(),
  periodYear: z.number().int().min(2000).max(2100).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  rates: z
    .array(
      z.object({
        memberStatusTypeId: z.string().uuid(),
        amount: z.number().min(0),
        effectiveDate: z.string().min(1),
      })
    )
    .optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:duesAgenda")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id } = await params;
    const orgId = authUser.activeOrganization.id;

    const agenda = await prisma.duesAgenda.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        rates: {
          where: { deletedAt: null },
          include: {
            memberStatusType: {
              select: { id: true, name: true, color: true },
            },
          },
          orderBy: { amount: "desc" },
        },
        _count: {
          select: {
            payments: { where: { deletedAt: null } },
            rates: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!agenda) return ApiResponseBuilder.notFound("Dues Agenda");

    // Payment summary
    const [totalMembers, paidCount, collectedResult] = await Promise.all([
      prisma.memberDuesPayment.count({
        where: { duesAgendaId: id, deletedAt: null },
      }),
      prisma.memberDuesPayment.count({
        where: { duesAgendaId: id, status: "PAID", deletedAt: null },
      }),
      prisma.memberDuesPayment.aggregate({
        where: { duesAgendaId: id, status: "PAID", deletedAt: null },
        _sum: { paidAmount: true },
      }),
    ]);

    const summary: DuesPaymentSummary = {
      totalMembers,
      paid: paidCount,
      unpaid: totalMembers - paidCount,
      totalCollected: Number(collectedResult._sum.paidAmount ?? 0),
    };

    return ApiResponseBuilder.success(
      { ...agenda, _summary: summary },
      "Dues agenda fetched successfully.",
      200
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/dues-agendas/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(
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

    const existing = await prisma.duesAgenda.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return ApiResponseBuilder.notFound("Dues Agenda");

    const body: unknown = await request.json();
    const result = updateDuesAgendaSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { rates, ...updateData } = result.data;

    const agenda = await prisma.$transaction(async (tx) => {
      // If rates provided, hard-delete old rates then create new ones
      // (soft-delete won't work due to @@unique constraint on duesAgendaId+memberStatusTypeId)
      if (rates) {
        await tx.duesAgendaRate.deleteMany({
          where: { duesAgendaId: id },
        });

        if (rates.length > 0) {
          await tx.duesAgendaRate.createMany({
            data: rates.map((r) => ({
              duesAgendaId: id,
              memberStatusTypeId: r.memberStatusTypeId,
              amount: r.amount,
              effectiveDate: new Date(r.effectiveDate),
              createdBy: authUser.id,
            })),
          });
        }
      }

      return tx.duesAgenda.update({
        where: { id },
        data: {
          ...(updateData.title !== undefined
            ? { title: updateData.title }
            : {}),
          ...(updateData.description !== undefined
            ? { description: updateData.description }
            : {}),
          ...(updateData.type !== undefined ? { type: updateData.type } : {}),
          ...(updateData.amount !== undefined
            ? { amount: updateData.amount }
            : {}),
          ...(updateData.periodMonth !== undefined
            ? { periodMonth: updateData.periodMonth }
            : {}),
          ...(updateData.periodYear !== undefined
            ? { periodYear: updateData.periodYear }
            : {}),
          ...(updateData.dueDate !== undefined
            ? {
                dueDate: updateData.dueDate
                  ? new Date(updateData.dueDate)
                  : null,
              }
            : {}),
          ...(updateData.isActive !== undefined
            ? { isActive: updateData.isActive }
            : {}),
          updatedBy: authUser.id,
        },
        include: {
          rates: {
            where: { deletedAt: null },
            include: {
              memberStatusType: {
                select: { id: true, name: true, color: true },
              },
            },
          },
          _count: { select: { payments: true, rates: true } },
        },
      });
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_dues_agenda",
      subject: "duesAgenda",
      subjectId: id,
      oldValues: existing,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      agenda,
      "Dues agenda updated successfully.",
      200
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PATCH /api/dues-agendas/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:duesAgenda")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id } = await params;
    const orgId = authUser.activeOrganization.id;

    const existing = await prisma.duesAgenda.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return ApiResponseBuilder.notFound("Dues Agenda");

    await prisma.duesAgenda.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "delete_dues_agenda",
      subject: "duesAgenda",
      subjectId: id,
      oldValues: existing,
      request: _request,
    });

    return ApiResponseBuilder.success(
      null,
      "Dues agenda deleted successfully.",
      200
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[DELETE /api/dues-agendas/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
