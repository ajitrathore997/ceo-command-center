import { NextResponse } from "next/server";
import { EmploymentStatus, TaskStatus } from "@/generated/prisma/client";
import { requireAuthentication, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReassignTaskRequest = {
  employeeId?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidId(id: string) {
  return /^c[a-z0-9]{8,}$/i.test(id);
}

function getStartOfToday() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return startOfToday;
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

  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
  }

  let body: ReassignTaskRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.employeeId !== "string" || !isValidId(body.employeeId)) {
    return NextResponse.json({ error: "Invalid employee ID." }, { status: 400 });
  }

  try {
    const [task, employee] = await Promise.all([
      prisma.task.findUnique({ where: { id } }),
      prisma.employee.findUnique({ where: { id: body.employeeId } }),
    ]);

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (employee.status !== EmploymentStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Tasks can only be assigned to active employees." },
        { status: 400 },
      );
    }

    if (
      task.status === TaskStatus.COMPLETED ||
      task.dueDate >= getStartOfToday()
    ) {
      return NextResponse.json(
        { error: "Only incomplete overdue tasks can be reassigned." },
        { status: 400 },
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { employeeId: employee.id },
      include: { employee: { select: { id: true, name: true, department: true } } },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Task reassignment failed:", error);

    return NextResponse.json(
      { error: "Unable to reassign the task right now." },
      { status: 500 },
    );
  }
}
