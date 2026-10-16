# Etapa 2 · Informe de la entrega única (13/10/2026)

Base: `main` en `fb5cdc3` (producción). Esta entrega **reemplaza** a todas las anteriores sin publicar: entrega original del 12/10, «corregida» (`a4b44b1c…`), `etapa2-verificada` (`efc85f95…`) y `herramientas-1` (`34db36e8…`). Incluye todo lo de esas entregas más los bloques 1 a 5 del plan.

## Estado (cinco estados)

| Parte | Especificado | Implementado | Probado | Publicado | Habilitado |
| --- | --- | --- | --- | --- | --- |
| 2.0 calendario · 2.3 seguimiento (0200, 0201) | sí | sí | sí, también con dependencias reales el 12/10 | no | no (seguimiento apagado) |
| 1.12 sesión por operación · 0202 | sí | sí | sí (imitaciones; 0202 sobre copia de la base real) | no | — |
| Bloque 1 · reglas de base y captación (0203) | sí | sí | sí, imitaciones | no | no (24 h apagada; tareas de cita sin ejecutor) |
| Bloque 2 · panel | sí | sí | sí, imitaciones; pantallas solo con tipos sustitutos | no | — |
| Bloque 3 · operación diaria (0204) | sí | sí, salvo transcripción | sí, imitaciones | no | — |
| Bloque 4 · biblioteca de agentes (0205) | sí | sí (solo configuración) | sí, imitaciones | no | no (5 apagados) |
| Bloque 5 · contenido y SEO (0206) | sí | sí (sin conectar) | sí, destinos simulados | no | no (políticas apagadas, calendario en pausa) |
| Cierre de seguridad (0207) | sí | sí | sí, base de pruebas | no | — |
| Contenido para Instagram y Facebook (bloque nuevo) | sí | no (espera datos de conexión y marca) | — | no | no |

## Pruebas (13/10, en el espacio de Claude)

- Unitarias: **90 de 90**. Integración: **80 de 80** (PostgreSQL 16.15 + PostgREST 12.2.3, Meta, IA y destinos simulados). La versión publicada pasa sus 39 pruebas sobre la base con todo aplicado.
- Tipos de los archivos `.ts` de `src` y de las pruebas: sin errores nuevos. Pantallas `.tsx`: sintaxis correcta en las 152 y sin errores nuevos con tipos sustitutos de React y Next.
- Casos cubiertos por pruebas nuevas: A03, A05, A06, A08, A09, A13, A14, A15, A17, A18, A20, A28, A29 y C06, C07, C10, C12.
- Todo con **imitaciones mínimas** de `@supabase/supabase-js`, `next/server` y `@google/genai` (`tests/sin-npm`), porque npm está bloqueado acá.

## Lo que NO se verificó

- **Dependencias reales (typecheck, lint, build y pruebas con `npm ci`) sobre este código.** El entorno aislado de Vercel se creó, instaló las dependencias y la base de pruebas, pero la subida del código se cortó: el control de permisos de esta sesión bloqueó el envío de los archivos al entorno como «salida de datos». No se forzó. El entorno quedó apagado (instantánea `snap_41Ml…`, sin datos del proyecto). Hasta resolverlo, la primera verificación real es la compilación de la Preview (paso 2 de la guía).
- Aplicación de 0203–0207 sobre una copia de la base real.
- Recorridos navegando el panel (teclado, teléfono, zoom): solo se revisó el código.

## Pendientes y decisiones abiertas

- Transcripción de audios (2.6): necesita usar un servicio de IA con costo → requiere autorización.
- Ejecutor programado de tareas de cita y de la cola de contenido: no se conectó (la tarea programada sigue inactiva).
- Destinatarios de avisos por perfil (2.9), textos identificadores de la fuente (2.8) y localidades de AMBA: se cargan cuando Vita los defina; mientras tanto, aviso «sin destinatario», fuente «no informada» y zona explícita.
- Search Console: variables en Vercel y `SEARCH_CONSOLE_ENABLED=true` cuando se decida conectar.
- Contenido de redes: conectar las cuentas en Metricool (Instagram de Marketing y una marca por rubro, sin contratar nada pago sin presupuesto), nombre ORVIAN o «Kocos Marketing», CTA real y activos de marca de cada rubro.
- Dependencias con avisos conocidos (Next 14.2.35, xlsx): siguen como en 1.11.

## Archivos anteriores que quedan reemplazados

`kocos-pipeline-etapa2-entrega1*.zip` (original y corregida), `kocos-pipeline-etapa2-verificada*.zip` (`efc85f95…`), `kocos-pipeline-herramientas-1*.zip` (`34db36e8…`), sus parches y `SHA256SUMS.txt`, y los documentos `docs/etapa2/ENTREGA.md`, `INFORME.md` y `MIGRACIONES.md` de esas entregas (conservados en `docs/etapa2/historial/`).
