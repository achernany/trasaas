export default function CuadrosPage() {
  const bondades = [
    {
      t: "Trazabilidad total",
      d: "Del ticket de requerimiento (AvanDesk) al cuadro, las cotizaciones en PDF, la aprobación y la orden final. Todo enlazado y auditable.",
    },
    {
      t: "Solo proveedores confiables",
      d: "El comprador únicamente puede cotizar con proveedores en estado Confiable de la categoría — la regla del procedimiento, aplicada por el sistema.",
    },
    {
      t: "Mínimo 3 cotizaciones",
      d: "Exigido automáticamente en requerimientos rutinarios; los de emergencia quedan eximidos con sustento (LOG-GN-P-02).",
    },
    {
      t: "Matriz ponderada del comparativo",
      d: "Precio, lugar y tiempo de entrega, condiciones de pago, garantía y feedback del usuario — con pesos configurables (LOG-GN-F-P02-07).",
    },
    {
      t: "Aprobación por correo",
      d: "El aprobador recibe el resumen ejecutivo en el cuerpo del correo con botones Aprobar / Rechazar, y un link al detalle con las cotizaciones.",
    },
    {
      t: "Niveles por monto",
      d: "Coordinación de Compras hasta S/ 50,000; Dirección de Logística por encima — matriz de aprobación configurable.",
    },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Módulo en propuesta · fase 2
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cuadros Comparativos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          La siguiente etapa del sistema: gestión del cuadro comparativo de
          cotizaciones con trazabilidad documentaria desde el requerimiento
          hasta la selección final del proveedor.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {bondades.map((b) => (
          <div key={b.t} className="card">
            <h3 className="mb-1 font-semibold">{b.t}</h3>
            <p className="text-sm text-slate-500">{b.d}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        La base de datos del sistema ya contempla este módulo (requerimientos,
        cuadros, cotizaciones, aprobaciones y auditoría). Su activación se
        planificará según los tiempos que se establezcan tras la entrega del
        módulo de Evaluación y Selección.
      </p>
    </div>
  );
}
