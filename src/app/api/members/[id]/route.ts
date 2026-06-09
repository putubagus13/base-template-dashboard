import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:member")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) return ApiResponseBuilder.notFound("Member");

    //soft delete
    await prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: authUser.id,
      },
    });

    return ApiResponseBuilder.success(null, "Member deleted successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[DELETE /api/members/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
