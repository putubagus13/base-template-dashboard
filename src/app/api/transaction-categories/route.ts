import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { generateMetadataPagination } from "@/utils";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import z from "zod";
import { TransactionCategory } from "@prisma/client";

export type TransactionCategorySummary = {
  total: number;
  activeTotal: number;
  inactiveTotal: number;
};

const createTransactionCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:transactionCategory")) {
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
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [categories, activeTotal, inactiveTotal, total] =
      await prisma.$transaction([
        prisma.transactionCategory.findMany({
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
        prisma.transactionCategory.count({
          where: {
            ...where,
            organizationId: orgId,
            deletedAt: null,
            isActive: true,
          },
        }),
        prisma.transactionCategory.count({
          where: {
            ...where,
            organizationId: orgId,
            isActive: false,
            deletedAt: null,
          },
        }),
        prisma.transactionCategory.count({
          where: { ...where, organizationId: orgId, deletedAt: null },
        }),
      ]);

    const response: {
      summary: TransactionCategorySummary;
      data: TransactionCategory[];
    } = {
      summary: { total, activeTotal, inactiveTotal },
      data: categories,
    };

    const metadata = generateMetadataPagination(page, limit, total);
    return ApiResponseBuilder.success(
      response,
      "Categories fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    console.error("GET /api/transaction-categories", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:transactionCategory")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createTransactionCategorySchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, description, color, isActive } = result.data;

    const existing = await prisma.transactionCategory.findFirst({
      where: {
        name: { contains: name, mode: "insensitive" as const },
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (existing) {
      return ApiResponseBuilder.conflict(
        "Category with the same name already exists."
      );
    }

    const category = await prisma.transactionCategory.create({
      data: {
        name,
        description: description ?? null,
        color: color ?? null,
        isActive,
        organizationId: authUser.activeOrganization.id,
        createdBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_transaction_category",
      subject: "transactionCategory",
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      category,
      "Category created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/transaction-categories", error);
    return ApiResponseBuilder.internalError();
  }
}
