/**
 * Verifica se as variáveis públicas do Supabase estão configuradas de verdade
 * (não placeholders do .env.example).
 */
export function supabaseConfigurado() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return false;
  if (url.includes("SEU_PROJETO")) return false;
  if (key.includes("sua_chave") || key.includes("anon_aqui")) return false;
  if (!url.startsWith("https://")) return false;
  if (key.length < 20) return false;
  return true;
}
