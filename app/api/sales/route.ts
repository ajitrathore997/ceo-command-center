import { NextResponse } from "next/server";
import { DealStatus } from "@/generated/prisma/client";
import { requireAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dealSelect = {
  id: true,
  title: true,
  value: true,
  status: true,
  createdAt: true,
  closedAt: true,
  salesperson: { select: { id: true, name: true, email: true } },
} as const;

const toDealResponse = (deal: {
  id: string;
  title: string;
  value: { toNumber(): number };
  status: DealStatus;
  createdAt: Date;
  closedAt: Date | null;
  salesperson: { id: string; name: string; email: string };
}) => ({
  ...deal,
  value: deal.value.toNumber(),
});

export async function GET(request: Request) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  try {
    const [activeDeals, pipeline, recentlyClosedDeals] = await Promise.all([
      prisma.deal.findMany({
        where: { status: DealStatus.ACTIVE },
        select: dealSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.deal.aggregate({
        where: { status: DealStatus.ACTIVE },
        _sum: { value: true },
      }),
      prisma.deal.findMany({
        where: { status: { in: [DealStatus.WON, DealStatus.LOST] } },
        select: dealSelect,
        orderBy: { closedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      summary: {
        activeDealCount: activeDeals.length,
        pipelineValue: pipeline._sum.value?.toNumber() ?? 0,
      },
      activeDeals: activeDeals.map(toDealResponse),
      recentlyClosedDeals: recentlyClosedDeals.map(toDealResponse),
    });
  } catch (error) {
    console.error("Sales request failed:", error);

    return NextResponse.json(
      { error: "Unable to load sales data right now." },
      { status: 500 },
    );
  }
}
