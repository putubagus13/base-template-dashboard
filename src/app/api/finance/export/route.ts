// src/app/api/finance/export/route.ts
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";
import { prisma } from "@/lib/db/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { toLocalDateString } from "@/utils";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

const typeLabel: Record<string, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
};

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

function applyHeaderStyle(sheet: ExcelJS.Worksheet) {
  const headerFill: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  };
  const headerAlignment: Partial<ExcelJS.Alignment> = {
    vertical: "middle",
    horizontal: "center",
  };
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  headerRow.height = 24;
}

function applyRowBorders(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:cashTransaction")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const accountId = searchParams.get("accountId") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const verificationStatus =
      searchParams.get("verificationStatus") ?? undefined;

    // Build transaction where clause
    const txWhere: Record<string, unknown> = {
      organizationId: orgId,
      deletedAt: null,
    };
    if (dateFrom) {
      txWhere.transactionDate = {
        ...(txWhere.transactionDate as Record<string, Date> | undefined),
        gte: new Date(dateFrom),
      };
    }
    if (dateTo) {
      txWhere.transactionDate = {
        ...(txWhere.transactionDate as Record<string, Date> | undefined),
        lte: new Date(dateTo),
      };
    }
    if (accountId) txWhere.accountId = accountId;
    if (type) txWhere.type = type as TransactionType;
    if (verificationStatus)
      txWhere.verificationStatus = verificationStatus as TransactionStatus;

    const [transactions, accounts] = await prisma.$transaction([
      prisma.cashTransaction.findMany({
        where: txWhere,
        orderBy: { transactionDate: "desc" },
        include: {
          account: { select: { name: true } },
          category: { select: { name: true } },
          recorder: { select: { name: true } },
          verifier: { select: { name: true } },
          donor: { select: { name: true } },
        },
      }),
      prisma.cashAccount.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          balance: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Dashboard Template";
    workbook.created = new Date();

    // ─── Sheet 1: Detail Transaksi ─────────────────────────────
    const txSheet = workbook.addWorksheet("Detail Transaksi");
    txSheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal", key: "date", width: 14 },
      { header: "Tipe", key: "type", width: 14 },
      { header: "Deskripsi", key: "description", width: 32 },
      { header: "Jumlah", key: "amount", width: 18 },
      { header: "Rekening", key: "account", width: 20 },
      { header: "Kategori", key: "category", width: 18 },
      { header: "Donatur", key: "donor", width: 20 },
      { header: "No. Referensi", key: "referenceNo", width: 18 },
      { header: "Dicatat Oleh", key: "recorder", width: 18 },
      { header: "Status Verifikasi", key: "status", width: 16 },
      { header: "Diverifikasi Oleh", key: "verifier", width: 18 },
      { header: "Catatan", key: "notes", width: 28 },
    ];
    applyHeaderStyle(txSheet);

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx, index) => {
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") totalIncome += amount;
      if (tx.type === "EXPENSE") totalExpense += amount;

      const row = txSheet.addRow({
        no: index + 1,
        date: toLocalDateString(tx.transactionDate),
        type: typeLabel[tx.type] ?? tx.type,
        description: tx.description,
        amount: formatCurrency(amount),
        account: tx.account.name,
        category: tx.category?.name ?? "-",
        donor: tx.donor?.name ?? "-",
        referenceNo: tx.referenceNo ?? "-",
        recorder: tx.recorder.name,
        status: statusLabel[tx.verificationStatus] ?? tx.verificationStatus,
        verifier: tx.verifier?.name ?? "-",
        notes: tx.notes ?? "-",
      });
      applyRowBorders(row);
    });

    // Summary row
    const summaryRow = txSheet.addRow({
      no: "",
      date: "",
      type: "",
      description: "",
      amount: "",
      account: "",
      category: "",
      donor: "",
      referenceNo: "",
      recorder: "",
      status: "",
      verifier: "",
      notes: "",
    });
    applyRowBorders(summaryRow);

    const totalRow1 = txSheet.addRow({
      no: "",
      date: "",
      type: "TOTAL PEMASUKAN",
      description: "",
      amount: formatCurrency(totalIncome),
      account: "",
      category: "",
      donor: "",
      referenceNo: "",
      recorder: "",
      status: "",
      verifier: "",
      notes: "",
    });
    totalRow1.getCell(3).font = { bold: true };
    totalRow1.getCell(5).font = { bold: true, color: { argb: "FF059669" } };
    applyRowBorders(totalRow1);

    const totalRow2 = txSheet.addRow({
      no: "",
      date: "",
      type: "TOTAL PENGELUARAN",
      description: "",
      amount: formatCurrency(totalExpense),
      account: "",
      category: "",
      donor: "",
      referenceNo: "",
      recorder: "",
      status: "",
      verifier: "",
      notes: "",
    });
    totalRow2.getCell(3).font = { bold: true };
    totalRow2.getCell(5).font = { bold: true, color: { argb: "FFDC2626" } };
    applyRowBorders(totalRow2);

    const netRow = txSheet.addRow({
      no: "",
      date: "",
      type: "SELISIH",
      description: "",
      amount: formatCurrency(totalIncome - totalExpense),
      account: "",
      category: "",
      donor: "",
      referenceNo: "",
      recorder: "",
      status: "",
      verifier: "",
      notes: "",
    });
    netRow.getCell(3).font = { bold: true };
    netRow.getCell(5).font = { bold: true };
    applyRowBorders(netRow);

    // Auto-filter
    txSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: txSheet.columns.length },
    };

    // ─── Sheet 2: Saldo Rekening ─────────────────────────────
    const accSheet = workbook.addWorksheet("Saldo Rekening");
    accSheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Rekening", key: "name", width: 28 },
      { header: "Deskripsi", key: "description", width: 35 },
      { header: "Saldo", key: "balance", width: 22 },
      { header: "Status", key: "isActive", width: 14 },
    ];
    applyHeaderStyle(accSheet);

    let totalBalance = 0;
    accounts.forEach((acc, index) => {
      const balance = Number(acc.balance);
      totalBalance += balance;
      const row = accSheet.addRow({
        no: index + 1,
        name: acc.name,
        description: acc.description ?? "-",
        balance: formatCurrency(balance),
        isActive: acc.isActive ? "Aktif" : "Nonaktif",
      });
      applyRowBorders(row);
    });

    // Total balance row
    const accEmptyRow = accSheet.addRow({});
    applyRowBorders(accEmptyRow);

    const totalBalanceRow = accSheet.addRow({
      no: "",
      name: "TOTAL SALDO",
      description: "",
      balance: formatCurrency(totalBalance),
      isActive: "",
    });
    totalBalanceRow.getCell(2).font = { bold: true };
    totalBalanceRow.getCell(4).font = { bold: true };
    applyRowBorders(totalBalanceRow);

    // Auto-filter
    accSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: accSheet.columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ringkasan-keuangan-${toLocalDateString()}.xlsx"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("GET /api/finance/export", error);
    return ApiResponseBuilder.internalError();
  }
}
