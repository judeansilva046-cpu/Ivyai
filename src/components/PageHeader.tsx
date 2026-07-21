import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  backHref?: string;
};

export function PageHeader({ title, description, action, backHref }: Props) {
  return (
    <div className="dh-animate-in mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-block text-sm font-medium text-dh-muted hover:text-dh-accent"
          >
            ← Voltar
          </Link>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-dh-ink sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-dh-muted">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href} className="btn btn-primary shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}
