import { redirect } from "next/navigation";

// Landing del panel de Marketing: igual que Jurídico y Agencia 0KM manda
// directo a su listado de casos cerrados en vez de mostrar un dashboard
// vacío.
export default function PanelMarketingIndexPage() {
  redirect("/panel/marketing/casos-cerrados");
}
