import { Icono } from "@/components/ui/icono-seccion";

/**
 * Regla de horario de atención (vale para los cuatro perfiles). La IA
 * responde las 24 h; fuera de la franja de asesores igual capta: toma los
 * datos y deja agendado el llamado con un asesor para el próximo horario
 * hábil. Las salidas iniciadas por la empresa solo salen en la franja.
 */
export function HorarioAtencion() {
  const filas = [
    { icono: "asistente", titulo: "Respuesta 24 horas, todos los días", texto: "El agente IA responde cada mensaje que entra, en los cuatro perfiles." },
    { icono: "prospectos", titulo: "Asesores: lunes a sábado de 8 a 21", texto: "En ese horario una persona puede tomar el chat y se hacen las llamadas." },
    { icono: "agenda", titulo: "Fuera de ese horario, igual se capta", texto: "La IA atiende, saca la información que falta, califica y deja agendado el llamado con un asesor para el próximo horario hábil, así el asesor solo cierra." },
    { icono: "campanas", titulo: "Lo que inicia la empresa, solo en horario", texto: "Campañas, seguimientos y reagendamientos salen de lunes a sábado de 8 a 21 (nunca de noche ni en domingo)." },
  ];
  return (
    <div className="rounded-xl border border-gold-500/25 bg-gold-500/5 p-4">
      <p className="text-sm font-semibold text-slate-950">Horario de atención · todos los perfiles</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {filas.map((f) => (
          <li key={f.titulo} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-gold-700 shadow-sm">
              <Icono nombre={f.icono} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-900">{f.titulo}</span>
              <span className="block text-xs leading-relaxed text-slate-600">{f.texto}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
