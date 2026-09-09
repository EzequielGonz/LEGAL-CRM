function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // saca espacios, guiones, slashes, etc.
}

const ALIASES: Record<string, string[]> = {
  full_name: [
    "nombre",
    "nombreapellido",
    "nombrecompleto",
    "fullname",
    "name",
    "apellidoynombre",
    "nombreyapellido",
  ],
  phone: [
    "telefono",
    "phone",
    "celular",
    "whatsapp",
    "tel",
    "numero",
    "numerodetelefono",
    "movil",
    "wsp",
    "cel",
    "celu",
    "nrotelefono",
    "nrocelular",
    "numerodecelular",
    "numerodewhatsapp",
    "telefonocelular",
    "telefonomovil",
  ],
  email: ["email", "correo", "mail", "correoelectronico"],
  dni_cuil: ["dni", "cuil", "dnicuil", "documento", "cuit"],
  tipo_de_consulta: ["tipodeconsulta", "tipoconsulta", "consulta", "motivo", "motivodeconsulta"],
  fecha_de_consulta: ["fechadeconsulta", "fechaconsulta", "fecha"],
  observaciones: ["observaciones", "notas", "comentarios", "observacion"],
};

// Para el teléfono en particular (el dato que más importa reconocer bien:
// sin él, no hay a quién mandarle el mensaje) sumamos un segundo intento
// más permisivo: si ninguno de los alias exactos matchea, buscamos que el
// nombre de columna CONTENGA una de estas palabras clave. A diferencia de
// "nombre" o "consulta", una columna que menciona teléfono/celular/
// whatsapp/móvil casi nunca se refiere a otra cosa en una planilla de
// contactos, así que el riesgo de falso positivo es bajo — esto cubre
// headers más largos como "Teléfono de contacto" o "Número de Whatsapp"
// que no son un alias exacto pero sí contienen la palabra clave.
const PHONE_CONTAINS_TOKENS = ["telefono", "whatsapp", "celular", "movil"];

export interface ExtractedRowFields {
  full_name: string | null;
  phone_raw: string | null;
  email: string | null;
  dni_cuil: string | null;
  tipo_de_consulta: string | null;
  fecha_de_consulta: string | null;
  observaciones: string | null;
}

/**
 * Interpreta una fila cruda (tal como vino del CSV/Excel, con los headers
 * originales como claves) usando alias de nombres de columna comunes en
 * español, sin importar mayúsculas/acentos/espacios.
 */
export function extractRowFields(rawRow: Record<string, unknown>): ExtractedRowFields {
  const normalizedEntries = Object.entries(rawRow).map(
    ([key, value]) => [normalizeHeader(key), value] as const
  );

  function cellValue(match: readonly [string, unknown] | undefined): string | null {
    if (match && match[1] !== undefined && match[1] !== null && String(match[1]).trim() !== "") {
      return String(match[1]).trim();
    }
    return null;
  }

  function findField(field: keyof typeof ALIASES): string | null {
    for (const alias of ALIASES[field]) {
      const value = cellValue(normalizedEntries.find(([key]) => key === alias));
      if (value !== null) return value;
    }
    return null;
  }

  function findPhoneField(): string | null {
    const exact = findField("phone");
    if (exact !== null) return exact;
    // Respaldo: columna que CONTIENE una palabra clave de teléfono aunque
    // no sea un alias exacto (ver PHONE_CONTAINS_TOKENS arriba).
    const match = normalizedEntries.find(([key]) =>
      PHONE_CONTAINS_TOKENS.some((token) => key.includes(token))
    );
    return cellValue(match);
  }

  return {
    full_name: findField("full_name"),
    phone_raw: findPhoneField(),
    email: findField("email"),
    dni_cuil: findField("dni_cuil"),
    tipo_de_consulta: findField("tipo_de_consulta"),
    fecha_de_consulta: findField("fecha_de_consulta"),
    observaciones: findField("observaciones"),
  };
}
