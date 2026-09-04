import { NextResponse } from "next/server";
import { InvoiceStatus } from "@/generated/prisma/client";
import { requireAuthentication } from "@/lib/auth";
import { getDashboardConfig } from "@/lib/dashboard-config";
import { prisma } from "@/lib/prisma";

function getStartOfMonth() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

export async function GET(request: Request) {
  const authentication = requireAuthentication(request);

  if (!authentication.authenticated) {
    return authentication.response;
  }

  try {
    const now = new Date();
    const { monthlyRevenueTarget } = getDashboardConfig();
    const [approvedRevenue, pendingInvoices, pendingInvoiceTotal] =
      await Promise.all([
        prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.APPROVED,
            approvedAt: { gte: getStartOfMonth(), lte: now },
          },
          _sum: { amount: true },
        }),
        prisma.invoice.findMany({
          where: { status: InvoiceStatus.PENDING },
          orderBy: { dueDate: "asc" },
        }),
        prisma.invoice.aggregate({
          where: { status: InvoiceStatus.PENDING },
          _sum: { amount: true },
        }),
      ]);

    const monthlyRevenue = approvedRevenue._sum.amount?.toNumber() ?? 0;
    const revenueAchievementPercentage = Number(
      ((monthlyRevenue / monthlyRevenueTarget) * 100).toFixed(1),
    );

    return NextResponse.json({
      summary: {
        monthlyRevenue,
        monthlyRevenueTarget,
        revenueAchievementPercentage,
        pendingInvoiceCount: pendingInvoices.length,
        pendingInvoiceTotalValue: pendingInvoiceTotal._sum.amount?.toNumber() ?? 0,
      },
      pendingInvoices: pendingInvoices.map((invoice) => ({
        ...invoice,
        amount: invoice.amount.toNumber(),
      })),
    });
  } catch (error) {
    console.error("Finance request failed:", error);

    return NextResponse.json(
      { error: "Unable to load finance data right now." },
      { status: 500 },
    );
  }
}
