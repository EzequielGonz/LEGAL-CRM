---
description: Traspaso para compactar la sesión del 22/11 (noche). Qué se hizo, qué quedó corriendo, qué hacer cuando termine cada agente, decisiones y recordatorios. Leer primero al retomar.
actualizado: 2026-11-22
---

# Traspaso · 22/11 (noche)

Al retomar: leé este archivo, `02-ordenes-vigentes.md` (al final, órdenes del 22/11), `17-accesos-y-pendientes.md` y la última entrada de `bitacora.md`. Claude trabaja como **director ejecutivo**: reparte en subagentes por escritorio (copias aisladas si tocan código), revisa, junta, publica y verifica. Usa el cerebro y el mapa `18`.

## Dónde está cada cosa

- **Repo del panel:** `/home/user/LEGAL-CRM`, rama de trabajo `cerebro-chats`; cada push va también a `claude/admiring-euler-ctf4sg`.
- **Copia para publicar:** `/home/user/crm-main`, rama `claude/cerebro-panel`, con push a `main` (producción en Vercel, legal-crm-nine.vercel.app).
- **El cerebro tiene que estar igual en las dos.** Al cambiar `cerebro/` o `.claude/`, copiar a crm-main y subir a `main`.
- **Supabase:** proyecto `enhgkeqiqcuwafsedaza`.
- **Vercel:** proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`, equipo `team_DGPKq7VRI79P0koUBcsxu1IH`.
- **Código de ingreso al panel:** el dueño lo da en el chat. Se pasa solo como variable `PANEL_CODE` al correr Playwright. **Nunca se escribe en archivos.** Es urgente cambiarlo: P7 en `17`.

## Lo publicado el 22/11 (main, verificado)

| Qué | Commit | Estado |
|---|---|---|
| Oficina de agentes en `/cerebro` (escritorios, triaje con Gemini, Arrancar ahora, Esperando tu OK) + migración 0636 | 05f5d11, 2b41803 | Publicado y probado en producción con una tarea de prueba (descartada con motivo) |
| Skills `oficina`, `accesos` (pide conectar Supabase a mano) y `memoria` (con plan B para la nube) + palabras clave en el arranque | varios | En `main` |
| Rediseño de todo el panel + captación y cifras + operación (integración de 3 ramas revisada) | 8c1a94c | Publicado y verificado: 6 pantallas en compu y celular, sin desborde |
| Migraciones 0637, 0638 y 0639 | — | Aplicadas. La 0639 quedó en espera: falta el secreto en Vault (A12); el latido sigue igual y anda |
| Arreglo del error React #418 (hidratación): contador sin nodos y `<p>` dentro de `<p>` | add6a8c | Publicado y verificado: consola limpia en las 7 pantallas, compu y celular |
| Seguridad: fragmento de comando con el código sacado de `cerebro/15` y de una prueba | 71f646e / 052819b | Hecho; sigue en el historial: cambiar el código |
| Memoria completa para claude.ai: `19` (147 recuerdos), `20` (conocimiento) y prompt para Claude in Chrome en `biblioteca/` | 8b07fef | El dueño la está cargando con Claude in Chrome |
| Mapa de 275 plugins por escritorio (`18`) | c1b1247 | Hecho |

Tarea programada «Oficina · procesar tareas» (id `trig_014WFWpDh5kpkXHWhSurCP8G`): creada sin horario, **sin conectores ni repo**. El dueño tiene que sumarle Supabase y el repo LEGAL-CRM, y el disparo por API (A1). Hasta entonces, «oficina» se procesa escribiéndolo en un chat.

## Agentes que quedaron corriendo (al volver, revisar sus ramas)

1. **Recontacto de 72 h por plantilla de Meta + gravedad en campañas** (rama `captacion/recontacto-plantillas-y-gravedad`, entrega `docs/recontacto-2211/ENTREGA.md`). Al terminar:
   - revisión independiente (code-reviewer, seguridad y que no salga nada dos veces);
   - aplicar sus migraciones `0640+`;
   - publicar en `main` y verificar.
   - Ojo: **manda mensajes reales a personas**. Revisar topes, horarios, baja y que un rubro sin plantilla no envíe nada. Si falta una plantilla en Meta, el texto propuesto va al dueño para que la cargue.
2. **Inventario de ramas, PR y Vercel: TERMINADO** (`cerebro/21-orden-de-ramas-y-vercel.md`: 99 ramas en LEGAL-CRM, 87 ya integradas; 4 PR abiertos; un solo proyecto en Vercel; 100 Previews en 22 h, el 86 % de ramas de documentos). Al terminar:
   - mostrarle al dueño el plan y las decisiones;
   - archivar con etiqueta `archivo/<rama>` solo con su OK.
   - No tocar `cerebro-chats`, `claude/admiring-euler-ctf4sg`, `claude/cerebro-panel` ni `claude/pensive-galileo-d6ephy` (botón Archivar del 19/11, pendiente).

## Pendiente inmediato

- Verificar en producción que ya no salga el #418 en /perfiles, /salud, /panel/marketing/agentes (en celular) y /bandeja. El script está en el scratchpad (`panel-shot.js`), con `PANEL_CODE` por variable.
- Recorrer en producción las pantallas rediseñadas que faltan: Hoy de un perfil (pide elegir perfil primero), Chats y detalle, Campañas.

## Decisiones del dueño

- **Ya respondió:** gravedad conectada a campañas (pregunta 5); el segundo contacto va por plantilla de Meta y automático.
- **Le falta responder:**
  - precio real por token de Gemini (el tope diario solo avisa hasta confirmarlo; el del mes frena en USD 30);
  - si el asistente, el Laboratorio y los audios cuentan para el tope;
  - preguntas 56 a 60, 62 y 63 en `17`.

## Recordatorios para el dueño

En `17`:
- urgente: cambiar el código de ingreso;
- hacer privado el repo;
- rotar claves (latido, Supabase, GitHub) y guardar el secreto del latido en Vault;
- conectar Supabase a la tarea programada y el disparo por API;
- número de Marketing en Meta;
- Wasender y los 13 chips (el gestor de dispositivos queda para después).

## Lecciones de hoy

- Antes de cada commit del cerebro: buscar con grep restos de herramientas (`</content>`, `<parameter`), el código, teléfonos y correos.
- Las sesiones en la nube no manejan el Chrome del dueño: para claude.ai se usa Claude in Chrome con el prompt preparado.
- Los agentes que trabajan en copias aisladas no pueden lanzar subagentes revisores. La revisión con varios agentes la lanza Claude directamente, o un agente sin aislamiento.
