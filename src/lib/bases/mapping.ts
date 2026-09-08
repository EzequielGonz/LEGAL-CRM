function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // saca espacios, guiones, slashes, etc.
}

const ALIASES: Record<string, string[]> = {
  full_name: ["nombre", "nombreapellido", "nombrecompleto", "fullname", "name", "apellidoynombre"],
  phone: ["telefono", "phone", "celular", "whatsapp", "tel", "numero", "numerodetelefono"],
  email: ["email", "correo", "mail", "correoelectronico"],
  dni_cuil: ["dni", "cuil", "dnicuil", "documento", "cuit"],
  tipo_de_consulta: ["tipodeconsulta", "tipoconsulta", "consulta", "motivo", "motivodeconsulta"],
  fecha_de_consulta: ["fechadeconsulta", "fechaconsulta", "fecha"],
  observaciones: ["observaciones", "notas", "comentarios", "observacion"],
};

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

  function findField(field: keyof typeof ALIASES): string | null {
    for (const alias of ALIASES[field]) {
      const match = normalizedEntries.find(([key]) => key === alias);
      if (match && match[1] !== undefined && match[1] !== null && String(match[1]).trim() !== "") {
        return String(match[1]).trim();
      }
    }
    return null;
  }

  return {
    full_name: findField("full_name"),
    phone_raw: findField("phone"),
    email: findField("email"),
    dni_cuil: findField("dni_cuil"),
    tipo_de_consulta: findField("tipo_de_consulta"),
    fecha_de_consulta: findField("fecha_de_consulta"),
    observaciones: findField("observaciones"),
  };
}
