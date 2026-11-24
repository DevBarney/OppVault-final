'use client';

export default function PrintButton() {
  return (
    <button type="button" className="adm__ghost" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
