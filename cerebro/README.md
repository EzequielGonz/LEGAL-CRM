---
description: Cerebro del proyecto. Punto de entrada único de la memoria de Claude para el CRM multirubro y las 4 marcas. Se lee al arrancar cada sesión y se actualiza al cerrar cada vuelta.
actualizado: 20/11/2026 06:00 (Buenos Aires)
---

# Cerebro del proyecto · índice

Esta carpeta es la memoria de trabajo de Claude. Reemplaza tener que releer los 12 chats, los 2 documentos de contexto (Fase 1 Cowork y Fase 2 Code) y los ~80 documentos sueltos del repo. Si algo de acá choca con una orden nueva del dueño, manda la orden nueva y se corrige el archivo que corresponda.

## Aprendizaje continuo (orden del dueño, 20/11)

- **Al arrancar** cada sesión se relee y se entiende a fondo el negocio y sus expectativas: el hook `.claude/hooks/cerebro-al-arrancar.sh` vuelca solo lo esencial al contexto, y después se leen completos `01-negocio-y-marcas.md` y `02-ordenes-vigentes.md`.
- **Mientras se trabaja**, todo lo nuevo (una orden, una corrección, un dato del negocio, algo que se descubre en la base o el código) se anota en el archivo del cerebro que corresponde **en el momento**, no al final.
- **Al cerrar**, además del ritual de cierre: revisar si apareció un tipo de tarea que ningún rol cubre y sumar el rol con sus skills en `11-equipo-y-herramientas.md`; buscar skills y plugins nuevos (`SearchSkills`, `SearchPlugins`, `coding-skills:find-skill`) y anotarlos.
- Las preguntas pendientes para entender mejor viven en `12-preguntas-para-entender.md`; cada respuesta se pasa al archivo que corresponde y se tacha.

## Cómo arrancar una sesión

1. Leer este índice, `01-negocio-y-marcas.md` y `02-ordenes-vigentes.md` completos (qué es el negocio y qué manda hoy).
2. Leer `07-estado-verificado.md` (qué está encendido; si tiene más de 24 h, volver a comprobar en la base con las consultas que trae).
3. Leer `08-pendientes-y-plan.md` y tomar lo primero que corresponda, o lo que pida el dueño.
4. Según la tarea, abrir solo el archivo temático (tabla de abajo) y las fuentes que ese archivo señala.
5. Usar `11-equipo-y-herramientas.md` para elegir rol, skills, plugins y agentes.

## Cómo cerrar una vuelta (obligatorio)

1. Actualizar `07-estado-verificado.md` si cambió algo encendido o publicado.
2. Mover en `08-pendientes-y-plan.md` lo terminado a «Hecho» con fecha y estado (especificado / implementado / probado / publicado / habilitado).
3. Anotar en `bitacora.md` una entrada corta: qué se hizo, qué se aprendió, qué quedó.
4. Si el dueño dio una orden nueva: anotarla en `02-ordenes-vigentes.md` con fecha y qué reemplazó.
5. Commit y push (sin que lo pida).

## Mapa del cerebro

| Archivo | Qué responde |
| --- | --- |
| `01-negocio-y-marcas.md` | Qué es el proyecto, para qué existe, las 4 marcas (servicios, tono, paleta, contacto, Metricool, repo), metas al 21/12 |
| `02-ordenes-vigentes.md` | Todas las órdenes del dueño reconciliadas (Fase 1 + Fase 2), lo que no quiere y la única restricción |
| `03-crm-y-bots.md` | Cómo funciona el panel, secciones, estados, bots, captación por rubro, seguimiento, Meta y Wasender, automatizaciones |
| `13-lo-aprendido-de-los-chats.md` | Qué se aprendió de los chats volcados, contradicciones resueltas y qué hay que actuar |
| `04-redes-y-contenido.md` | Estrategia, cronograma vigente, motor de reels, dirección de arte, Metricool, series y palabras clave |
| `05-landings-seo-google.md` | Landings, SEO, medición, Search Console, Perfil de Empresa, YouTube |
| `06-tecnica-repos-y-accesos.md` | Pila, repos, ramas, base, comandos, cómo publicar, variables (solo nombres), conectores |
| `07-estado-verificado.md` | Foto del estado real con fecha y fuente, y cómo volver a comprobarlo |
| `08-pendientes-y-plan.md` | Tablero priorizado: qué hace Claude, qué hace el dueño, qué está bloqueado |
| `09-decisiones-abiertas.md` | Preguntas para el dueño, con la recomendación de Claude |
| `10-cruce-fase1-fase2.md` | Contradicciones entre los dos documentos de contexto y cómo se resolvió cada una |
| `11-equipo-y-herramientas.md` | Roles (agencia + ingeniería), skills y plugins por tipo de tarea, agentes, conectores y su estado |
| `12-preguntas-para-entender.md` | Preguntas abiertas al dueño para entender el negocio a fondo |
| `14-estilo-del-dueno.md` | Estilo del dueño: comunicación, diseño, reels, voces, autorizaciones y errores a no repetir |
| `traspaso-sesion-2026-11-21-c.md` | Estado al compactar el 21/11 (agentes, próximos pasos) |
| `bitacora.md` | Diario de sesiones y aprendizajes (lo más nuevo arriba) |

## Fuentes de verdad (en orden)

1. El dueño, en el chat (manda siempre la orden más nueva).
2. La base real (Supabase) para todo lo que diga «encendido», «activo» o cifras.
3. El código en `main` de cada repo para lo que diga «publicado».
4. Este cerebro.
5. Documentos detallados del repo: `.claude/referencias/reglas-comunes.md` (reglas de negocio finas), `docs/ESTADO.md` (historial operativo largo), `.ai-context/handoff-redes-4-marcas.md` (redes, detalle del motor), `.claude/referencias/redes/` (dirección de arte, marcas, series), `docs/**` (entregas por tema).
6. Los dos documentos de contexto del 20/11 (Fase 1 Cowork y Fase 2 Code), ya volcados acá.

## Qué no se guarda acá

Claves, tokens, el código de ingreso al panel, y datos personales de prospectos o clientes (nombres, teléfonos, textos de chats). El código de ingreso lo da el dueño en el chat cuando hace falta.
