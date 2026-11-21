---
description: Contradicciones entre el contexto de Fase 1 (Cowork) y Fase 2 (Code), ambos del 20/11/2026 05:30, y cómo se resolvió cada una
actualizado: 20/11/2026 06:10
---

# Cruce Fase 1 (Cowork) ↔ Fase 2 (Code)

Criterio: manda la orden más nueva del dueño; para hechos, manda lo comprobado en la base, el DNS o el código.

| # | Tema | Fase 1 dice | Fase 2 dice | Resolución |
| --- | --- | --- | --- | --- |
| 1 | Volumen de redes | Auditoría 20/11: bajar a 1 reel/día con persona real | «No bajamos ningún ritmo»; cronograma doble + extras | **Fase 2** (orden 20/11 posterior a la auditoría) |
| 2 | Caras en reels | Persona o escena real en el segundo 1, portada con cara | Animados, sin caras reales | **Fase 2** |
| 3 | Botón de WhatsApp y bios | Cargar el botón en IG/FB y reescribir bios | No tocar bio ni botón | **Fase 2** |
| 4 | Cierre de piezas | «Escribinos PALABRA por WhatsApp · botón en el perfil» | «Comentá PALABRA»; nunca «botón en el perfil» | **Fase 2** (salvo grupo de control 20–24/11, que sale como estaba) |
| 5 | Programar después del 24/11 | No programar hasta el informe de rendimiento (18/11) | Cronograma doble 20–29/11 | **Fase 2** |
| 6 | 44 de Kocos | Reprogramadas solo IG 25–29/11 | Pasadas a borrador | **Fase 2**; Metricool confirma 44 borradores |
| 7 | Search Console | Las 4 verificadas; IDs GA4 existen | Ninguna verificada | **Fase 1 tenía razón**: las 4 tienen registro DNS `google-site-verification` (comprobado 20/11 06:00). GA4 sin etiqueta en el código (ambas coinciden) |
| 8 | Lighthouse | 76–89, LCP 3,0–4,8 s (09/11) | 97–100, LCP 1,9–2,4 s | Fase 2 es posterior (mejoras de velocidad). Re-medir para confirmar |
| 9 | Código de ingreso | 8 números (el de 6 sigue) | 6 dígitos; se decidió pasar a 8 | Hoy funciona el de 6. El cambio a 8 está pendiente |
| 10 | Vista de teléfono | Orden 24/10: no debe existir vista separada | Existe `/telefono/[perfil]` | **Resuelto por el recorrido**: `/telefono/*` redirige a `/perfiles`; cumple la orden del 24/10 |
| 11 | Fecha de inicio | 07/10 | 07/09 | **07/09** (repos de VITA del 07/09; Fase 1 tiene un error de tipeo) |
| 12 | WhatsApp de Marketing | 11 7250-2391 | No figura («Marketing sin teléfono» en schema) | Número de Fase 1 vigente; falta cargarlo en el schema de la web |
| 13 | Windsor.ai | Conectado (1 de 8 cuentas) | Descartado | Descartado para métricas (plan gratis no alcanza) |
| 14 | Nombre de la agencia | Kocos Marketing u ORVIAN (abierto) | Kocos Marketing | Abierto: preguntar |
| 15 | Penal | Comparte línea de Civil con roles separados | Decidido y no implementado | Igual: la línea PENAL de Meta está inactiva; falta implementar roles dentro de Civil |
| 16 | Medición | GA4 IDs existen, falta etiqueta | Rama de medición en curso (VITA probada) | Complementarias: terminar la rama usando esos IDs |
| 17 | Destacadas | Hay que armarlas en la app antes del 21/11 1:30 | Tarea para Cowork | **Hecho**: el dueño las armó a mano en los 4 rubros (20/11) |
| 18 | Uso de Meta vs Wasender | 14/11 solo Wasender; 17/11 se puede elegir | Elegible por campaña | Elegible por campaña (17/11) |
| 19 | Cierre de carrusel | «botón en el perfil» | «Comentá PALABRA» | Fase 2 |

## Contradicciones dentro del repo (documentos viejos que siguen «vigentes»)

| Documento | Dice | Lo vigente |
| --- | --- | --- |
| skill `kocos-crm-contexto`, `reglas-comunes` §9, `CONTEXTO_ACTUAL_CRM.md` (cuerpo del 19/10) | Pausa general, agentes y seguimiento apagados; entrega por ZIP; Claude no escribe en GitHub; redes en pausa | Sin pausa (15/11), seguimiento encendido (12/11), Claude implementa y publica directo (15/10), redes en marcha |
| `reglas-comunes` §2 | PIN de 6 dígitos | 6 en uso; decidido pasar a 8 (15/11) |
| `docs/ESTADO.md` (14–15/11) | «Solo Wasender, Meta al margen»; rama `mejoras-1211`/`relaxed-cerf` = main | Meta y Wasender separados y elegibles por campaña (17/11); esas ramas quedaron atrás |
| `bandeja-claude.md` | Leer primero `CONTEXTO_ACTUAL_CRM.md`; remite a `claude/PUNTO_DE_CONTROL.md` (no existe) | Leer primero `cerebro/README.md` |
| `CLAUDE.md` / `reglas-comunes` §9 | Migraciones numeradas por etapa | En la práctica por bloque (05xx, 06xx); próximo libre 0635 |

Resolución: estos documentos llevan un aviso arriba que remite al cerebro (pendiente 5c), sin borrar su contenido.

## Solo en Fase 1 (sumado al cerebro)

Glosario; objetivos por rubro; costos de Meta por plantilla; las 6 líneas de WhatsApp y sus opciones; cómo vende Marketing (factura, 10 %, video, llamadas en frío, persona externa); precios publicados en la web de Marketing; frase fija del WhatsApp por landing y IDs de GA4; plantillas frías con sus 12 ángulos; resultados del 24/10; Gemini 3.8 Flash y USD 30/mes; Resend; asesor Leonardo Gonzalez; modelo de negocio de Coberturas; pendientes del chat de Marketing trabado y de adjuntar PDF; avisos a dispositivos sin activar; títulos propuestos y estrategia SEO por marca; decisiones abiertas (nombres, precios web, Content-Signal, pauta).

## Solo en Fase 2 (sumado al cerebro)

Lo que no quiere (tabla de correcciones); metas al 21/12; cronograma doble y su formato en Metricool; motor de reels v3 y sus archivos; estándar visual de reels; kit de perfil; boceto VITA; rama de medición y parche del CRM; nueva oferta laboral y penal de VITA y nuevas palabras clave; temas aprobados y descartados del 20/11; Laboratorio; inventario de 75 repos de la cuenta; otros proyectos (AutosMix, inmobiliaria).

## Lo que ninguno decía y apareció al verificar (20/11)

Campaña en curso sin envíos (arrancó fuera de ventana); 26 % de fallas de entrega en Jurídico; Autos y Marketing sin entrantes hace semanas; 6 avisos sin destinatario; 1 amenaza legal abierta; error de pago de Meta en una campaña de Coberturas; calendario de VITA, Coberturas y Autos vacío desde el 25/11; dos webs devuelven 403 a robots.
