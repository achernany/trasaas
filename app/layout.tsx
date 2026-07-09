import type { Metadata } from "next";
import { Poppins, Mulish } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scorecard de Proveedores",
  description:
    "Evaluación y selección de proveedores auditable — registro, matriz de puntaje, comparativos y aprobaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${poppins.variable} ${mulish.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
