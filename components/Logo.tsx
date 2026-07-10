/** Isólogo AlfaSource — dos chevrons en avance (contract.md §1) */
export function AlfaMark({
  size = 32,
  mono,
}: {
  size?: number;
  mono?: "white" | "ink";
}) {
  const id = `alfa-g-${size}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="AlfaSource"
    >
      {!mono && (
        <defs>
          <linearGradient
            id={id}
            x1="24"
            y1="20"
            x2="98"
            y2="102"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#2743C0" />
            <stop offset="0.52" stopColor="#7A2FB0" />
            <stop offset="1" stopColor="#E23A5E" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M38 34 L66 62 L38 90 M64 34 L92 62 L64 90"
        fill="none"
        stroke={mono === "white" ? "#F4F5F7" : mono === "ink" ? "#2C2E36" : `url(#${id})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlfaLockup({
  invertido,
  conEndoso,
}: {
  invertido?: boolean;
  conEndoso?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <AlfaMark size={28} mono={invertido ? "white" : undefined} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[17px] font-bold tracking-[-0.5px] ${invertido ? "text-white" : "text-ink-900"}`}
        >
          AlfaSource
        </span>
        {conEndoso && (
          <span
            className={`mt-0.5 font-mono text-[8px] uppercase tracking-[3px] ${invertido ? "text-white/50" : "text-ink-400"}`}
          >
            Módulo de Alfaco
          </span>
        )}
      </span>
    </span>
  );
}
