import { NextResponse } from "next/server";
import { DealStatus } from "@/generated/prisma/client";
import { requireAuthentication, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdateDealRequest = {
  status?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidDealId(id: string) {
  return /^c[a-z0-9]{8,}$/i.test(id);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  const authorization = requireRole(authentication.user, "CEO");
  if (authorization) {
    return authorization;
  }

  const { id } = await params;

  if (!isValidDealId(id)) {
    return NextResponse.json({ error: "Invalid deal ID." }, { status: 400 });
  }

  let body: UpdateDealRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.status !== DealStatus.WON && body.status !== DealStatus.LOST) {
    return NextResponse.json(
      { error: "Status must be WON or LOST." },
      { status: 400 },
    );
  }

  try {
    const deal = await prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: { status: body.status, closedAt: new Date() },
      include: { salesperson: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({
      deal: {
        ...updatedDeal,
        value: updatedDeal.value.toNumber(),
      },
    });
  } catch (error) {
    console.error("Deal update failed:", error);

    return NextResponse.json(
      { error: "Unable to update the deal right now." },
      { status: 500 },
    );
  }
}
