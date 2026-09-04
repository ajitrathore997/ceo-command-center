import { NextResponse } from "next/server";
import { LeaveStatus } from "@/generated/prisma/client";
import { requireAuthentication, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidLeaveRequestId(id: string) {
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

  if (!isValidLeaveRequestId(id)) {
    return NextResponse.json(
      { error: "Invalid leave request ID." },
      { status: 400 },
    );
  }

  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id } });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 },
      );
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        { error: "Only pending leave requests can be approved." },
        { status: 400 },
      );
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.APPROVED },
      include: { employee: { select: { id: true, name: true, department: true } } },
    });

    return NextResponse.json({ leaveRequest: updatedLeaveRequest });
  } catch (error) {
    console.error("Leave approval failed:", error);

    return NextResponse.json(
      { error: "Unable to approve the leave request right now." },
      { status: 500 },
    );
  }
}
