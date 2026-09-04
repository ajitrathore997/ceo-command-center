import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/client";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

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
