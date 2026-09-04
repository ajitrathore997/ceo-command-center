import { NextResponse } from "next/server";
import { CampaignStatus } from "@/generated/prisma/client";
import { requireAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getStartOfWeek() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));
  return startOfWeek;
}

export async function GET(request: Request) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  try {
    const now = new Date();
    const [activeCampaignCount, weeklyLeads, leadSources, campaigns] =
      await Promise.all([
        prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
        prisma.campaign.aggregate({
          where: { createdAt: { gte: getStartOfWeek(), lte: now } },
          _sum: { leadsGenerated: true },
        }),
        prisma.campaign.groupBy({
          by: ["leadSource"],
          _sum: { leadsGenerated: true },
          orderBy: { _sum: { leadsGenerated: "desc" } },
          take: 1,
        }),
        prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
      ]);

    return NextResponse.json({
      summary: {
        activeCampaignCount,
        leadsGeneratedThisWeek: weeklyLeads._sum.leadsGenerated ?? 0,
        topLeadSource: leadSources[0]?.leadSource ?? null,
      },
      campaigns,
    });
  } catch (error) {
    console.error("Marketing request failed:", error);

    return NextResponse.json(
      { error: "Unable to load marketing data right now." },
      { status: 500 },
    );
  }
}
