// src/app/api/borrowers/route.ts
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { NextRequest } from "next/server";
import { createBorrowerSchema } from "@/lib/validations/loan";

const includeRelations = {
  member: {
    select: { id: true, fullName: true, memberNumber: true },
  },
  _count: { select: { loans: true } },
};

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:loan")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;
    const isMember = searchParams.get("isMember");

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isMember !== null && isMember !== undefined
        ? { isMember: isMember === "true" }
        : {}),
    };

    const [borrowers, total] = await prisma.$transaction([
      prisma.borrower.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: includeRelations,
      }),
      prisma.borrower.count({ where }),
    ]);

    return ApiResponseBuilder.success(
      { data: borrowers, total },
      "Borrowers fetched successfully.",
      200,
      { page, limit, total }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("GET /api/borrowers", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:loan")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createBorrowerSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, phone, address, memberId, notes } = result.data;
    const orgId = authUser.activeOrganization.id;

    // Check for duplicate name in same org
    const existing = await prisma.borrower.findFirst({
      where: {
        organizationId: orgId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
    if (existing) {
      return ApiResponseBuilder.conflict(
        "Peminjam dengan nama yang sama sudah ada."
      );
    }

    // Validate member belongs to org if provided
    const isMember = Boolean(memberId);
    if (memberId) {
      const member = await prisma.member.findFirst({
        where: { id: memberId, organizationId: orgId, deletedAt: null },
      });
      if (!member) return ApiResponseBuilder.notFound("Anggota");
    }

    const borrower = await prisma.borrower.create({
      data: {
        organizationId: orgId,
        name,
        phone: phone ?? null,
        address: address ?? null,
        memberId: memberId ?? null,
        isMember,
        notes: notes ?? null,
        createdBy: authUser.id,
      },
      include: includeRelations,
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_borrower",
      subject: "borrower",
      subjectId: borrower.id,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      borrower,
      "Peminjam berhasil ditambahkan.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/borrowers", error);
    return ApiResponseBuilder.internalError();
  }
}
