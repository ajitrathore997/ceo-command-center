import { NextResponse } from "next/server";
import { EmploymentStatus, LeaveStatus } from "@/generated/prisma/client";
import { requireAuthentication } from "@/lib/auth";
import { getDashboardConfig } from "@/lib/dashboard-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  try {
    const { openPositions } = getDashboardConfig();
    const [totalHeadcount, presentEmployees, pendingLeaveRequests] =
      await Promise.all([
        prisma.employee.count({ where: { status: EmploymentStatus.ACTIVE } }),
        prisma.employee.count({
          where: { status: EmploymentStatus.ACTIVE, presentToday: true },
        }),
        prisma.leaveRequest.findMany({
          where: { status: LeaveStatus.PENDING },
          include: { employee: { select: { id: true, name: true, department: true } } },
          orderBy: { startDate: "asc" },
        }),
      ]);

    const attendanceTodayPercentage = Number(
      (totalHeadcount === 0 ? 0 : (presentEmployees / totalHeadcount) * 100).toFixed(
        1,
      ),
    );

    return NextResponse.json({
      summary: {
        totalHeadcount,
        openPositions,
        attendanceTodayPercentage,
        pendingLeaveRequestCount: pendingLeaveRequests.length,
      },
      pendingLeaveRequests,
    });
  } catch (error) {
    console.error("HR request failed:", error);

    return NextResponse.json(
      { error: "Unable to load HR data right now." },
      { status: 500 },
    );
  }
}
