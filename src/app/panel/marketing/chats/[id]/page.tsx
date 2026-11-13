import { HiloChat } from "@/components/inbox/hilo-chat";

export const dynamic = "force-dynamic";

export default async function ChatPerfilPage(
  props: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | undefined>> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <HiloChat id={params.id} slug="marketing" searchParams={searchParams} />;
}
