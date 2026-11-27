---
description: Cruce de los chats volcados (Claude común, Cowork y Code) contra el cerebro. Qué aprendimos, qué se contradice, qué hay que confirmar con el dueño. Fuente: cerebro/chats/.
actualizado: 21/11/2026
---

# Lo aprendido de los chats (21/11/2026)

Los resúmenes los escribieron subagentes de menor costo y **no están revisados línea por línea**: cada dato que importa se confirma en la base, en git o con el dueño antes de usarlo. Las transcripciones crudas están en `cerebro/chats/claude-comun/` y `cerebro/chats/cowork/`.

## Qué se volcó

| Origen | Cantidad | Archivos |
| --- | --- | --- |
| Claude común (exportación de datos) | 8 de 31 (el resto es de otros temas y no se copió) | `chats/*-claude-comun-*.md` |
| Cowork (historiales que pasó el dueño) | 5 | `chats/*-cowork-*.md` |
| Code, carpeta «CRM COMPLETO» | 6 de 7 (Metricool context lo maneja él a mano) | `chats/*-code-*.md` |

Los 16 chats de Code fuera de esa carpeta (8 de Redes, Mercado Pago, Andreani, inmobiliaria, etc.) **no se leen**, por orden del dueño.

## Contradicciones y cómo se resuelven

| Tema | Qué dicen los chats | Qué vale hoy |
| --- | --- | --- |
| Nombre de la agencia | ORVIAN en Cowork y chats de septiembre–octubre | **Kocos Marketing** (decidido 20/11, `02-ordenes-vigentes.md`). ORVIAN no se usa |
| Escribir en GitHub | 15/10 «no escribas sin dale» → 15/10 «acceso total, solo pagos» → 21/11 «no escribas/commitees sin dale» (en chats de cierre de Cowork) | En **este** proyecto vale `CLAUDE.md` del 20/11: única restricción, los pagos. Los pedidos de «sin dale» eran para esos chats puntuales |
| Versión de Next | Next 14 en resúmenes viejos | **Next 15.5** (verificado en el repo) |
| Migraciones | 0199–0207 y 0300 (Cowork) vs convención 01xx/02xx | Mandan las 77 aplicadas en la base, última `0634_asistente_charlas`; la siguiente libre es **0635**. Las del archivo de prospectos (0634 duplicada) se renumera a 0635 |
| Reglas «una tarea por vez, no iniciar agentes, Fase 3 en pausa» | Aparecen en el chat de Cowork «migrar a Code» | Superadas por `CLAUDE.md` (agentes en paralelo permitidos). Fase 3 descartada según el cerebro |
| Consejos de la auditoría de redes del 20/11 (1 reel/día, cargar botón de WhatsApp) | Auditoría Claude común | Superados: el cronograma vigente es el doble de reels y **no se toca bio ni botón** |
| «El CRM usa solo Meta» (chat «Alternativas a la API de Meta») | Dicho por Claude el 17/11 | **Falso**: el repo tiene Wasender (`src/lib/wasender`, webhook propio). Revisar antes de diseñar una pasarela propia |
| Estado de producción del rediseño Simple/Avanzado | «Producción en 176e067» (chat de Cowork) | Desactualizado: `main` está en `66c457b`. Ese rediseño está implementado en ramas `rediseno-b1/b3/b4` y **no publicado** |

## Hallazgos que hay que actuar

1. **Clave de Supabase expuesta (chat del 07/09, reportada por «Contexto completo»)**: sin verificar. El dueño decide y rota; después se actualiza Vercel.
2. **Código de ingreso al panel**: escrito varias veces en chats (no se copió a ningún archivo). Cambiarlo (pendiente 23).
3. **Token de GitHub pegado en un chat de Cowork (15/10)**: revocarlo si no se hizo.
4. **Tarea programada «Retomar reels tras el límite»** (hoy 07:23 BA): despierta al chat «Metricool context» para seguir los reels 21–29/11. Es el dueño de la producción; no se lanzan sesiones paralelas.
5. **Registro de lo programado** (`docs/redes/produccion-2011/registro.csv`, rama de redes): tiene 392 piezas; el cronograma pide 632. La copia del registro está atrasada; el control real es `getScheduledPosts` por día y marca.
6. **Chat de Marketing sin acceso a Meta**: la migración Meta→Wasender dejó pendiente reincorporar el número y separar las líneas (chat «Contexto del proyecto», 17/11).
7. **Wasender no vincula por código de 8 caracteres** (dicho por Claude, sin verificar): ver al reconectar el QR.
8. **Reversionar piezas para esquivar detección de duplicados** va contra la regla de originalidad: no se hace sin evaluarlo.
9. **Charlas del asistente (0634)**: PR #78 integrado; falta comprobar que esté publicado y visible en producción.
10. **SEO de VITA (28/09)**: la estrategia quedó probada solo en entorno simulado, y la home se tocó pese a la orden de no tocarla. Verificar el estado real de las 4 landings.

## Lecciones de proceso

- Leer chats de Code con `list_events` filtrando `user` y `result` funciona, pero un chat largo (7.499 eventos) tarda casi 30 minutos: pedirlo de a uno y con tope.
- Un resumen escrito por un modelo chico puede afirmar de más: cada resumen marca lo no confirmado, y lo importante se verifica antes de usarlo.
- La exportación de datos de claude.ai no se puede bajar desde la nube (Cloudflare): el dueño sube los zips.
