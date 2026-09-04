import { NextResponse } from "next/server";
import { generateToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LoginRequest = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();

  if (!email || !body.password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordIsValid =
      user && (await verifyPassword(body.password, user.passwordHash));

    if (!passwordIsValid || !user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json({
      token: generateToken(safeUser),
      user: safeUser,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Unable to log in right now." },
      { status: 500 },
    );
  }
}
