# Traspaso de sesión 21/11 (c) — antes de compactar

Sesión KOCOS CALL `session_01FuLgnkKbeaUf3pukEpthUr`. Rama de trabajo `cerebro-chats`; cada push va también a `claude/admiring-euler-ctf4sg`. Último commit antes de este: `c22ee48`.

## Órdenes vigentes del dueño (resumen; detalle en 02-ordenes-vigentes.md)

- El dueño es **hombre**; son **dos dueños y desarrolladores**. No usar «la responsable» en textos nuevos.
- **Solo lectura** sobre panel, código, base, Vercel y Metricool. Producción solo si el dueño lo pide o si autoriza un pedido de Claude. No pagar nada sin autorización.
- **Los ajustes del 19/11** (rama `pensive-galileo`) quedan **pendientes**.
- El **cerebro dentro del panel** es solo una **propuesta**: software aparte con API (ver 08-pendientes-y-plan.md, al final). No se aplica.
- **Tareas programadas del cerebro: eliminadas** (entrenamiento diario y recordatorios). El entrenamiento diario queda pendiente. Sigue activo el de reels del chat de Metricool (`trig_01Kgaz3YPqZh2EiqhSU5NU59`).
- **El dueño pidió respuesta TODA JUNTA cuando terminen todos los agentes.** No mandar avances sueltos.
- Roles: diseñador gráfico, programador, desarrollador, marketer e ingeniero de software, todos senior. Leer todo a detalle.
- El código del panel lo dio el dueño en el chat. **No escribirlo en archivos** (va solo por variable de entorno a los agentes).

## Preguntas: las 55 respondidas (en 12-preguntas-para-entender.md)

Lo clave: deriva a mano por WhatsApp (VITA a abogados; Coberturas a asesores que rotan; 0 km a concesionaria cercana; Marketing lo hacen ellos). Prioridad: VITA, después Marketing, después Coberturas y 0 km. Bases de lunes a sábado de 8 a 21 h. Volumen semanal: VITA 1.000–2.500; 0 km 500–1.000; Coberturas 1.000–2.000; Marketing 5.000. Arquitectura de líneas: 1 Meta por rubro para recibir y varias Wasender para enviar (**ya está integrado en el panel**). Chips nuevos esta semana: 4 VITA, 4 Marketing, 3 Coberturas, 2 0 km. Penal se une con Civil. Bots: IA solo si preguntan; mejoras como propuesta que suma y con autorización. Informes en Perfiles: diario, semanal y mensual (pendiente). Gemini USD 30: avisar al 80 %.

## Agentes del análisis exhaustivo (informes en /home/user/cerebro-privado/analisis/)

| Informe | Tema | Estado |
| --- | --- | --- |
| H-recorrido-usuario.md | Panel como usuario: chats, campañas, captados, seguimiento, incidencias, resultados, contactos | **CORRIENDO** (agente Sonnet `ac5b70ce0a2b36fc0`). Si se corta, retomarlo con SendMessage |
| I-agentes-roles-marketing.md | Agentes y roles, scraper, líneas, código de envíos | terminado |
| J-logica-de-negocio.md | Lógica de negocio en el código | terminado |
| K-relectura-total.md | Relectura completa de chats y archivos contra el cerebro | terminado |
| cerebro/14-estilo-del-dueno.md | Estilo del dueño | terminado y commiteado (`c22ee48`) |
| A a G | Primera ronda (código, landings, panel por encima, estado, Cowork, ramas, Supabase y Vercel) | terminados |

Hallazgos de J, ya confirmados con el código:
- La regla de 72 h deja todos los seguimientos con objetivo de 72 h en «conflicto: plazo_vencido» (contacto/reglas.ts:218).
- Los retenidos aparecen en los 4 perfiles porque `webhook_quarantine` no tiene rubro.
- El aviso de Penal sale de `detectedCredentialKeys` (lib/profiles.ts:59).
- «Esperan a una persona» sale de 5 consultas distintas.
- Gemini no tiene tope de costo ni de tokens.
- Las campañas usan 1 línea fija cada una, sin rotación de líneas.
- La evidencia de un captado no se verifica contra el chat.

## Próximos pasos (al terminar H)

1. Leer completos H, I, J y K. Cruzarlos con el cerebro y corregir los archivos 01–11 y 13 (sin datos personales ni claves).
2. Copiar versiones limpias de los informes a `cerebro/biblioteca/analisis-2026-11-21/`.
3. Actualizar la página del cerebro (https://claude.ai/artifact/7EC3JRaX1oFAdraThQhWTv). Plantilla, preguntas y página armada, respaldadas en `/home/user/cerebro-privado/pagina/` (copias en el scratchpad de la sesión). Se reconstruye reemplazando `__PREGUNTAS__` por el contenido de preguntas.json. Publicar con la misma ruta del scratchpad para conservar el link.
4. Responder al dueño **todo junto**: qué aprendí, qué estaba mal, errores y riesgos (como propuestas), la propuesta del cerebro como software, y preguntas reales nuevas (solo las que el panel no responde).
5. Commit y push a las dos ramas.

## Pendientes del dueño que conviene recordarle
Pasar los 5 repos a privado · cambiar las claves expuestas (latido, Supabase, token de GitHub) · vincular el número de Marketing en Meta · conectar los chips de Wasender · cambiar el código del panel cuando quiera.
