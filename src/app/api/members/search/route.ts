import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

export type MemberSearchResult = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:member")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") ?? "";
    const take = Math.min(
      20,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );

    if (!q) {
      return ApiResponseBuilder.success([], "No query provided.");
    }

    const members = await prisma.member.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        deletedAt: null,
        OR: [
          { fullName: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      take,
      orderBy: { fullName: "asc" },
    });

    return ApiResponseBuilder.success(members, "Members fetched successfully.");
  } catch (error) {
    console.error("GET /api/members/search", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
