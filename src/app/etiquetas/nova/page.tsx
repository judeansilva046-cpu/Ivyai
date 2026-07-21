import { PageHeader } from "@/components/PageHeader";
import { EtiquetaForm } from "@/components/EtiquetaForm";

export const metadata = { title: "Nova etiqueta de validade" };

export default function NovaEtiquetaPage() {
  return (
    <div>
      <PageHeader
        title="Nova etiqueta de validade"
        description="Informe produção, lote e validade para impressão."
        backHref="/etiquetas"
      />
      <EtiquetaForm />
    </div>
  );
}
