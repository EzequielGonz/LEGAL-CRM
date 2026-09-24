import { redirect } from "next/navigation";

// Landing del panel de Agencia 0KM: igual que Jurídico manda directo a su
// listado de casos cerrados en vez de mostrar un dashboard vacío.
export default function PanelAgencia0kmIndexPage() {
  redirect("/panel/agencia_0km/casos-cerrados");
}
