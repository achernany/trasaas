import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Paginator({
  total,
  page,
  per,
  basePath,
  params,
}: {
  total: number;
  page: number;
  per: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / per));
  const desde = total === 0 ? 0 : (page - 1) * per + 1;
  const hasta = Math.min(total, page * per);

  const url = (overrides: Record<string, string>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...overrides })) {
      if (v) qs.set(k, v);
    }
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5">
      <div className="flex items-center gap-2 text-[12px] text-ink-400">
        <span>Ver</span>
        {[10, 25, 50].map((n) => (
          <Link
            key={n}
            href={url({ per: String(n), page: "1" })}
            className={`rounded-md px-2 py-1 font-bold ${
              per === n
                ? "bg-brand-100 text-brand-900"
                : "text-ink-600 hover:bg-page"
            }`}
          >
            {n}
          </Link>
        ))}
        <span className="ml-2 tabular-nums">
          {desde}–{hasta} de {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <PagBtn href={url({ page: String(page - 1) })} disabled={page <= 1}>
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </PagBtn>
        <span className="px-2 text-[12px] font-bold tabular-nums text-ink-600">
          {page} / {pages}
        </span>
        <PagBtn href={url({ page: String(page + 1) })} disabled={page >= pages}>
          Siguiente <ChevronRight className="h-3.5 w-3.5" />
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled)
    return (
      <span className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-bold text-ink-400/50">
        {children}
      </span>
    );
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-bold text-brand-900 transition hover:bg-brand-100"
    >
      {children}
    </Link>
  );
}
