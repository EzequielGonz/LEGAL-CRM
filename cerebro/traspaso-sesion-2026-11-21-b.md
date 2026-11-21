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
