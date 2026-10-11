import Link from "next/link";

/** Enlace para alternar entre lo activo y lo archivado (pregunta 20). */
export function ArchivedToggle({ basePath, showing }: { basePath: string; showing: boolean }) {
  return (
    <Link href={showing ? basePath : `${basePath}?archivadas=1`} className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline">
      {showing ? "← Ver activas" : "Ver archivadas"}
    </Link>
  );
}
