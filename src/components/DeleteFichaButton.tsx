"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteFichaButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Desativar esta ficha técnica?")) return;
    setLoading(true);
    await fetch(`/api/fichas/${id}`, { method: "DELETE" });
    setLoading(false);
    router.push("/fichas");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-danger w-full"
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "Removendo..." : "Desativar ficha"}
    </button>
  );
}
