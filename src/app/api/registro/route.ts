import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const organizationName = String(body.organizationName || "").trim();

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail, senha e nome da operação." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }

    let slug = slugify(organizationName) || "operacao";
    const slugTaken = await prisma.organization.findUnique({ where: { slug } });
    if (slugTaken) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const organization = await prisma.organization.create({
      data: {
        nome: organizationName,
        slug,
        users: {
          create: {
            name,
            email,
            passwordHash,
            role: "admin",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json(
      {
        ok: true,
        organizationId: organization.id,
        email,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("DeliveryHub registro:", e);
    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 500 }
    );
  }
}
