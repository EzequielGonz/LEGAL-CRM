// Fuente de datos: Outscraper (outscraper.com), un servicio de terceros
// que ya scrapea Google Maps por su cuenta y expone los datos por una API
// propia — se usa esto en vez de la API oficial de Google Places para no
// tener que crear un proyecto de Google Cloud con facturación. Sigue
// siendo un servicio pago (con crédito gratis al crear la cuenta) y pide
// tarjeta para activarla, pero el alta es la de un SaaS común (email +
// contraseña + clave desde el perfil), sin pasar por la consola de Google
// Cloud.
//
// Documentación: https://app.outscraper.com/api-docs#tag/Google-Maps
//
// Nota honesta: esta integración está armada según la documentación
// pública de Outscraper — no la pude probar en vivo porque no tengo (ni
// puedo tener) la clave. Lo más probable es que funcione tal cual, pero
// si en la primera búsqueda real algún campo viene vacío cuando no
// debería, es cuestión de ajustar el nombre de ese campo acá (la función
// `toScrapedPlace` de abajo ya prueba varios nombres alternativos por las
// dudas), no de rehacer nada.

const MAX_RESULTS = 60;
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 45000;

export interface ScrapedPlace {
  placeId: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratingCount: number | null;
  types: string[];
  /** Datos extra de Google Maps que usa el análisis del negocio. */
  extra: PlaceExtra;
}

export interface PlaceExtra {
  photosCount: number | null;
  verified: boolean | null;
  businessStatus: string | null;
  /** null = Google/Outscraper no informó el dato (no se asume que falte). */
  hasHours: boolean | null;
  description: string | null;
  facebook: string | null;
  instagram: string | null;
  email: string | null;
  reviewsPerScore: Record<string, number> | null;
  mapsUrl: string | null;
}

function textOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function numberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toScrapedPlace(raw: any): ScrapedPlace | null {
  if (!raw) return null;
  const placeId = raw.place_id ?? raw.google_id ?? raw.placeId ?? null;
  if (!placeId) return null;
  return {
    placeId: String(placeId),
    name: raw.name ?? "Sin nombre",
    address: raw.full_address ?? raw.address ?? null,
    phone: raw.phone ?? raw.phone_number ?? null,
    website: raw.site ?? raw.website ?? null,
    rating: typeof raw.rating === "number" ? raw.rating : null,
    ratingCount:
      typeof raw.reviews === "number"
        ? raw.reviews
        : typeof raw.reviews_count === "number"
          ? raw.reviews_count
          : null,
    types: raw.category ? [String(raw.category)] : Array.isArray(raw.type) ? raw.type : [],
    extra: {
      photosCount: numberOrNull(raw.photos_count),
      verified: typeof raw.verified === "boolean" ? raw.verified : null,
      businessStatus: textOrNull(raw.business_status),
      hasHours:
        raw.working_hours === undefined && raw.working_hours_old_format === undefined && raw.hours === undefined
          ? null
          : Boolean(
              raw.working_hours &&
                (typeof raw.working_hours !== "object" || Object.keys(raw.working_hours).length > 0)
            ),
      description: textOrNull(raw.description),
      facebook: textOrNull(raw.facebook),
      instagram: textOrNull(raw.instagram),
      email: textOrNull(raw.email_1 ?? raw.email),
      reviewsPerScore:
        raw.reviews_per_score && typeof raw.reviews_per_score === "object"
          ? (raw.reviews_per_score as Record<string, number>)
          : null,
      mapsUrl: textOrNull(raw.location_link ?? raw.maps_url),
    },
  };
}

/**
 * Busca negocios reales de Google Maps a través de Outscraper — un
 * servicio de terceros que hace el scraping por vos y expone los
 * resultados por su propia API REST, así que no hace falta crear un
 * proyecto de Google Cloud. Requiere la variable de entorno
 * OUTSCRAPER_API_KEY en Vercel (cuenta en outscraper.com → perfil → "API
 * key").
 */
export async function searchGooglePlaces({
  query,
  maxResults,
}: {
  query: string;
  maxResults: number;
}): Promise<ScrapedPlace[]> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno OUTSCRAPER_API_KEY en Vercel — sin eso no se puede buscar en Google Maps."
    );
  }

  const capped = Math.min(Math.max(Math.floor(maxResults) || 1, 1), MAX_RESULTS);
  const url = new URL("https://api.app.outscraper.com/maps/search-v2");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(capped));
  url.searchParams.set("async", "false");
  url.searchParams.set("language", "es");
  url.searchParams.set("region", "AR");

  const res = await fetch(url.toString(), { headers: { "X-API-KEY": apiKey } });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error de Outscraper (${res.status}): ${errText}`);
  }

  let data = await res.json();

  // Si la búsqueda tarda más de lo que da la respuesta síncrona,
  // Outscraper devuelve un job "Pending" con una URL para consultar el
  // resultado más tarde — se espera sondeando esa URL hasta que quede
  // listo (o hasta el tope de espera de acá abajo).
  if (data.status === "Pending" && data.results_location) {
    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      await sleep(POLL_INTERVAL_MS);
      const pollRes = await fetch(data.results_location, { headers: { "X-API-KEY": apiKey } });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      if (pollData.status === "Success") {
        data = pollData;
        break;
      }
    }
  }

  // La forma de la respuesta es data.data = [ [ {...}, {...}, ... ] ] —
  // un array por cada búsqueda pedida (acá siempre se pide una sola).
  const groups = Array.isArray(data.data) ? data.data : [];
  const rawResults = groups.flat();

  const results: ScrapedPlace[] = [];
  for (const raw of rawResults) {
    const place = toScrapedPlace(raw);
    if (place) results.push(place);
    if (results.length >= capped) break;
  }

  return results;
}
