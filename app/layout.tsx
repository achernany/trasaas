import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Scorecard de Proveedores",
  description:
    "Evaluación y selección de proveedores auditable — registro, matriz de puntaje, comparativos y aprobaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.className}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
