// src/app/api/dues-agendas/route.ts
// ============================================================
// GET  /api/dues-agendas  (requires read:duesAgenda)
// POST /api/dues-agendas  (requires create:duesAgenda)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { generateMetadataPagination } from "@/utils";
import { writeAuditLog } from "@/lib/audit";
import type { DuesPaymentSummary } from "@/types";

const createDuesAgendaSchema = z.object({
  title: z.string().min(2, "Judul agenda minimal 2 karakter"),
  description: z.string().optional().nullable(),
  type: z.enum(["MANDATORY", "VOLUNTARY"]),
  amount: z.number().min(0).optional().nullable(),
  periodMonth: z.number().int().min(1).max(12).optional().nullable(),
  periodYear: z.number().int().min(2000).max(2100).optional().nullable(),
  dueDate: z.string().optional().nullable(),
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

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:duesAgenda")) {
      return ApiResponseBuilder.forbidden();
    }
    const orgId = authUser.activeOrganization.id;
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const search = searchParams.get("search") ?? "";
    const type = searchParams.get("type") ?? undefined;
    const isActive = searchParams.get("isActive") ?? undefined;
    const periodMonth = searchParams.get("periodMonth") ?? undefined;
    const periodYear = searchParams.get("periodYear") ?? undefined;
    const skip = (page - 1) * limit;

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
      ...(type && { type: type as "MANDATORY" | "VOLUNTARY" }),
      ...(isActive !== null &&
        isActive !== undefined && { isActive: isActive === "true" }),
      ...(periodMonth && { periodMonth: Number(periodMonth) }),
      ...(periodYear && { periodYear: Number(periodYear) }),
    };

    const [agendas, total] = await prisma.$transaction([
      prisma.duesAgenda.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          rates: {
            include: {
              memberStatusType: {
                select: { id: true, name: true, color: true },
              },
            },
            where: { deletedAt: null },
          },
          _count: {
            select: {
              payments: { where: { deletedAt: null } },
              rates: { where: { deletedAt: null } },
            },
          },
        },
      }),
      prisma.duesAgenda.count({ where }),
    ]);

    // Compute summary per agenda
    const agendaIds = agendas.map((a) => a.id);
    const paymentAgg = await prisma.memberDuesPayment.groupBy({
      by: ["duesAgendaId"],
      where: {
        duesAgendaId: { in: agendaIds },
        deletedAt: null,
      },
      _count: { id: true },
      _sum: { paidAmount: true },
    });

    const paidCountByAgenda = await prisma.memberDuesPayment.groupBy({
      by: ["duesAgendaId"],
      where: {
        duesAgendaId: { in: agendaIds },
        status: "PAID",
        deletedAt: null,
      },
      _count: { id: true },
    });

    const paidMap = new Map(
      paidCountByAgenda.map((p) => [p.duesAgendaId, p._count.id])
    );
    const totalMap = new Map(
      paymentAgg.map((p) => [p.duesAgendaId, p._count.id])
    );
    const collectedMap = new Map(
      paymentAgg.map((p) => [p.duesAgendaId, Number(p._sum.paidAmount ?? 0)])
    );

    const data = agendas.map((agenda) => {
      const totalMembers = totalMap.get(agenda.id) ?? 0;
      const paid = paidMap.get(agenda.id) ?? 0;
      const summary: DuesPaymentSummary = {
        totalMembers,
        paid,
        unpaid: totalMembers - paid,
        totalCollected: collectedMap.get(agenda.id) ?? 0,
      };
      return { ...agenda, _summary: summary };
    });

    const metadata = generateMetadataPagination(page, limit, total);

    return ApiResponseBuilder.success(
      data,
      "Dues agendas fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/dues-agendas]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:duesAgenda")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createDuesAgendaSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const orgId = authUser.activeOrganization.id;
    const { rates, ...agendaData } = result.data;

    // Validate rates for MANDATORY type
    if (result.data.type === "MANDATORY" && rates && rates.length > 0) {
      const statusTypeIds = rates.map((r) => r.memberStatusTypeId);
      const validTypes = await prisma.memberStatusType.findMany({
        where: {
          id: { in: statusTypeIds },
          organizationId: orgId,
          deletedAt: null,
        },
      });
      if (validTypes.length !== statusTypeIds.length) {
        return ApiResponseBuilder.error(
          "VALIDATION_ERROR",
          "One or more member status types are invalid.",
          400
        );
      }
    }

    const agenda = await prisma.duesAgenda.create({
      data: {
        title: agendaData.title,
        description: agendaData.description ?? null,
        type: agendaData.type,
        amount: agendaData.amount ?? null,
        periodMonth: agendaData.periodMonth ?? null,
        periodYear: agendaData.periodYear ?? null,
        dueDate: agendaData.dueDate ? new Date(agendaData.dueDate) : null,
        organizationId: orgId,
        createdBy: authUser.id,
        ...(rates && rates.length > 0
          ? {
              rates: {
                create: rates.map((r) => ({
                  memberStatusTypeId: r.memberStatusTypeId,
                  amount: r.amount,
                  effectiveDate: new Date(r.effectiveDate),
                  createdBy: authUser.id,
                })),
              },
            }
          : {}),
      },
      include: {
        rates: {
          include: {
            memberStatusType: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        _count: { select: { payments: true, rates: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_dues_agenda",
      subject: "duesAgenda",
      subjectId: agenda.id,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      agenda,
      "Dues agenda created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[POST /api/dues-agendas]", error);
    return ApiResponseBuilder.internalError();
  }
}
