// DeliveryHub — configuração Next.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DeliveryHub usa better-sqlite3 via Prisma adapter
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
