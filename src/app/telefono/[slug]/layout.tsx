import { temaDe } from "@/lib/marca";

// Modo teléfono por perfil: misma paleta de marca que el panel de computadora.
export default async function TelefonoPerfilLayout(props: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const params = await props.params;

  const {
    children
  } = props;

  return <div data-tema={temaDe(params.slug)} className="min-h-screen bg-slate-50">{children}</div>;
}
