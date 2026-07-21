import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Healthcheck do DeliveryHub para monitoramento e load balancer */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      app: "deliveryhub",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", app: "deliveryhub" },
      { status: 503 }
    );
  }
}
