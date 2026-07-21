// DeliveryHub — helpers de autenticação e escopo por organização
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
};

export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new AuthError("Não autenticado");
  }
  return session.user as SessionUser;
}

export class AuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function unauthorized(message = "Não autenticado") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Sem permissão") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function withAuth(
  handler: (user: SessionUser, request: Request) => Promise<Response>
) {
  return async (request: Request) => {
    try {
      const user = await requireSession();
      return await handler(user, request);
    } catch (e) {
      if (e instanceof AuthError) return unauthorized(e.message);
      throw e;
    }
  };
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
