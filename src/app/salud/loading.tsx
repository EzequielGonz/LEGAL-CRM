import { EsqueletoPagina } from "@/components/ui/esqueleto-pagina";

/** 27/11 (auditoría): la Salud ya no queda en blanco mientras se leen los chequeos. */
export default function Cargando() {
  return <EsqueletoPagina tarjetas={4} filas={6} />;
}
