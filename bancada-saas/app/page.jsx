import Link from "next/link";

const cores = {
  primario: "#2E6B4F",
  fundo: "#F2F4F0",
  tinta: "#212824",
  cinza: "#5C6660",
  borda: "#DDE3DC",
};

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 600px at 10% -10%, #2E6B4F22, transparent), linear-gradient(180deg, #F7F9F5 0%, ${cores.fundo} 50%, #E8EEE7 100%)`,
        color: cores.tinta,
      }}
    >
      <header
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "24px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: cores.primario,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            B
          </span>
          <strong style={{ fontSize: 20, letterSpacing: "-0.02em" }}>BANCADA</strong>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${cores.borda}`,
              background: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Entrar
          </Link>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: 10,
              background: cores.primario,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Criar conta
          </Link>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "48px 20px 80px",
        }}
      >
        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: cores.primario,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Para cozinha pequena que precisa de número certo
        </p>
        <h1
          style={{
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            maxWidth: 720,
            margin: "16px 0 0",
          }}
        >
          BANCADA
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            color: cores.cinza,
            maxWidth: 560,
            margin: "16px 0 0",
          }}
        >
          Ficha técnica, precificação e etiquetas de validade em um só lugar —
          feito para confeitarias, marmitarias e restaurantes.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: 12,
              background: cores.primario,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Começar grátis
          </Link>
          <a
            href="#modulos"
            style={{
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: 12,
              border: `1px solid ${cores.borda}`,
              background: "#fff",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Ver módulos
          </a>
        </div>

        <div
          id="modulos"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 64,
          }}
        >
          {[
            {
              t: "Ficha técnica",
              d: "Ingredientes com compra × uso, conversão kg↔g e L↔ml, custo total e por porção ao vivo.",
            },
            {
              t: "Precificação",
              d: "Embalagem + taxas, fixos e lucro sobre o preço de venda. Alerta se a conta ficar impossível.",
            },
            {
              t: "Etiquetas",
              d: "Validade automática, pré-visualização em grade e PDF A4 pronto para imprimir.",
            },
          ].map((m) => (
            <article
              key={m.t}
              style={{
                background: "#fff",
                border: `1px solid ${cores.borda}`,
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>{m.t}</h2>
              <p style={{ margin: "10px 0 0", color: cores.cinza, lineHeight: 1.5, fontSize: 14 }}>
                {m.d}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
