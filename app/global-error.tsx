"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0D13",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <svg viewBox="0 0 120 120" width={44} height={44} aria-hidden="true">
            <path
              d="M38 34 L66 62 L38 90 M64 34 L92 62 L64 90"
              fill="none"
              stroke="#E23A5E"
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 style={{ fontSize: 22, margin: "18px 0 8px" }}>
            Trasaas no pudo iniciar
          </h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, maxWidth: 380 }}>
            Ocurrió un error inesperado en la aplicación. Reintenta; si
            persiste, contacta al administrador del sistema.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 22,
              background: "#fff",
              color: "#0B0D13",
              border: 0,
              borderRadius: 12,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
