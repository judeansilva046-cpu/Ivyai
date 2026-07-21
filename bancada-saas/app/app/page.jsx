import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Bancada from "@/components/Bancada";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: fichas, error } = await supabase
    .from("fichas")
    .select("id, nome, dados, updated_at, created_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar fichas:", error.message);
  }

  return (
    <Bancada
      usuario={{ id: user.id, email: user.email }}
      fichasIniciais={fichas || []}
    />
  );
}
