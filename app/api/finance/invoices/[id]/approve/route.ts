import { NextResponse } from "next/server";
import { InvoiceStatus } from "@/generated/prisma/client";
import { requireAuthentication, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidInvoiceId(id: string) {
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

  if (!isValidInvoiceId(id)) {
    return NextResponse.json({ error: "Invalid invoice ID." }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.status !== InvoiceStatus.PENDING) {
      return NextResponse.json(
        { error: "Only pending invoices can be approved." },
        { status: 400 },
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.APPROVED, approvedAt: new Date() },
    });

    return NextResponse.json({
      invoice: {
        ...updatedInvoice,
        amount: updatedInvoice.amount.toNumber(),
      },
    });
  } catch (error) {
    console.error("Invoice approval failed:", error);

    return NextResponse.json(
      { error: "Unable to approve the invoice right now." },
      { status: 500 },
    );
  }
}
