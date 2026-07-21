import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DeliveryHub",
    template: "%s · DeliveryHub",
  },
  description:
    "DeliveryHub — fichas técnicas, precificação e etiquetas de validade para restaurantes, cozinhas e operações de delivery.",
  applicationName: "DeliveryHub",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="pt-BR" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        <SessionProvider>
          <AppShell
            user={
              session?.user
                ? {
                    name: session.user.name,
                    email: session.user.email,
                    organizationName: session.user.organizationName,
                  }
                : null
            }
          >
            {children}
          </AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
