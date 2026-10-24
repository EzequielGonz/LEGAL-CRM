import { HiloChat } from "@/components/inbox/hilo-chat";

export const dynamic = "force-dynamic";

export default function ChatPerfilPage({ params, searchParams }: { params: { id: string }; searchParams?: Record<string, string | undefined> }) {
  return <HiloChat id={params.id} slug="agencia_0km" searchParams={searchParams} />;
}
