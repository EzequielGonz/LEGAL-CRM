---
description: Traspaso antes de compactar (22/11). Qué se pidió, qué quedó hecho, qué corre en segundo plano y qué falta entregar.
actualizado: 2026-11-22
---

# Traspaso 22/11 (antes de compactar)

## Lo que pidió el dueño (22/11, textual resumido)

- Alimentar el cerebro al máximo con skills, plugins, conectores e información de la web: un supercerebro que entienda todo, del negocio y de lo que se le pida.
- Conectado a todas las sesiones; que orqueste cambios y actualizaciones con el conocimiento previo; **director ejecutivo** de la gestión del panel.
- Armar una "empresa" de agentes por área (SEO, redes, diseño, análisis…), que lea estadísticas, informes y reportes, analice y rehaga estrategias de contenido con lo que funciona. Siempre enfocado en el rubro.
- Un **asistente personal tipo Jarvis en el panel** que lo ponga al día con todo.
- Lo mejor en calidad de contenido, animaciones y funciones.
- Evaluar 5 herramientas (OMNIROUTE, Claude-Mem, Headroom, Claude Code Setup, Task Observer) y 8 videos de Instagram: qué sirve y si se puede implementar.
- Proponer cómo armar el sistema de empresa con empleados (formato "escritorios" del video 1), cómo dedicar cada chat a un área (diseño, etc.) y cómo automatizar y centralizar todo desde acá.
- Usar subagentes para gastar menos. Usar el cerebro para ayudarse.
- Pasarle ya los pendientes, las preguntas pendientes, el rediseño del panel y mejoras.
- Dejar todo listo para compactar.

## Hecho

- **21/11, cerebro en el panel:** `/cerebro` como pantalla aparte con la escena animada (esfera, frases con cifras vivas, contador), lectura en vivo (cifras de la semana, salud, pedidos a Claude), «Hablale a Claude» a la bandeja, asistente y laboratorio de bots. Acceso solo en Inicio (píldora que late, pestaña nueva). Publicado en producción: `main` 94b5fdc, revisado en computadora y celular. Detalle en `docs/cerebro-panel/ENTREGA.md`.
- **22/11, propuesta de empresa de agentes:** `16-propuesta-empresa-de-agentes.md` (organigrama de 8 escritorios, cómo trabajan juntos, Oficina y Jarvis en el panel, 6 etapas, límites). **Sin aplicar.**

## Corriendo en segundo plano (no frenar; si se cortan, retomar)

| Agente | Qué hace | Entrega |
|---|---|---|
| Videos | Ve y transcribe los 8 videos de Instagram, busca cada herramienta nombrada | `/home/user/cerebro-privado/analisis/M-videos-21-11.md` |
| Herramientas | Investiga las 5 herramientas en la web, riesgos y equivalentes ya instalados | `/home/user/cerebro-privado/analisis/N-herramientas-21-11.md` |

## Próximos pasos (al terminar los agentes)

1. Leer M y N; sumar los veredictos a `16-propuesta…` (sección nueva «Herramientas y videos») y a `11-equipo-y-herramientas.md`.
2. Responder al dueño todo junto:
   - veredicto de cada herramienta y video (sirve / con autorización / no);
   - la propuesta de empresa de agentes, por etapas, para que apruebe;
   - cómo dedicar cada chat a un área;
   - pendientes de ustedes y de Claude (de `08` y `15`);
   - las 5 preguntas abiertas (56–60 de `12`);
   - rediseño del panel y mejoras (propuestas de `15` §3 y hallazgos de H: Hoy que diga por qué está parado cada perfil, cifras con una sola definición, separar rubros, celular).
3. Actualizar `src/lib/cerebro/contenido.ts` si cambian alertas, pendientes o preguntas (la pantalla `/cerebro` los lee de ahí).

## Recordatorios que siguen en pie

- LEGAL-CRM sigue público: pasarlo a privado.
- Claves para rotar (latido, Supabase, token de GitHub), vincular el número de Marketing en Meta, conectar los 13 chips, cambiar el código del panel cuando quieran.
- Ajustes del 19/11 sin publicar. Producción solo con su pedido o autorización. No pagar nada sin autorización.
- Trato: «el dueño» / «los dueños». Nunca femenino.
