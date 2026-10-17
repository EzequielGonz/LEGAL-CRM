import { EstadisticasPerfil } from "@/components/estadisticas/estadisticas-perfil";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas" };

/** Estadísticas del perfil con la misma estructura que los otros tres (bloque 3). */
export default function EstadisticasPage() {
  return <EstadisticasPerfil slug="agencia_0km" ruta="/panel/agencia_0km/estadisticas" />;
}
