// src/app/api/members/export/route.ts
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { toLocalDateString } from "@/utils";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:member")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const statusId = searchParams.get("statusId") ?? undefined;
    const isActive = searchParams.get("isActive") ?? undefined;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const members = await prisma.member.findMany({
      where: {
        ...where,
        organizationId: orgId,
        ...(statusId && { statusId }),
        ...(isActive !== null && isActive !== undefined
          ? { isActive: isActive === "true" }
          : {}),
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        status: { select: { name: true } },
      },
    });

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Dashboard Template";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Daftar Anggota");

    // Header styling
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

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "No. Anggota", key: "memberNumber", width: 18 },
      { header: "Nama Lengkap", key: "fullName", width: 28 },
      { header: "Jenis Kelamin", key: "gender", width: 15 },
      { header: "Tanggal Lahir", key: "dateOfBirth", width: 16 },
      { header: "Telepon", key: "phone", width: 18 },
      { header: "Alamat", key: "address", width: 35 },
      { header: "Posisi", key: "position", width: 18 },
      { header: "Status", key: "statusName", width: 16 },
      { header: "Pekerjaan", key: "occupation", width: 18 },
      { header: "Tanggal Bergabung", key: "joinDate", width: 18 },
      { header: "Poin Aktivitas", key: "activityPoint", width: 14 },
      { header: "Status Keanggotaan", key: "isActive", width: 20 },
      { header: "Catatan", key: "notes", width: 30 },
    ];

    // Apply header styling
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

    // Add data rows
    const genderLabel: Record<string, string> = {
      MALE: "Laki-laki",
      FEMALE: "Perempuan",
      OTHER: "Lainnya",
    };

    members.forEach((member, index) => {
      const row = sheet.addRow({
        no: index + 1,
        memberNumber: member.memberNumber,
        fullName: member.fullName,
        gender: genderLabel[member.gender] ?? member.gender,
        dateOfBirth: member.dateOfBirth
          ? toLocalDateString(member.dateOfBirth)
          : "-",
        phone: member.phone ?? "-",
        address: member.address ?? "-",
        position: member.position ?? "-",
        statusName: member.status?.name ?? "-",
        occupation: member.occupation ?? "-",
        joinDate: member.joinDate ? toLocalDateString(member.joinDate) : "-",
        activityPoint: member.activityPoint,
        isActive: member.isActive ? "Aktif" : "Tidak Aktif",
        notes: member.notes ?? "-",
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daftar-anggota-${toLocalDateString()}.xlsx"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("GET /api/members/export", error);
    return ApiResponseBuilder.internalError();
  }
}
