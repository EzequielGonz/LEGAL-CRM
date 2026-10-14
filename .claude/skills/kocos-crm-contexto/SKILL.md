---
name: kocos-crm-contexto
description: Contexto obligatorio del CRM multirubro (Jurídico, Coberturas médicas, Autos 0 km y Marketing) - etapas, autorizaciones, estado operativo, entrega por ZIP, migraciones, datos y los cinco estados de evidencia. Leer antes de cualquier cambio, revisión, prueba o informe en este repositorio.
---

# Contexto del CRM multirubro

Panel único en Next.js 14 (App Router) con base en Supabase (PostgreSQL), publicado en Vercel. Atiende conversaciones de WhatsApp, Instagram y Facebook por la API oficial de Meta, con campañas, agenda, fichas y agentes de IA por perfil. Las reglas de negocio viven en **`.claude/referencias/reglas-comunes.md`** (versión 1.0): leerlas antes de tocar comportamiento; esta skill no las repite.

## Perfiles

Cuatro perfiles con la misma estructura: Jurídico (áreas Civil y Penal), Coberturas médicas, Autos 0 km y Marketing. Datos separados por perfil aunque coincida el teléfono; identificador permanente; no se eliminan. Marca, nombre de presentación, líneas, número interno de avisos, redes, landing y plantillas se cargan a mano desde el panel y nunca quedan fijos en código, prompts ni pesos.

## Etapas, bloques y autorizaciones

| Etapa | Alcance | Estado de referencia (13/10/2026) |
| --- | --- | --- |
| 1 · Plataforma | Acceso con PIN, modelo de oportunidades, perfiles y líneas, importación, ficha, vistas, teléfono, envíos seguros, adjuntos; ampliaciones 1.10 a 1.17 (entorno aislado, dependencias, seguridad por operación, diseño, vista de control, landings, SEO, rendimiento) | Publicada en `fb5cdc3`; 0199 pendiente de aplicar; 1.12 autorizado y en entrega |
| 2 · Rubros y fases | 2.0 a 2.9: contacto y calendario, captación, jurídico, seguimiento, coberturas y autos, ficha, adjuntos, marketing, fuente, avisos; más gestión posterior a la derivación y atención entrante 24 h (parche 2.0) | Autorizada; 2.0 y 2.3 entregados y verificados, sin publicar |
| 3 · Agentes | Principal y cuatro derivados, conocimiento, simulador, corpus, evaluación, fine tuning, agentes de SEO y contenido con sus conexiones | No empieza hasta que se indique |

- Cada etapa, y cada bloque nuevo, empieza solo cuando la responsable lo indica. Un documento o parche nuevo se analiza; no se ejecuta por inferencia. Las ampliaciones se separan de los bloques ya autorizados y no los cancelan.
- Construir no es habilitar. Instalar una herramienta, preparar SEO, contenido o un entrenamiento no autoriza envíos, campañas, publicaciones ni gastos.
- Informes con los cinco estados: especificado, implementado, probado, publicado y habilitado, siempre con la versión comprobada (sección 1 de la referencia).

## Estado operativo que se conserva

Pausa general de IA y envíos, agentes apagados, tarea programada de campañas inactiva, campañas pausadas sin reanudar y seguimiento apagado en los cuatro perfiles. Nada se activa por desplegar código ni por aplicar una migración. No hay contacto real con prospectos para probar.

## Mapa del repositorio

- `src/app/(dashboard)/`, `src/app/panel/<perfil>/`, `src/app/telefono/[slug]/`: pantallas; `src/app/api/`: rutas del servidor (públicas solo las que lista `src/middleware.ts`).
- `src/lib/`: reglas y servicios (`acceso/` sesión y autorización, `contacto/` horario y calendario, `seguimiento/` circuito y motor, `plantillas/`, `campaigns.ts`, `opportunities.ts`, `detention.ts`, `busqueda.ts`).
- `supabase/migrations/`: numeradas por etapa. `tests/`: unitarias, integración y `sin-npm`. `docs/etapaN/`: `ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`.
- `.claude/referencias/`: reglas comunes y casos de aceptación; `.claude/skills/`: skills `kocos-*` y de terceros (`PROCEDENCIA.md`).

## Entrega y migraciones

1. Código como ZIP `kocos-pipeline-*.zip` más parche exacto y huellas SHA-256. Claude no escribe en GitHub. Un ZIP de proyecto completo sobrescribe todo: si hay otra entrega pendiente, se indica el orden o se entrega un ZIP incremental.
2. La responsable sube el ZIP a una rama; «Aplicar pipeline Kocos» lo descomprime; la compilación de la Preview tiene que terminar bien. La Preview comparte base y líneas con producción: solo se mira.
3. Migraciones: antes de aplicar, se comprueba la versión real de la base (tablas, columnas, funciones) y se aplica solo la actualización necesaria y verificada, sin repetir a ciegas ni descartar controles. Una versión corregida de una migración ya aplicada se corre solo si está preparada para eso (`MIGRACIONES.md` lo dice). Las aplica una persona en el editor SQL de Supabase.
4. Producción se actualiza con el pull request a `main`. Reversión: «Instant Rollback» en Vercel y el script de reversión de la entrega para la base.

## Datos y secretos

Nada se borra: se archiva con motivo. RLS en tablas nuevas, acceso solo con la clave de servicio, `ops_change_log` para cambios. Ningún dato personal real en pruebas, ejemplos ni capturas. Ningún PIN, token ni clave en el chat, el código, los registros ni los informes; no se descifran variables de Vercel.

## Herramientas de la sesión

Conexiones directas de Vercel (lectura del proyecto, despliegues y entornos aislados temporales) y Supabase (consultas de lectura; las migraciones las aplica una persona). Lectura del repositorio público con git. Entorno aislado para compilar y probar con dependencias reales: sandbox temporal de Vercel sin variables del proyecto, con PostgreSQL y PostgREST propios y Meta simulado. El complemento de Vercel no se incorpora.
