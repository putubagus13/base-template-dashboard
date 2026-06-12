import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export type LeaderboardDonor = {
  id: string;
  name: string;
  totalDonated: number;
  isMember: boolean;
  member: { id: string; fullName: string } | null;
};

export async function GET() {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:donor")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const donors = await prisma.donor.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        totalDonated: { gt: 0 },
      },
      orderBy: { totalDonated: "desc" },
      take: 3,
      include: {
        member: { select: { id: true, fullName: true } },
      },
    });

    const leaderboard: LeaderboardDonor[] = donors.map((d) => ({
      id: d.id,
      name: d.name,
      totalDonated: Number(d.totalDonated),
      isMember: d.isMember,
      member: d.member,
    }));

    return ApiResponseBuilder.success(
      leaderboard,
      "Leaderboard fetched successfully."
    );
  } catch (error) {
    console.error("GET /api/donors/leaderboard", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
