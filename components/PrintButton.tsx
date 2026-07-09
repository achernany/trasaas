"use client";

export default function PrintButton() {
  return (
    <button className="btn-dark" onClick={() => window.print()}>
      Imprimir / Guardar PDF
    </button>
  );
}
