"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function safeCallback(raw: string | null): string {
  if (!raw) return "/";
  // Evita redirecionar para URLs absolutas externas quebradas
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallback(params.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Falha ao entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="dh-scale space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="field">
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="voce@restaurante.com"
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-dh-muted">
        Ainda não tem conta?{" "}
        <Link href="/registro" className="font-semibold text-dh-accent">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-dh-sage">
            DeliveryHub
          </p>
          <h1 className="font-display text-3xl font-semibold text-dh-ink">
            Entrar na operação
          </h1>
          <p className="mt-2 text-dh-muted">
            Acesse fichas, precificação e etiquetas da sua cozinha.
          </p>
        </div>
        <div className="rounded-2xl border border-dh-line bg-dh-elevated p-6 sm:p-8">
          <Suspense fallback={<p className="text-sm text-dh-muted">Carregando...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
