---
description: Lista de accesos que le faltan a Claude, pendientes de los dueños y preguntas abiertas. La recorre la sesión «accesos» (el dueño abre un chat del proyecto y escribe «accesos»). Se marca cada punto al resolverlo.
actualizado: 2026-11-22
---

# Accesos, pendientes y preguntas (sesión «accesos»)

Cómo se usa: el dueño abre un chat de Claude Code en este proyecto y escribe **accesos**. Claude carga la skill `accesos`, comprueba qué ya está y recorre esta lista en orden, de a un punto. Al resolver cada uno, cambia ⬜ por ✅, anota la fecha y lo deja en la bitácora.

Reglas de la sesión:
- **Las claves nunca se pegan en el chat.** Van por el formulario seguro de Claude (`request_credential`), por las variables de Vercel o por la conexión del conector en claude.ai.
- Nada que cueste plata se activa sin que el dueño lo diga en ese momento.
- PostHog: **no** activar la captura de sesiones de Claude Code (`llma-cc-setup`): mandaría conversaciones con datos de prospectos a un tercero.

## 1. Accesos para Claude y la Oficina

| # | Estado | Qué | Para qué | Cómo |
|---|---|---|---|---|
| A1 | ⬜ | Disparo de la Oficina (token de la tarea programada) | Que «Arrancar ahora» del panel despierte a los agentes | En claude.ai/code → Tareas programadas → «Oficina · procesar tareas» (ya creada el 22/11, sin horario): **sumarle el conector Supabase** (sin eso los agentes no leen la bandeja) y el repositorio LEGAL-CRM; después, agregar disparo por API y copiar la dirección y el token. Claude los carga en Vercel como `OFICINA_DISPARO_URL` y `OFICINA_DISPARO_TOKEN` (y `OFICINA_DISPARO_BETA` si la página lo pide) |
| A2 | ⬜ | Google Search Console y GA4 | Escritorios de Análisis y SEO | Conector de Google (AdCopilot o el kit de Search Console) con la cuenta de Google de las landings |
| A3 | ⬜ | Analítica de Metricool | Ciclo semanal «publicar → medir → aprender» | Ya está conectado; comprobar que devuelve métricas por marca |
| A4 | ⬜ | GitHub (conector) | Ingeniería: ramas y PR desde los agentes | Reconectar GitHub en claude.ai (hoy falla con «encabezado mal formado») |
| A5 | ⬜ | PostHog (plugin instalado) | Embudos y mapas de calor de las landings | Iniciar sesión en PostHog (plan gratis). Uso solo con OK |
| A6 | ⬜ | Firecrawl (plugin instalado) | Leer marca y precios de la competencia | Clave de API del plan gratis por el formulario seguro (host `api.firecrawl.dev`). Uso solo con OK |
| A7 | ⬜ | Gmail y Google Calendar | Jarvis: resumen diario y recordatorios | Conector de Google en claude.ai |
| A8 | ⬜ | Vercel de las landings (otra cuenta) | Cargar etiquetas de GA4 y píxel | Invitar a Claude al equipo o dar acceso al proyecto |
| A9 | ⬜ | Clave de Resend | Aviso por correo de formularios (PR #40) | Formulario seguro o variable en Vercel |
| A10 | ⬜ | Canva y Cloudflare (Turnstile) | Diseño de piezas; antispam en formularios | Conectar en claude.ai si los quieren usar |
| A11 | ⬜ | Skill Arena | Varias versiones compiten cuando hay que corregir muchas veces | No está en el catálogo: instalarla del repo después de leerlo. Uso solo con OK y tope |
| A12 | ⬜ | Secreto del latido en Vault (`crm_cron_secret`) | Que el job de `pg_cron` lea el secreto desde Vault y no lo tenga escrito (migración 0639, ya aplicada pero en espera) | Después de rotar `CRON_SECRET` (P2): cargar el mismo valor en Supabase → Vault con el nombre `crm_cron_secret` y volver a correr 0639 |

El resto de los plugins que piden cuenta están en `18-mapa-de-skills-y-plugins.md` § «Necesitan cuenta, acceso o pago», con prioridad.

## 2. Pendientes de los dueños

| # | Estado | Qué | Nota |
|---|---|---|---|
| P1 | ⬜ | Hacer privado el repositorio LEGAL-CRM | GitHub → Settings → Danger zone |
| P2 | ⬜ | Cambiar claves expuestas: secreta de Supabase, la del latido (`CRON_SECRET`) y el token de GitHub | Claude actualiza Vercel y verifica que todo siga andando |
| P3 | ⬜ | Número de Marketing «Sin acceso» en Meta | Revisar el permiso del número en Meta Business; Claude renueva la variable |
| P4 | ⬜ | Reconectar Wasender (QR) y conectar los 13 chips | El gestor de dispositivos queda para después (orden 22/11) |
| P5 | ⬜ | Elegir quién recibe los avisos de cada perfil | 6 captaciones quedaron sin aviso |
| P6 | ⬜ | Abrir TikTok y YouTube y conectarlos a Metricool | |
| P7 | ⬜ | **URGENTE (22/11):** cambiar el código de ingreso al panel | El código actual quedó escrito en el repo (un fragmento pegado por error en `15` y un ejemplo en una prueba). Se sacó de `main` y de la rama del cerebro el 22/11, pero sigue en el historial de git y en ramas viejas: solo cambiarlo lo cierra. Hacer privado el repo (P1) suma. El nuevo nunca se escribe en archivos |
| P8 | ⬜ | Perfil de Empresa de Google de VITA y Autos | Hace falta dirección y horarios |
| P9 | ⬜ | Revisar la incidencia de amenaza legal del 18/11 (Jurídico) | Claude puede resumirla sin datos personales |

## 3. Preguntas abiertas

| # | Estado | Pregunta |
|---|---|---|
| Q56 | ⬜ | El pase automático a créditos pagos de Claude (20/11): ¿sigue activado? ¿Con qué tope por mes? |
| Q57 | ⬜ | Al versionar piezas: ¿cambios reales, o solo «para que Meta no detecte duplicados»? |
| Q58 | ⬜ | ¿Qué hace hoy «Derivar»? ¿Le llega algo al profesional? |
| Q59 | ⬜ | Penal unificado con Civil: ¿se apaga el agente y la línea Penal, o queda como rol dentro de Civil? |
| Q60 | ⬜ | ¿El bot sigue presentándose como «Nancy» (Jurídico y Coberturas) y «Leonardo Gonzalez» (Marketing)? |
| Q62 | ⬜ | En la tarjeta de Salud del cerebro aparece el nombre de una persona: ¿se saca? |
| Q63 | ⬜ | ¿Qué plan de Claude tiene la cuenta (Pro, Max o Team)? Sirve para calcular cuántas vueltas de la Oficina entran por semana |

Las respuestas se pasan también a `12-preguntas-para-entender.md` y, si cambian una regla, a `02-ordenes-vigentes.md`.
