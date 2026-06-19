// src/app/api/borrowers/search/route.ts
import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:loan")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") ?? "";

    if (!q || q.length < 1) {
      return ApiResponseBuilder.success([], "No query provided.");
    }

    const borrowers = await prisma.borrower.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        isMember: true,
        memberId: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return ApiResponseBuilder.success(borrowers, "Borrower search results.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("GET /api/borrowers/search", error);
    return ApiResponseBuilder.internalError();
  }
}
