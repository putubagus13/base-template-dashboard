import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";

    const where = search
      ? {
          OR: [{ name: { contains: search, mode: "insensitive" as const } }],
        }
      : {};

    const memberStatusType = await prisma.memberStatusType.findMany({
      where: {
        ...where,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    return ApiResponseBuilder.success(
      memberStatusType,
      "Member status types fetched successfully.",
      200
    );
  } catch (error) {
    console.error("GET /api/member", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
