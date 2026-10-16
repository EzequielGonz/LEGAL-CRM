import { temaDe } from "@/lib/marca";

// Modo teléfono por perfil: misma paleta de marca que el panel de computadora.
export default function TelefonoPerfilLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  return <div data-tema={temaDe(params.slug)} className="min-h-screen bg-slate-50">{children}</div>;
}
