/**
 * Fondo full-screen de marca para el lobby del registro público.
 * Gradiente animado de marca sobre ink, sin dependencias de imágenes externas.
 * (En el SaaS white-label este fondo pasa a ser configurable por tenant.)
 */
export default function FondoObra() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      <div className="anim-gradient absolute inset-0 opacity-80" />
      <div className="anim-gradient absolute -inset-1/4 opacity-30 blur-3xl" />
      <div className="absolute inset-0 bg-ink-950/45" />
    </div>
  );
}
