import { NextResponse, type NextRequest } from "next/server";

// El panel ya no exige sesión iniciada (decisión explícita del estudio):
// cualquiera con el link entra directo. Este middleware ya no chequea
// usuario ni redirige a /login — queda solo el archivo, sin lógica, por si
// en el futuro se necesita algún control acá (por ejemplo, un PIN
// compartido) sin tener que armar todo de nuevo.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}
