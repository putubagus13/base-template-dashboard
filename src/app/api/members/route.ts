import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { generateMetadataPagination } from "@/utils";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { MemberProfile, MemberSummary } from "@/hooks/use-members";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "read:member")) {
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
    const statusId = searchParams.get("statusId") ?? undefined;
    const isActive = searchParams.get("isActive") ?? undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [members, activeTotal, inactiveTotal, total] =
      await prisma.$transaction([
        prisma.member.findMany({
          where: {
            ...where,
            organizationId: orgId,
            ...(statusId && { statusId }),
            ...(isActive && { isActive: isActive === "true" }),
            deletedAt: null,
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.member.count({
          where: {
            ...where,
            organizationId: orgId,
            ...(statusId && { statusId }),
            deletedAt: null,
            isActive: true,
          },
        }),
        prisma.member.count({
          where: {
            ...where,
            organizationId: orgId,
            ...(statusId && { statusId }),
            isActive: false,
            deletedAt: null,
          },
        }),
        prisma.member.count({
          where: {
            ...where,
            organizationId: orgId,
            ...(statusId && { statusId }),
            deletedAt: null,
          },
        }),
      ]);

    const response: { summary: MemberSummary; data: MemberProfile[] } = {
      summary: {
        total: total,
        activeTotal: activeTotal,
        inactiveTotal: inactiveTotal,
      },
      data: members,
    };

    const metadata = generateMetadataPagination(page, limit, total);

    return ApiResponseBuilder.success(
      response,
      "Members fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    console.error("GET /api/member", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
