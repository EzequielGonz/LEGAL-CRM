/**
 * Texto de búsqueda seguro para los filtros `or(...)` de PostgREST
 * (bloque 1.12). En esos filtros la coma separa condiciones y los
 * paréntesis agrupan, así que un texto escrito por una persona no puede
 * entrar tal cual: se quitan esos caracteres, las comillas y la barra, los
 * comodines `%` y `_` (que cambiarían el sentido del ilike) y se acota el
 * largo. Devuelve "" cuando no queda nada útil.
 */
export function textoBusquedaSeguro(valor: unknown, maximo = 80): string {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/[,()"'\\%_]/g, " ")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximo);
}

/** Solo dígitos, para buscar por teléfono. */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}
