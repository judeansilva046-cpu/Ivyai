"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        organizationName: form.organizationName.trim(),
      };

      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Não foi possível criar a conta.");
        setLoading(false);
        return;
      }

      const login = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
        callbackUrl: "/",
      });

      if (login?.error) {
        setError("Conta criada. Faça login para continuar.");
        setLoading(false);
        router.push("/login");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Falha ao criar conta. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-dh-sage">
            DeliveryHub
          </p>
          <h1 className="font-display text-3xl font-semibold text-dh-ink">
            Criar sua operação
          </h1>
          <p className="mt-2 text-dh-muted">
            Cadastre o restaurante ou cozinha e comece do zero, com dados isolados.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="dh-scale space-y-4 rounded-2xl border border-dh-line bg-dh-elevated p-6 sm:p-8"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="field">
            <label className="label">Nome da operação</label>
            <input
              className="input"
              value={form.organizationName}
              onChange={(e) =>
                setForm((f) => ({ ...f, organizationName: e.target.value }))
              }
              required
              placeholder="Ex.: Cozinha Central Delivery"
            />
          </div>
          <div className="field">
            <label className="label">Seu nome</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Nome do responsável"
            />
          </div>
          <div className="field">
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
              autoComplete="email"
              placeholder="voce@restaurante.com"
            />
          </div>
          <div className="field">
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="field">
            <label className="label">Confirmar senha</label>
            <input
              type="password"
              className="input"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta e começar"}
          </button>

          <p className="text-center text-sm text-dh-muted">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-dh-accent">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
