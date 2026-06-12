import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { generateMetadataPagination } from "@/utils";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import z from "zod";

export type DonorSummary = {
  total: number;
  memberTotal: number;
  nonMemberTotal: number;
  totalDonated: number;
};

const createDonorSchema = z.object({
  name: z.string().min(2, "Nama donatur minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email tidak valid").optional().nullable(),
  address: z.string().optional().nullable(),
  isMember: z.boolean(),
  memberId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:donor")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;
    const isMember = searchParams.get("isMember") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isMember !== null &&
        isMember !== undefined && { isMember: isMember === "true" }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999") }),
        },
      }),
    };

    const [donors, memberTotal, nonMemberTotal, total, donatedResult] =
      await prisma.$transaction([
        prisma.donor.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            member: { select: { id: true, fullName: true } },
          },
        }),
        prisma.donor.count({
          where: { ...where, isMember: true },
        }),
        prisma.donor.count({
          where: { ...where, isMember: false },
        }),
        prisma.donor.count({ where }),
        prisma.donor.aggregate({
          where: { organizationId: orgId, deletedAt: null },
          _sum: { totalDonated: true },
        }),
      ]);

    const summary: DonorSummary = {
      total,
      memberTotal,
      nonMemberTotal,
      totalDonated: Number(donatedResult._sum.totalDonated ?? 0),
    };

    const metadata = generateMetadataPagination(page, limit, total);

    return ApiResponseBuilder.success(
      { summary, data: donors },
      "Donors fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    console.error("GET /api/donors", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:donor")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createDonorSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, phone, email, address, isMember, memberId, notes } =
      result.data;
    const orgId = authUser.activeOrganization.id;

    // If isMember, validate memberId exists and belongs to org
    if (isMember && memberId) {
      const member = await prisma.member.findFirst({
        where: { id: memberId, organizationId: orgId, deletedAt: null },
      });
      if (!member) return ApiResponseBuilder.notFound("Member");
    }

    const donor = await prisma.donor.create({
      data: {
        name,
        phone: phone ?? null,
        email: email ?? null,
        address: address ?? null,
        isMember,
        memberId: isMember ? memberId ?? null : null,
        notes: notes ?? null,
        organizationId: orgId,
        createdBy: authUser.id,
      },
      include: {
        member: { select: { id: true, fullName: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_donor",
      subject: "donor",
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      donor,
      "Donor created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("POST /api/donors", error);
    return ApiResponseBuilder.internalError();
  }
}
