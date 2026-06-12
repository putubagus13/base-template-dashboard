import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { generateMetadataPagination } from "@/utils";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import z from "zod";
import { CashAccount } from "@prisma/client";

export type CashAccountSummary = {
  total: number;
  activeTotal: number;
  inactiveTotal: number;
};

const createCashAccountSchema = z.object({
  name: z.string().min(2, "Nama akun kas minimal 2 karakter"),
  description: z.string().optional().nullable(),
  balance: z.number().min(0, "Saldo awal tidak boleh negatif").optional(),
  isActive: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "read:cashAccount")) {
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
    const isActive = searchParams.get("isActive") ?? undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [accounts, activeTotal, inactiveTotal, total] =
      await prisma.$transaction([
        prisma.cashAccount.findMany({
          where: {
            ...where,
            organizationId: orgId,
            ...(isActive !== null &&
              isActive !== undefined && { isActive: isActive === "true" }),
            deletedAt: null,
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.cashAccount.count({
          where: {
            ...where,
            organizationId: orgId,
            deletedAt: null,
            isActive: true,
          },
        }),
        prisma.cashAccount.count({
          where: {
            ...where,
            organizationId: orgId,
            isActive: false,
            deletedAt: null,
          },
        }),
        prisma.cashAccount.count({
          where: {
            ...where,
            organizationId: orgId,
            deletedAt: null,
          },
        }),
      ]);

    const response: { summary: CashAccountSummary; data: CashAccount[] } = {
      summary: {
        total: total,
        activeTotal: activeTotal,
        inactiveTotal: inactiveTotal,
      },
      data: accounts,
    };

    const metadata = generateMetadataPagination(page, limit, total);

    return ApiResponseBuilder.success(
      response,
      "Cash accounts fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    console.error("GET /api/cash-accounts", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:cashAccount")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createCashAccountSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, description, balance, isActive } = result.data;

    const existing = await prisma.cashAccount.findFirst({
      where: {
        name: { contains: name, mode: "insensitive" as const },
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });

    if (existing) {
      return ApiResponseBuilder.conflict(
        "Cash account with the same name already exists."
      );
    }

    const account = await prisma.cashAccount.create({
      data: {
        name,
        description: description ?? null,
        balance: balance ?? 0,
        isActive,
        organizationId: authUser.activeOrganization.id,
        createdBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_cash_account",
      subject: "cashAccount",
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      account,
      "Cash account created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("POST /api/cash-accounts", error);
    return ApiResponseBuilder.internalError();
  }
}
