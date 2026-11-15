import Link from "next/link";

export const metadata = { title: "Página no encontrada" };

/** Dirección que no existe (15/11): se avisa en castellano y se ofrece volver a Hoy. */
export default function NoEncontrada() {
  return (
    <main id="contenido" tabIndex={-1} className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-slate-700">Puede que la dirección esté mal escrita o que la pantalla se haya movido.</p>
        <div className="mt-5 flex sm:justify-end">
          <Link href="/hoy" className="btn-gold tactil inline-flex items-center justify-center">
            Volver a Hoy
          </Link>
        </div>
      </section>
    </main>
  );
}
