import { EstadisticasPerfil } from "@/components/estadisticas/estadisticas-perfil";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas" };

/** Estadísticas de Jurídico: misma estructura que los otros perfiles (bloque 3). */
export default function EstadisticasPage() {
  return <EstadisticasPerfil slug="juridico" ruta="/estadisticas" />;
}
