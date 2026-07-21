"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SetupSupabase from "@/components/SetupSupabase";

const cores = {
  primario: "#2E6B4F",
  fundo: "#F2F4F0",
  tinta: "#212824",
  cinza: "#5C6660",
  borda: "#DDE3DC",
  alerta: "#B97F1B",
};

function envPronto() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return false;
  if (url.includes("SEU_PROJETO")) return false;
  if (key.includes("sua_chave") || key.includes("anon_aqui")) return false;
  if (!url.startsWith("https://")) return false;
  if (key.length < 20) return false;
  return true;
}

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (!envPronto()) {
    return <SetupSupabase titulo="Configure o Supabase para entrar" />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErro("");
    setInfo("");
    setCarregando(true);

    const supabase = createClient();

    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        router.push("/app");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/app");
          router.refresh();
        } else {
          setInfo(
            "Conta criada. Se o Supabase exigir confirmação, verifique seu e-mail e depois faça login."
          );
          setModo("login");
        }
      }
    } catch (err) {
      setErro(err.message || "Não foi possível autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${cores.borda}`,
    background: "#fff",
    color: cores.tinta,
    outline: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: cores.fundo,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            fontWeight: 700,
            color: cores.tinta,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: cores.primario,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            B
          </span>
          BANCADA
        </Link>

        <form
          onSubmit={onSubmit}
          style={{
            background: "#fff",
            border: `1px solid ${cores.borda}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, letterSpacing: "-0.02em" }}>
            {modo === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p style={{ margin: "8px 0 0", color: cores.cinza, fontSize: 14 }}>
            E-mail e senha via Supabase Auth.
          </p>

          <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: cores.cinza,
                }}
              >
                E-mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: cores.cinza,
                }}
              >
                Senha
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={inputStyle}
                autoComplete={modo === "login" ? "current-password" : "new-password"}
              />
            </label>
          </div>

          {erro ? (
            <p style={{ marginTop: 14, color: "#9b2c2c", fontSize: 13 }}>{erro}</p>
          ) : null}
          {info ? (
            <p style={{ marginTop: 14, color: cores.alerta, fontSize: 13 }}>{info}</p>
          ) : null}

          <button
            type="submit"
            disabled={carregando}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: cores.primario,
              color: "#fff",
              fontWeight: 700,
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando
              ? "Aguarde..."
              : modo === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>

          <p style={{ marginTop: 16, textAlign: "center", fontSize: 14, color: cores.cinza }}>
            {modo === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setModo(modo === "login" ? "cadastro" : "login");
                setErro("");
                setInfo("");
              }}
              style={{
                border: "none",
                background: "transparent",
                color: cores.primario,
                fontWeight: 700,
                padding: 0,
              }}
            >
              {modo === "login" ? "Criar conta" : "Fazer login"}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
