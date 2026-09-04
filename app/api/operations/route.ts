import { NextResponse } from "next/server";
import { EmploymentStatus, TaskStatus } from "@/generated/prisma/client";
import { requireAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getStartOfToday() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return startOfToday;
}

export async function GET(request: Request) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  try {
    const now = new Date();
    const startOfToday = getStartOfToday();
    const overdueFilter = {
      status: { not: TaskStatus.COMPLETED },
      dueDate: { lt: startOfToday },
    };

    const [overdueTasks, completedToday, activeTeamMembers] = await Promise.all([
      prisma.task.findMany({
        where: overdueFilter,
        include: { employee: { select: { id: true, name: true, department: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.count({
        where: {
          status: TaskStatus.COMPLETED,
          completedAt: { gte: startOfToday, lte: now },
        },
      }),
      prisma.employee.count({
        where: { status: EmploymentStatus.ACTIVE, presentToday: true },
      }),
    ]);

    return NextResponse.json({
      summary: {
        overdueTaskCount: overdueTasks.length,
        completedToday,
        activeTeamMembers,
      },
      overdueTasks,
    });
  } catch (error) {
    console.error("Operations request failed:", error);

    return NextResponse.json(
      { error: "Unable to load operations data right now." },
      { status: 500 },
    );
  }
}
