// src/app/api/dues-agendas/[id]/payments/route.ts
// ============================================================
// GET /api/dues-agendas/:id/payments
// List all payments for a dues agenda
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";
import { generateMetadataPagination } from "@/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:memberDuesPayment")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id } = await params;
    const orgId = authUser.activeOrganization.id;
    const { searchParams } = request.nextUrl;

    // Verify agenda belongs to org
    const agenda = await prisma.duesAgenda.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!agenda) return ApiResponseBuilder.notFound("Dues Agenda");

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      200,
      Math.max(1, Number(searchParams.get("limit") ?? "50"))
    );
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const skip = (page - 1) * limit;

    const where = {
      duesAgendaId: id,
      deletedAt: null,
      ...(status && { status: status as "UNPAID" | "PAID" }),
      ...(search && {
        member: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            {
              memberNumber: { contains: search, mode: "insensitive" as const },
            },
          ],
        },
      }),
    };

    const [payments, total] = await prisma.$transaction([
      prisma.memberDuesPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              memberNumber: true,
              status: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
      }),
      prisma.memberDuesPayment.count({ where }),
    ]);

    const metadata = generateMetadataPagination(page, limit, total);

    return ApiResponseBuilder.success(
      payments,
      "Dues payments fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/dues-agendas/:id/payments]", error);
    return ApiResponseBuilder.internalError();
  }
}
