import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { UserRole } from "../generated/prisma/client";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const AUTH_COOKIE_NAME = "ceo_command_center_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function generateToken(user: AuthenticatedUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "8h" });
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload === "string" ||
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !Object.values(UserRole).includes(payload.role as UserRole)
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

type AuthenticationResult =
  | { authenticated: true; user: AuthenticatedUser }
  | { authenticated: false; response: NextResponse };

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function requireAuthentication(request: Request): AuthenticationResult {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1] ?? getCookieValue(request.headers.get("cookie"), AUTH_COOKIE_NAME);
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  return { authenticated: true, user };
}

export function requireRole(user: AuthenticatedUser, role: UserRole) {
  if (user.role !== role) {
    return NextResponse.json(
      { error: "CEO authorization is required." },
      { status: 403 },
    );
  }

  return null;
}
