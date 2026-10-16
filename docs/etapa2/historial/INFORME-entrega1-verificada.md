# Etapa 2 · Informe de la entrega 1 corregida y verificada (bloques 2.0 y 2.3)

13/10/2026. Construido y probado en la copia de trabajo, y verificado con las dependencias reales en un entorno aislado de Vercel; **no publicado ni habilitado**. Se publica siguiendo `ENTREGA.md`, primero en Preview. Reemplaza a la entrega 1 del 12/10 y a la entrega corregida anterior (ZIP con huella `a4b44b1c…`): el código de la aplicación es el mismo; cambian una prueba de la Etapa 1 y estos documentos.

## Correcciones de la revisión del 13/10

| # | Problema encontrado | Corrección | Prueba de regresión |
| --- | --- | --- | --- |
| 1 | El seguimiento aceptaba la línea de la conversación con solo estar activa, aunque fuera de otro perfil; si estaba desactivada, pasaba a otra línea del perfil | `resolveLine` en `src/lib/seguimiento/motor.ts`: la línea tiene que ser del perfil de la tarea y del área de la conversación; si la conversación tiene línea, se usa esa o ninguna. Una asociación incorrecta deja la tarea pendiente, con el motivo registrado una vez, antes de elegir plantilla y credenciales. La compuerta de la base (`followup_gate`) repite el control y exige que conversación, contacto y oportunidad sean los de la tarea | «corrección 1»: con la línea de Autos en una conversación de Marketing no se envía, no se registra línea ni plantilla y no se reserva; con la línea propia desactivada no se cambia de número; la compuerta responde `linea_incompatible` aunque la tarea tenga la línea ajena |
| 2 | La hora se tomaba una sola vez al empezar la vuelta y se usaba para todas las tareas | La hora y el calendario se vuelven a leer antes de reservar, y la hora y el plazo se comprueban otra vez justo antes de llamar a Meta. Si dejaron de valer, la tarea se reprograma dentro del mismo plazo o queda como conflicto, sin gastar un intento (`followup_release`) | Dos pruebas «corrección 2»: una vuelta que empieza a las 20:59:59 y llega a las 21:00:02 no envía y reprograma al jueves 8:59:59, donde sale; si la hora cruza las 21 entre la compuerta y Meta, tampoco sale y la tarea vuelve sin intento gastado ni marca de envío |
| 3 | `followup_candidates` traía las 200 interrupciones más antiguas antes de descartar las viejas, y una nueva podía no revisarse nunca | La consulta solo trae interrupciones posteriores a la activación, de las últimas 72 horas y no escritas por una persona del equipo, más las oportunidades que ya están en el circuito; excluye las interrupciones cuya tarea se descartó o falló. El planificador recorre todas las páginas (200 por página, hasta 10 por vuelta) | Dos pruebas «corrección 3»: con 200 interrupciones anteriores a la activación y 30 descartadas, la nueva se programa y ninguna vieja se reactiva; con páginas de una candidata, una vuelta programa las tres y el tope de páginas se respeta |

Las cinco pruebas nuevas **fallan con el código de la entrega anterior** (envío por la línea de Autos, envío a las 21:00:02, la nueva sin programar) y pasan con el corregido.

## Verificación con las dependencias reales (13/10)

En un entorno aislado de Vercel, temporal y sin variables del proyecto ni acceso a la base o a las líneas de producción, sobre `fb5cdc3` con los cambios de esta entrega. Para compilar se usaron valores ficticios. El entorno se apagó al terminar.

| Comprobación | Resultado |
| --- | --- |
| Instalación exacta del `package-lock.json` (`npm ci`) | Sin errores: Next.js 14.2.35, React 18.3.1, TypeScript 5.9.3, ESLint 8.57.1 y supabase-js 2.116.0, con Node 24, la versión que usa el proyecto en Vercel |
| Tipos de la aplicación (`npm run typecheck`) | Sin errores |
| Tipos de las pruebas (`npx tsc -p tests/tsconfig.json --noEmit`) | Sin errores |
| Lint (`npm run lint`) | Sin advertencias ni errores |
| Compilación (`npm run build`, que vuelve a revisar tipos y lint) | Termina bien, 62 páginas |
| Unitarias | 73 de 73 |
| Integración con el cliente real de Supabase, PostgreSQL 18.6 y PostgREST 12.2.3, con Meta simulado | 53 de 53, incluidas las 5 de regresión |
| La versión publicada (`fb5cdc3`), en las mismas condiciones | 38 de 39: falla la prueba de adjuntos que se explica abajo |
| Avisos de dependencias (`npm audit --omit=dev`) | Cuatro: Next.js (crítico), postcss incluido en Next.js, source-map-js y xlsx (altos; xlsx sin arreglo en npm). Son los del análisis del parche; esta entrega no los cambia |

**Ajuste de una prueba de la Etapa 1.** La prueba «adjuntos: un documento se descarga con su nombre original y nunca se abre como página» comparaba la dirección de descarga letra por letra y esperaba los espacios del nombre como «%20». El cliente real de Supabase, en la versión del `package-lock.json`, los escribe como «+», que significa lo mismo. Por eso la versión publicada falla esa prueba con las dependencias reales. Ahora la prueba compara el nombre ya decodificado («Constancia de prueba.docx») y sigue exigiendo que el documento se descargue. La aplicación no cambia. En la copia de trabajo las pruebas usan imitaciones mínimas de esas bibliotecas (`tests/sin-npm`), porque ahí npm está bloqueado; con ellas la prueba pasaba, y la diferencia apareció con las reales.

## Qué cambió en la Etapa 2

**2.0 Reglas de contacto y calendario**

- `src/lib/contacto/reglas.ts` (nuevo): horario general de lunes a sábado de 8 a 21 en hora de Argentina, feriados incluidos y domingos excluidos; elección de la franja de seguimiento entre 48 y 72 horas, la más cercana al objetivo (60 por defecto; si empatan, la anterior); conflicto si no hay franja, sin ampliar el plazo; ventana de 24 horas del canal.
- `src/lib/contacto/calendario.ts` (nuevo): lee las excepciones vigentes; si no puede leerlas, devuelve el error y no se envía.
- `src/lib/horario.ts` y `src/lib/campaigns.ts`: las campañas usan el mismo horario y sus excepciones.
- Configuración: sección «Horario de contacto y calendario (todos los perfiles)» para agregar un día cerrado o un horario más corto y archivarlo con motivo (`src/components/configuracion/calendar-settings.tsx`, `src/app/api/calendario/`). Cada cambio queda registrado.
- Migración `0200_etapa2_calendario.sql`.

**2.3 Seguimiento general**

- `src/lib/seguimiento/circuito.ts` (nuevo): decide sin acceder a la base. Contacto 2 solo para quien respondió y se interrumpió; sin respuesta al 2, se detiene; contacto 3 solo si respondió al 2 y volvió a interrumpirse; después del 3 sin avance, agotamiento (no es baja) y base para campaña manual. Las interrupciones anteriores a la activación no entran solas.
- `src/lib/seguimiento/motor.ts` (nuevo): programa las tareas recorriendo las candidatas por páginas y las ejecuta con línea validada, reserva atómica, compuerta en la base inmediatamente antes de enviar (pausa general, línea y datos coherentes, chat tomado por una persona, oportunidad cerrada, detención, respuesta previa), comprobación final de hora y plazo, cierre solo con la reserva vigente y recuperación de ejecuciones cortadas. Si no se sabe si Meta aceptó el mensaje, la tarea queda «a revisar» y no se reenvía sola.
- `src/lib/seguimiento/panel.ts` y pantallas «Seguimiento» en el menú general y en cada perfil: estado, espera por perfil (48 a 72 horas), tareas programadas, conflictos y pendientes, revisión de inciertos con confirmación y generación de la base de repesca, que no envía nada. Activar o apagar pide el PIN; apagar cancela lo programado.
- Marketing pasa a este circuito: `src/lib/marketing/followups.ts` deja de programar la repesca anterior, cuyo historial se conserva plegado. Quedan corregidas las diferencias registradas en el documento único: el tercer contacto ya no sale sin respuesta al segundo, la falta de respuesta no es baja, la pausa y el chat tomado se revalidan antes de enviar, cada contacto sale una sola vez con su plantilla y su identificador de Meta, y un envío incierto no se repite solo.
- Plantillas: propósitos «Seguimiento: contacto 2» y «Seguimiento: contacto 3» habilitados (si falta la del 3, se usa la del 2). Sin plantilla válida, la tarea queda pendiente.
- La tarea programada de campañas también ejecuta el seguimiento, aislado de las campañas. Hoy está inactiva.
- Migración `0201_etapa2_seguimiento.sql`.

## Pruebas en la copia de trabajo (13/10)

Con imitaciones mínimas de las bibliotecas (`tests/sin-npm`), porque ahí npm está bloqueado. La verificación con las dependencias reales está en la sección anterior.

| Prueba | Resultado |
| --- | --- |
| Tipos de la aplicación y de las pruebas (declaraciones mínimas, sin npm) | Sin errores |
| Reglas de Next.js y entidades JSX | Sin problemas |
| Unitarias (incluye C08: jueves 20:15 → sábado 20:15) | 73 de 73 |
| Integración sobre base nueva con todas las migraciones y Meta simulado | 53 de 53 (incluye las 5 de regresión y la prueba de adjuntos ajustada) |
| Las 5 de regresión con el código de la entrega anterior | Fallan las 5, como corresponde |
| Versión publicada (`fb5cdc3`) sobre una base con 0200 y la 0201 corregida | 39 de 39 |
| Copia restaurada de producción con 0200 y la 0201 corregida | 5 de 5 pruebas anteriores; «BASE 21 9» pausada, 725 en cola y 200 enviados |
| Orden de producción ensayado sobre una copia: 0199, reconciliación, 0200 y 0201 | Sin errores (detalle en `MIGRACIONES.md`) |
| 0201 corregida sobre la 0201 anterior, dos veces | Sin errores |
| Reproducción de la versión anterior | 6 de 6 |
| Reversión de 0200 y 0201 | Se detiene si hay datos; sin datos revierte y se vuelven a aplicar |

Una prueba anterior de plantillas esperaba que «seguimiento» estuviera deshabilitado. En esta etapa se habilita a propósito, así que ahora controla «reagendamiento», que sigue deshabilitado hasta 2.2.

## Lo que todavía no está comprobado

- **La compilación de la rama en Vercel:** el entorno aislado usa las mismas dependencias y la misma versión de Node, pero la compilación de la Preview de la rama `etapa2` sigue siendo la comprobación final antes de producción.
- **Avisos de dependencias:** `npm audit` confirma los cuatro del análisis del parche (Next.js 14.2.35, postcss dentro de Next.js, source-map-js y xlsx 0.18.5). Esta entrega no los cambia; se corrigen en el bloque 1.11, aparte.
- **Efectos reales en Preview:** la Preview usa la base y las líneas de producción. Hasta tener el entorno aislado de pruebas (bloque 1.10), solo se revisa mirando.

## Configuración pendiente para usarla de verdad

No hace falta para publicar. Al 13/10, en producción:

- Los cuatro perfiles no tienen marca, nombre de presentación del agente, líneas asignadas ni plantillas asignadas, y el catálogo de Meta nunca se sincronizó.
- Autos 0 km y Coberturas no tienen credenciales de WhatsApp en Vercel; Marketing no tiene el identificador de su cuenta de WhatsApp Business.
- Faltan plantillas aprobadas en Meta para el contacto 2 y el contacto 3.
- Activar el seguimiento en cada perfil y levantar la pausa general son decisiones aparte.

## Efectos operativos

Ninguno automático. Siguen la pausa general (IA y envíos), los agentes apagados, la tarea de campañas inactiva, «BASE 21 9» pausada y el seguimiento apagado en los cuatro perfiles. Cuando se reanuden, las campañas también respetan las excepciones del calendario y nunca envían en domingo.

## Pendiente dentro de la Etapa 2

2.1, 2.2 y 2.4 a 2.9. También, por el parche del 12/10: no contactar en automático números de otros países hasta configurar su zona horaria, y dos pruebas explícitas (una lectura o una recarga no cuentan como respuesta; una baja detiene en la compuerta).

## Reversión

Ver `ENTREGA.md`: «Instant Rollback» en Vercel para el panel y, si hiciera falta, `revertir_0200_0201.sql` para la base.
