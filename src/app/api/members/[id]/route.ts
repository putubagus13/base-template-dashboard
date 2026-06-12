import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateMemberSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  statusId: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

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

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "update:member")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.member.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Member");

    const body: unknown = await request.json();
    const result = updateMemberSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const {
      fullName,
      gender,
      dateOfBirth,
      address,
      phone,
      position,
      statusId,
      joinDate,
      occupation,
      notes,
      isActive,
    } = result.data;

    // Check duplicate name/memberNumber if changed
    if (fullName) {
      const duplicate = await prisma.member.findFirst({
        where: {
          id: { not: id },
          organizationId: authUser.activeOrganization.id,
          deletedAt: null,
          OR: [
            ...(fullName
              ? [
                  {
                    fullName: {
                      contains: fullName,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
      });
      if (duplicate) {
        return ApiResponseBuilder.conflict(
          "Member with the same name or member number already exists."
        );
      }
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(gender !== undefined && { gender }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(address !== undefined && { address: address ?? null }),
        ...(phone !== undefined && { phone: phone ?? null }),
        ...(position !== undefined && { position: position ?? null }),
        ...(statusId !== undefined && { statusId: statusId ?? null }),
        ...(joinDate !== undefined && {
          joinDate: joinDate ? new Date(joinDate) : null,
        }),
        ...(occupation !== undefined && { occupation: occupation ?? null }),
        ...(notes !== undefined && { notes: notes ?? null }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_member",
      subject: "member",
      oldValues: existing,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(member, "Member updated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[PATCH /api/members/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
