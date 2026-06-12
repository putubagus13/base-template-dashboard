import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateDonorSchema = z.object({
  name: z.string().min(2, "Nama donatur minimal 2 karakter").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email tidak valid").optional().nullable(),
  address: z.string().optional().nullable(),
  isMember: z.boolean().optional(),
  memberId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "update:donor")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.donor.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Donor");

    const body: unknown = await request.json();
    const result = updateDonorSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, phone, email, address, isMember, memberId, notes } =
      result.data;

    // If updating to member, validate memberId
    if (isMember && memberId) {
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          organizationId: authUser.activeOrganization.id,
          deletedAt: null,
        },
      });
      if (!member) return ApiResponseBuilder.notFound("Member");
    }

    const donor = await prisma.donor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone ?? null }),
        ...(email !== undefined && { email: email ?? null }),
        ...(address !== undefined && { address: address ?? null }),
        ...(isMember !== undefined && { isMember }),
        ...(memberId !== undefined && {
          memberId: isMember ? memberId ?? null : null,
        }),
        ...(notes !== undefined && { notes: notes ?? null }),
        updatedBy: authUser.id,
      },
      include: {
        member: { select: { id: true, fullName: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_donor",
      subject: "donor",
      subjectId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(donor, "Donor updated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[PATCH /api/donors/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "delete:donor")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.donor.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Donor");

    await prisma.donor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: authUser.id,
      },
    });

    return ApiResponseBuilder.success(null, "Donor deleted successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[DELETE /api/donors/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
