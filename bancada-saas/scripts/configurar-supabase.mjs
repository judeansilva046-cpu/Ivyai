#!/usr/bin/env node
/**
 * Configura o projeto Supabase do BANCADA via Management API:
 * 1) lista/cria projeto
 * 2) aplica migration 001_init.sql
 * 3) ajusta Auth (site_url + redirect)
 * 4) grava .env.local
 *
 * Uso:
 *   export SUPABASE_ACCESS_TOKEN="sbp_..."
 *   npm run supabase:configurar
 *
 * Token: https://supabase.com/dashboard/account/tokens
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const API = "https://api.supabase.com/v1";
const NOME_PROJETO = process.env.BANCADA_SUPABASE_NAME || "bancada";
const REGIAO = process.env.BANCADA_SUPABASE_REGION || "sa-east-1";
const SITE_URL = process.env.BANCADA_SITE_URL || "http://localhost:3002";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(`
BANCADA — falta SUPABASE_ACCESS_TOKEN

1. Abra https://supabase.com/dashboard/account/tokens
2. Gere um access token
3. Rode:

   export SUPABASE_ACCESS_TOKEN="sbp_..."
   cd bancada-saas && npm run supabase:configurar
`);
  process.exit(1);
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data
        ? JSON.stringify(data, null, 2)
        : String(data);
    throw new Error(`${method} ${path} → ${res.status}\n${msg}`);
  }
  return data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function aguardarProjetoAtivo(ref) {
  console.log(`Aguardando projeto ${ref} ficar ACTIVE...`);
  for (let i = 0; i < 60; i++) {
    const p = await api(`/projects/${ref}`);
    const status = p.status || p.statuses?.status || "";
    process.stdout.write(`  status=${status || "?"}\n`);
    if (String(status).toUpperCase() === "ACTIVE_HEALTHY" || String(status).toUpperCase() === "ACTIVE") {
      return p;
    }
    await sleep(5000);
  }
  throw new Error("Timeout aguardando projeto ACTIVE.");
}

async function main() {
  console.log("BANCADA — configuração Supabase\n");

  const orgs = await api("/organizations");
  if (!Array.isArray(orgs) || orgs.length === 0) {
    throw new Error("Nenhuma organização encontrada nesta conta Supabase.");
  }
  const org = orgs[0];
  const orgId = org.id || org.slug;
  console.log(`Organização: ${org.name || orgId}`);

  const projects = await api("/projects");
  let projeto = (projects || []).find(
    (p) =>
      String(p.name || "").toLowerCase() === NOME_PROJETO.toLowerCase() ||
      String(p.name || "").toLowerCase().includes("bancada")
  );

  let dbPass = process.env.BANCADA_DB_PASSWORD || "";

  if (projeto) {
    console.log(`Projeto existente: ${projeto.name} (${projeto.id || projeto.ref})`);
  } else {
    dbPass = dbPass || `Bc_${randomBytes(12).toString("base64url")}!a1`;
    console.log(`Criando projeto "${NOME_PROJETO}" em ${REGIAO}...`);
    // API aceita organization_id (legado) ou organization_slug
    const payload = {
      name: NOME_PROJETO,
      region: REGIAO,
      db_pass: dbPass,
      organization_id: org.id,
      organization_slug: org.slug || org.id,
      desired_instance_size: "micro",
    };
    try {
      projeto = await api("/projects", { method: "POST", body: payload });
    } catch (e) {
      // fallback sem campos extras
      projeto = await api("/projects", {
        method: "POST",
        body: {
          name: NOME_PROJETO,
          organization_id: org.id,
          region: REGIAO,
          db_pass: dbPass,
        },
      });
    }
    console.log(`Criado: ${projeto.id || projeto.ref}`);
  }

  const ref = projeto.id || projeto.ref;
  await aguardarProjetoAtivo(ref);

  console.log("Buscando API keys...");
  const keys = await api(`/projects/${ref}/api-keys`);
  const anon =
    (keys || []).find((k) => k.name === "anon" || k.tags?.includes("anon"))?.api_key ||
    (keys || []).find((k) => String(k.name).includes("anon"))?.api_key;
  const service =
    (keys || []).find((k) => k.name === "service_role" || k.tags?.includes("service_role"))
      ?.api_key ||
    (keys || []).find((k) => String(k.name).includes("service"))?.api_key;

  if (!anon) throw new Error("Não foi possível obter a anon key.");

  const url = `https://${ref}.supabase.co`;

  console.log("Aplicando migration 001_init.sql...");
  const sqlPath = resolve(ROOT, "supabase/migrations/001_init.sql");
  const query = readFileSync(sqlPath, "utf8");

  try {
    await api(`/projects/${ref}/database/migrations`, {
      method: "POST",
      body: { query, name: "001_init_bancada" },
    });
    console.log("Migration registrada via /database/migrations");
  } catch (e) {
    console.warn("Fallback para /database/query:", e.message.split("\n")[0]);
    await api(`/projects/${ref}/database/query`, {
      method: "POST",
      body: { query },
    });
    console.log("SQL aplicado via /database/query");
  }

  console.log("Ajustando Auth (site_url / redirects)...");
  const redirects = [
    SITE_URL,
    `${SITE_URL}/auth/callback`,
    "http://localhost:3000",
    "http://localhost:3000/auth/callback",
    "http://localhost:3002",
    "http://localhost:3002/auth/callback",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3000/auth/callback",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3002/auth/callback",
  ];
  try {
    await api(`/projects/${ref}/config/auth`, {
      method: "PATCH",
      body: {
        site_url: SITE_URL,
        uri_allow_list: redirects.join(","),
        disable_signup: false,
      },
    });
    console.log("Auth configurado");
  } catch (e) {
    console.warn(
      "Não foi possível alterar Auth via API (faça no dashboard se preciso):",
      e.message.split("\n")[0]
    );
  }

  const envLocal = `NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
`;
  writeFileSync(resolve(ROOT, ".env.local"), envLocal, "utf8");
  console.log("\n.env.local gravado.");

  // Guarda service role fora do .env.local público do Next (só local, gitignored)
  const secretsPath = resolve(ROOT, ".supabase-secrets.local");
  writeFileSync(
    secretsPath,
    `SUPABASE_PROJECT_REF=${ref}
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_SERVICE_ROLE_KEY=${service || ""}
${dbPass ? `BANCADA_DB_PASSWORD=${dbPass}\n` : ""}`,
    "utf8"
  );
  console.log(".supabase-secrets.local gravado (não versionar).");

  // Garante gitignore
  const gi = resolve(ROOT, ".gitignore");
  if (existsSync(gi)) {
    const cur = readFileSync(gi, "utf8");
    if (!cur.includes(".supabase-secrets.local")) {
      writeFileSync(gi, `${cur.trimEnd()}\n\n.supabase-secrets.local\n`, "utf8");
    }
  }

  console.log(`
Pronto!
  URL:  ${url}
  Ref:  ${ref}
  Site: ${SITE_URL}

Reinicie o Next:
  npm run dev -- -p 3002
`);
}

main().catch((err) => {
  console.error("\nFalha na configuração:\n", err.message || err);
  process.exit(1);
});
