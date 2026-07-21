"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEtiquetaButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Excluir esta etiqueta?")) return;
    setLoading(true);
    await fetch(`/api/etiquetas/${id}`, { method: "DELETE" });
    setLoading(false);
    router.push("/etiquetas");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-danger"
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
