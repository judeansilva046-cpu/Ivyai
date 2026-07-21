import { PageHeader } from "@/components/PageHeader";
import { FichaForm } from "@/components/FichaForm";

export const metadata = { title: "Nova ficha técnica" };

export default function NovaFichaPage() {
  return (
    <div>
      <PageHeader
        title="Nova ficha técnica"
        description="Defina insumos, rendimento e parâmetros de precificação."
        backHref="/fichas"
      />
      <FichaForm />
    </div>
  );
}
