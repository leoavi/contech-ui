/**
 * Barra vertical bordô — âncora visual da identidade Contech.
 * Use à esquerda de headers de seção e cards principais.
 */
export function BordoBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`w-1 rounded-full bg-bordo-700 ${className ?? ""}`}
    />
  );
}
