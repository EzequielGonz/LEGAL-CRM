---
name: kocos-crm-reglas-de-captacion
description: Reglas aprobadas y procedimiento para implementar o corregir los recorridos de prospectos del CRM - importación, estados, bases, campañas, agenda, fichas, captación por aceptación, derivación, resultado posterior, seguimiento de tres contactos, horarios (salidas 8-21, entrantes 24 h), detención y atención humana. Usar al tocar agentes, campañas, seguimiento, oportunidades, fichas, avisos, agenda o cualquier envío automático.
---

# Reglas de captación y recorridos de prospectos

Las reglas están en **`.claude/referencias/reglas-comunes.md`** (secciones 3 a 7). Esta skill dice cómo aplicarlas al implementar. Si una tarea pide algo que las contradice, no se implementa: se informa la contradicción. Cubre el procedimiento «crm-prospect-workflows» (parche 2.0, sección 25.2).

## Lo que no se negocia (resumen de la referencia)

- Captado = interés + aceptación del siguiente paso con evidencia, evento único. Agendar no capta; compartir no deriva; derivar es manual. Datos parciales y fuera de zona no impiden captar: advertencias y grupo identificable.
- Dos políticas de horario: salidas iniciadas por la empresa (campañas, seguimientos, reagendamientos, recuperaciones) de lunes a sábado de 8 a 21, hora de Argentina, revalidadas justo antes de llamar a Meta (caso A09); respuestas a entrantes las 24 horas cuando perfil y agente estén habilitados, sin pausa y sin chat tomado (caso A08). Cada tarea lleva su origen y el servidor aplica la política según ese origen.
- Circuito: tres ciclos como máximo; sin segundo contacto al frío que nunca respondió; detener si el segundo no obtiene respuesta; tercero solo tras respuesta y nuevo estancamiento; después, repesca manual. Un reagendamiento por cita incumplida. Baja persistente; ventana de Meta; línea del perfil y del área, nunca otra.
- Detención con disculpa ante rechazo, enojo, número equivocado o caso resuelto, al archivo secundario. Atención humana principal solo para pedidos reales de una persona, decisiones del profesional, precio fuera de alcance, datos sensibles y mensajes posteriores de un captado.
- Resultado posterior a la derivación en su propia dimensión; no inicia secuencias automáticas.
- Nada de precios, resultados, credenciales, disponibilidad humana ni identidades inventadas.

## Procedimiento al implementar o corregir un recorrido

1. **Leer** la entidad y el contrato existentes (`src/lib/opportunities.ts`, `campaigns.ts`, `campaign-recipients.ts`, `seguimiento/`, `detention.ts`, migraciones) y la regla que cambia en la referencia. No reconstruir módulos: ampliar lo que existe.
2. **Mantener contacto y oportunidad separados**, y validar perfil y pertenencia de cada recurso (línea, base, campaña, conversación, agente) en el servidor antes de actuar.
3. **Conservar** normalización con dato original, archivos originales, conflictos y bajas. Una importación, un cambio de agente o una reimportación no reinician intentos ni levantan exclusiones.
4. **Derivar indicadores y listados de la misma definición** (unidad, filtro temporal, evento, conjunto): el contador y su lista comparten consulta.
5. **Comprobar** aceptación, fases, datos faltantes y zona según el rubro; separar el resultado posterior de la captación y de la derivación.
6. **Probar** reintentos, concurrencia, cambio de perfil, baja, filtros y horario con el reloj inyectado, y agregar la regresión de cada corrección (ver `kocos-crm-pruebas-de-aceptacion`).
7. **Entregar** un cambio compatible con la versión publicada, con su migración repetible y su reversión, y el informe con los cinco estados.

## Puntos del código que materializan las reglas

- `src/lib/contacto/reglas.ts` y `calendario.ts`: horario, franja 48–72 h, excepciones, conflicto (caso C08: jueves 20:15 → sábado 20:15).
- `src/lib/seguimiento/circuito.ts` (decisiones puras) y `motor.ts` (línea validada, reserva atómica, compuerta `followup_gate`, comprobación final de hora, cierre con reserva, inciertos a revisar).
- `src/lib/campaigns.ts`: pausa general, ventana de envío, reserva y resultado por destinatario.
- `src/lib/detention.ts` y `contact_detentions`: detención persistente por perfil con motivo.
- Pendiente de implementar según el parche 2.0: origen de cada tarea y política entrante 24 h en el agente (sin cupos de agenda de IA), resultado posterior a la derivación, clasificación de atención humana (sección 12.2) y disculpa automática con detención.

## Casos de control que cubren estas reglas

C03 a C12 del documento único; V04 a V08 del parche 1.0; A08 a A23 y A30 a A32 de `.claude/referencias/casos-de-aceptacion.md`. El informe dice cuáles corrió y con qué etiqueta.
