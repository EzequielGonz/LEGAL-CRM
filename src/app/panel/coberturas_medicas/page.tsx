import { redirect } from "next/navigation";

// Landing del panel de Coberturas Médicas: igual que los demás rubros,
// manda directo al listado de casos cerrados en vez de mostrar un
// dashboard vacío.
export default function PanelCoberturasMedicasIndexPage() {
  redirect("/panel/coberturas_medicas/casos-cerrados");
}
