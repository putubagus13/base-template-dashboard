// src/app/api/member-dues-payments/[id]/pay/route.ts
// ============================================================
// POST /api/member-dues-payments/:id/pay
// Mark a dues payment as PAID and create a cash transaction
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

const payDuesSchema = z.object({
  accountId: z.string().uuid("Akun kas tidak valid"),
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:memberDuesPayment")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id } = await params;

    const body: unknown = await request.json();
    const result = payDuesSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    // Get payment record with agenda and member info
    const payment = await prisma.memberDuesPayment.findFirst({
      where: { id, deletedAt: null },
      include: {
        duesAgenda: { select: { id: true, title: true, organizationId: true } },
        member: { select: { id: true, fullName: true, memberNumber: true } },
      },
    });

    if (!payment) return ApiResponseBuilder.notFound("Payment record");
    if (payment.status === "PAID") {
      return ApiResponseBuilder.error(
        "CONFLICT",
        "Payment has already been marked as paid.",
        409
      );
    }

    const orgId = payment.duesAgenda.organizationId;

    // Verify cash account belongs to org
    const account = await prisma.cashAccount.findFirst({
      where: {
        id: result.data.accountId,
        organizationId: orgId,
        deletedAt: null,
      },
    });
    if (!account) return ApiResponseBuilder.notFound("Cash Account");

    const amount = Number(payment.amount);

    // Create cash transaction + update payment in a transaction
    const [cashTransaction, updatedPayment] = await prisma.$transaction(
      async (tx) => {
        // Create INCOME cash transaction
        const tx_record = await tx.cashTransaction.create({
          data: {
            organizationId: orgId,
            accountId: result.data.accountId,
            categoryId: result.data.categoryId ?? null,
            type: "INCOME",
            amount,
            description: `Iuran: ${payment.duesAgenda.title} - ${payment.member.fullName}`,
            transactionDate: new Date(result.data.transactionDate),
            recordedBy: authUser.id,
            notes: result.data.notes ?? null,
            isVerified: true,
            verificationStatus: "APPROVED",
            verifiedBy: authUser.id,
            verifiedAt: new Date(),
            createdBy: authUser.id,
          },
        });

        // Update cash account balance
        await tx.cashAccount.update({
          where: { id: result.data.accountId },
          data: { balance: { increment: amount } },
        });

        // Update payment record
        const updated = await tx.memberDuesPayment.update({
          where: { id },
          data: {
            status: "PAID",
            paidAmount: amount,
            paidAt: new Date(),
            cashTransactionId: tx_record.id,
            notes: result.data.notes ?? null,
            updatedBy: authUser.id,
          },
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
                memberNumber: true,
              },
            },
          },
        });

        return [tx_record, updated];
      }
    );

    await writeAuditLog({
      userId: authUser.id,
      action: "pay_dues",
      subject: "memberDuesPayment",
      subjectId: id,
      newValues: {
        paymentId: id,
        cashTransactionId: cashTransaction.id,
        amount,
      },
      request,
    });

    return ApiResponseBuilder.success(
      updatedPayment,
      "Dues payment recorded successfully.",
      200
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[POST /api/member-dues-payments/:id/pay]", error);
    return ApiResponseBuilder.internalError();
  }
}
