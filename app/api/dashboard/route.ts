import { NextResponse } from "next/server";
import {
  CampaignStatus,
  DealStatus,
  EmploymentStatus,
  InvoiceStatus,
  TaskStatus,
} from "@/generated/prisma/client";
import { requireAuthentication } from "@/lib/auth";
import { getDashboardConfig } from "@/lib/dashboard-config";
import { prisma } from "@/lib/prisma";
import {
  getFinanceStatus,
  getHrStatus,
  getMarketingStatus,
  getOperationsStatus,
  getSalesStatus,
} from "@/lib/status";

function getDateBoundaries(now: Date) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(startOfToday);
  startOfMonth.setDate(1);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));

  return { startOfToday, startOfMonth, startOfWeek };
}

const asNumber = (value: { toNumber(): number } | null | undefined) =>
  value?.toNumber() ?? 0;

export async function GET(request: Request) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  try {
    const now = new Date();
    const { startOfToday, startOfMonth, startOfWeek } = getDateBoundaries(now);
    const { monthlyRevenueTarget, openPositions } = getDashboardConfig();

    const [
      activeDeals,
      pipeline,
      dealsClosedThisWeek,
      overdueTasks,
      completedTasksToday,
      activeTeamMembers,
      approvedRevenue,
      pendingInvoices,
      pendingInvoiceTotal,
      activeCampaigns,
      weeklyLeads,
      leadSources,
      totalHeadcount,
      presentEmployees,
    ] = await Promise.all([
      prisma.deal.count({ where: { status: DealStatus.ACTIVE } }),
      prisma.deal.aggregate({
        where: { status: DealStatus.ACTIVE, createdAt: { gte: startOfMonth } },
        _sum: { value: true },
      }),
      prisma.deal.count({
        where: {
          status: DealStatus.WON,
          closedAt: { gte: startOfWeek, lte: now },
        },
      }),
      prisma.task.count({
        where: {
          status: { not: TaskStatus.COMPLETED },
          dueDate: { lt: startOfToday },
        },
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
      prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.APPROVED,
          approvedAt: { gte: startOfMonth, lte: now },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({ where: { status: InvoiceStatus.PENDING } }),
      prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PENDING },
        _sum: { amount: true },
      }),
      prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
      prisma.campaign.aggregate({
        where: { createdAt: { gte: startOfWeek, lte: now } },
        _sum: { leadsGenerated: true },
      }),
      prisma.campaign.groupBy({
        by: ["leadSource"],
        _sum: { leadsGenerated: true },
        orderBy: { _sum: { leadsGenerated: "desc" } },
        take: 1,
      }),
      prisma.employee.count({ where: { status: EmploymentStatus.ACTIVE } }),
      prisma.employee.count({
        where: { status: EmploymentStatus.ACTIVE, presentToday: true },
      }),
    ]);

    const pipelineValueThisMonth = asNumber(pipeline._sum.value);
    const monthlyRevenue = asNumber(approvedRevenue._sum.amount);
    const revenueAchievementPercentage = Number(
      ((monthlyRevenue / monthlyRevenueTarget) * 100).toFixed(1),
    );
    const pendingInvoiceTotalValue = asNumber(pendingInvoiceTotal._sum.amount);
    const leadsGeneratedThisWeek = weeklyLeads._sum.leadsGenerated ?? 0;
    const attendanceTodayPercentage = Number(
      (totalHeadcount === 0 ? 0 : (presentEmployees / totalHeadcount) * 100).toFixed(
        1,
      ),
    );

    return NextResponse.json({
      departments: {
        sales: {
          status: getSalesStatus(activeDeals, dealsClosedThisWeek),
          metrics: { activeDeals, pipelineValueThisMonth, dealsClosedThisWeek },
        },
        operations: {
          status: getOperationsStatus(overdueTasks),
          metrics: { overdueTasks, completedTasksToday, activeTeamMembers },
        },
        finance: {
          status: getFinanceStatus(revenueAchievementPercentage),
          metrics: {
            revenueAchievementPercentage,
            monthlyRevenueTarget,
            pendingInvoiceCount: pendingInvoices,
            pendingInvoiceTotalValue,
          },
        },
        marketing: {
          status: getMarketingStatus(leadsGeneratedThisWeek),
          metrics: {
            activeCampaigns,
            leadsGeneratedThisWeek,
            topLeadSource: leadSources[0]?.leadSource ?? null,
          },
        },
        hr: {
          status: getHrStatus(attendanceTodayPercentage),
          metrics: {
            totalHeadcount,
            openPositions,
            attendanceTodayPercentage,
          },
        },
      },
    });
  } catch (error) {
    console.error("Dashboard request failed:", error);

    return NextResponse.json(
      { error: "Unable to load the dashboard right now." },
      { status: 500 },
    );
  }
}
