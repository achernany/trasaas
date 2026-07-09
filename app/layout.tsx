import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scorecard de Proveedores",
  description:
    "Evaluación y selección de proveedores auditable — registro, matriz de puntaje, comparativos y aprobaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
