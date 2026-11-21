---
description: Traspaso de la sesión KOCOS CALL del 21/11 (segunda parte, 08:30 UTC). Leer después de compactar, junto con README.md y 13-lo-aprendido-de-los-chats.md.
---

# Traspaso · 21/11/2026 (segunda parte)

## Qué pidió la responsable (vigente)

- **Por ahora el cerebro solo entiende: no altera ni toca nada del panel ni del proyecto.** Releer el código completo, recorrer el panel entero, leer los 5 repos con TODAS sus ramas y PR, Supabase y Vercel completos, cruzar todo y formular preguntas para terminar de entender. Ser un «super cerebro» con biblioteca.
- **Lo de Cowork es historia** (sesiones viejas del arranque; casi todo cambió: reglas, mejoras). Usarlo solo para ver objetivos y hacia dónde se apunta. Lo vigente está en los chats de Code, el código, la base y el panel.
- **Única regla:** no pagar nada sin autorización. Usar skills, plugins y conectores.
- **Código del panel:** se puede usar para entrar; no se guarda en ningún archivo. Ella lo cambia después.
- **Chats de Code:** solo los 7 de la carpeta «CRM COMPLETO» (KOCOS CALL = esta sesión; Panel Jurídico, Traspaso Legal CRM, Perfiles redes VITA, Contexto del proyecto, Contexto completo del proyecto: volcados; Metricool context: lo maneja ella).
- **Reels:** los sigue el agente del chat «Metricool context» (tarea «Retomar reels tras el límite»). No lanzar producción paralela.
- **Modelo:** Opus 5.5 esfuerzo medio, sin ultracode (o Sonnet medio para ahorrar). Nunca esfuerzo bajo para el cruce.
- **Si se corta por límite: programar para retomar** (send_later) y seguir.

## Repo público

`EzequielGonz/LEGAL-CRM` es **público** (comprobado 21/11). La responsable lo pasa a privado (Settings → General → Change repository visibility). Ella autorizó subir igual. No puedo cambiarlo yo (conector de GitHub caído, sin permiso de administrador).

## Análisis en curso (7 subagentes, solo lectura)

Informes en `/home/user/cerebro-privado/analisis/` (carpeta local, fuera del repo; se pierde si se recicla la máquina: al terminar, pasar lo importante al cerebro). Se cortaron por el límite de 5 h a las 08:20 UTC y se retomaron con SendMessage.

| Letra | Tema | Archivo | Modelo | id del agente |
| --- | --- | --- | --- | --- |
| A | Código completo del CRM (worktree `/home/user/crm-main` en origin/main) | A-codigo-crm.md | Sonnet | aaca52d81e2a98677 |
| B | 4 landings | B-landings.md | Sonnet | a5894bf7474602698 |
| C | Recorrido del panel (capturas en `analisis/capturas/`, 75 al corte) | C-recorrido-panel.md | Sonnet | ad529e98154be6ff6 |
| D | Estado real hoy: base, Vercel, Metricool por día | D-estado-real.md | Sonnet | a897fc41803665c97 |
| E | Historia y objetivos desde Cowork | E-historia-cowork.md | Haiku | a0d8e20b2cf803d76 |
| F | Todas las ramas y PR de los 5 repos | F-ramas-y-pr.md | Sonnet | a58df3430d95b61e1 |
| G | Supabase y Vercel a fondo (config, RLS, crons, nombres de variables) | G-supabase-vercel.md | Sonnet | a1c9737850ea7f43b |

Tarea programada de respaldo: «Retomar análisis del cerebro tras el límite», 10:25 UTC (`trig_01DsgMZfDwwnPE14MGFVZNga`). Si al dispararse ya terminaron, solo verificar.

## Cuando terminen

1. Leer los 7 informes y cruzarlos con `cerebro/chats/` (Code vigente; Cowork como historia) y `13-lo-aprendido-de-los-chats.md`.
2. Actualizar 01–11 del cerebro con lo confirmado (sin tocar código ni base), y pasar a `cerebro/biblioteca/analisis-2026-11-21/` los informes (sin datos personales ni claves).
3. Reemplazar/ampliar `12-preguntas-para-entender.md` con las preguntas que queden.
4. Bitácora, commit y push a `cerebro-chats` y a `claude/admiring-euler-ctf4sg` (PR #80).

## Material volcado (rama `cerebro-chats`)

- `cerebro/chats/`: síntesis de 6 chats de Code, 8 de Claude común, 10 de Cowork (plantilla de 12 secciones).
- `cerebro/chats/claude-comun/` y `cerebro/chats/cowork/`: textos completos.
- `cerebro/biblioteca/cowork-documentos-proyecto/`: 16 documentos del Project «crm» de Cowork.
- Copia local también en `/home/user/cerebro-privado/`.

## Pendientes de la responsable

Pasar el repo a privado; cambiar el código del panel; rotar la clave de Supabase reportada (chat 07/09) y revocar el token de GitHub pegado en Cowork (15/10); desactivar o no la tarea de reels; contestar las 51 preguntas.

## Avance a las ~08:40 UTC

Terminados: **D** (estado real), **E** (historia de Cowork), **G** (Supabase y Vercel). Siguen: A, B, C, F.

Hallazgos clave de los terminados (sin verificar por mí todavía):
- **ALERTA (G):** el cron `campaigns-tick` de pg_cron guarda el Bearer de `CRON_SECRET` en texto plano en `cron.job`, y quedó visible en el registro de la sesión del subagente. Recomendar rotar `CRON_SECRET` y pasarlo a Vault.
- (G) 101 tablas con RLS y 0 políticas; anon/authenticated sin permisos; todo pasa por la service role. 0 Edge Functions; bucket `marca` público. Vercel: un solo proyecto (`legal-crm`), las landings no están en este equipo. `META_APP_SECRET` y `META_APP_SECRETS` duplicadas. `cron.job_run_details` ocupa 40 de 136 MB sin purga.
- (D) Sin cambios desde el 20/11 en migraciones (77, última 0634) ni configuración. Graves 1911 terminó 182/182. Jurídico: 27,8 % de salientes fallidos en 7 días. Solo CIVIL recibe mensajes (Marketing último 06/11, Autos 26/10, Coberturas 13/11). 30 avisos de captación sin destinatario. Conflictos de seguimiento 10 → 13. Metricool: VITA, Coberturas y Autos tienen 13 piezas por día del 25 al 29/11 (historias y carrusel, 0 reels).
- (E) Historia desde el 11/10: ORVIAN → Kocos Marketing (20/10), detención sin apagar agente (24/10), Fase 3 descartada (25/10). Quedaron sin cerrar: línea de Kocos Marketing en Meta, plantillas `*_sb_*`, Alumar y PDF en chats, landings en Horizons, GA4 y sitemaps.
