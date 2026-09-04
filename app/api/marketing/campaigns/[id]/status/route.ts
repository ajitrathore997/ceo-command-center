import { NextResponse } from "next/server";
import { CampaignStatus } from "@/generated/prisma/client";
import { requireAuthentication, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdateCampaignStatusRequest = {
  status?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidCampaignId(id: string) {
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

  if (!isValidCampaignId(id)) {
    return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
  }

  let body: UpdateCampaignStatusRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.status !== CampaignStatus.ACTIVE && body.status !== CampaignStatus.PAUSED) {
    return NextResponse.json(
      { error: "Status must be ACTIVE or PAUSED." },
      { status: 400 },
    );
  }

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error("Campaign update failed:", error);

    return NextResponse.json(
      { error: "Unable to update the campaign right now." },
      { status: 500 },
    );
  }
}
