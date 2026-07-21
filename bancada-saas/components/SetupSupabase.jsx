import Link from "next/link";

const cores = {
  primario: "#2E6B4F",
  fundo: "#F2F4F0",
  tinta: "#212824",
  cinza: "#5C6660",
  borda: "#DDE3DC",
  alerta: "#B97F1B",
};

export default function SetupSupabase({ titulo = "Configure o Supabase" }) {
  const passos = [
    "Crie um access token em https://supabase.com/dashboard/account/tokens",
    'No terminal: export SUPABASE_ACCESS_TOKEN="sbp_..." && npm run supabase:configurar',
    "Ou preencha .env.local manualmente (URL + anon key) e rode 001_init.sql no SQL Editor",
    "Authentication → URL: Site URL http://localhost:3002 e redirect .../auth/callback",
    "Reinicie o servidor (npm run dev -- -p 3002)",
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: cores.fundo,
        color: cores.tinta,
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          border: `1px solid ${cores.borda}`,
          borderRadius: 16,
          padding: 28,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: cores.alerta,
            fontWeight: 600,
          }}
        >
          Setup pendente
        </p>
        <h1 style={{ margin: "10px 0 0", fontSize: 24 }}>{titulo}</h1>
        <p style={{ margin: "10px 0 0", color: cores.cinza, lineHeight: 1.5 }}>
          O BANCADA precisa das chaves do Supabase em <code>.env.local</code> para
          login, cadastro e salvar fichas.
        </p>
        <ol style={{ margin: "20px 0 0", paddingLeft: 20, lineHeight: 1.7, color: cores.tinta }}>
          {passos.map((p) => (
            <li key={p} style={{ marginBottom: 8 }}>
              {p}
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${cores.borda}`,
              fontWeight: 600,
              color: cores.tinta,
            }}
          >
            ← Landing
          </Link>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 10,
              background: cores.primario,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Abrir Supabase
          </a>
        </div>
      </div>
    </main>
  );
}
