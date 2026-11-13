# Auditoría del 13/11 · qué se revisó, qué se encontró y qué se arregló

Pedido de la responsable: «hacé una auditoría general, tanto de funcionamiento, sencillez de uso, seguridad completa, bugs, vulnerabilidades, errores, TODO […] y arreglalo y aplicalo», y después: «los chats, contactos y oportunidades se mezclan con los de otros rubros […] hacé una auditoría más exhaustiva».

Se actualiza a medida que avanza el trabajo. Gravedad: **crítica** (rompe la operación o expone datos), **alta** (lleva a decisiones equivocadas o hace perder tiempo todos los días), **media**, **baja**. Sin datos personales.

## 1. Hallazgos y arreglos

| # | Hallazgo | Gravedad | Estado |
|---|----------|----------|--------|
| 1 | **Incidencias mostraba a los cuatro perfiles juntos** dentro del panel de Jurídico (incidencias, detenciones, archivos y eventos retenidos sin filtro de perfil). | Alta | Arreglado y publicado (`20d2faa`). Cada perfil tiene su pantalla (`/incidencias?perfil=`), filtrada por perfil, y está en el menú de los cuatro. |
| 2 | **Botones que cambiaban de perfil sin avisar.** Desde Autos, Coberturas o Marketing, «Ajustes generales», los avisos de calidad de línea, «Abrir la conversación» de Salud y los chats de adjuntos y presupuestos abrían el panel de Jurídico. | Alta | Arreglado y publicado. Los enlaces se arman dentro del perfil; además, una pantalla de Jurídico pedida desde otro perfil se abre en ese perfil (control en el middleware). |
| 3 | **Más de veinte pantallas caían en Jurídico cuando el enlace no decía el perfil.** | Alta | Arreglado y publicado. Sin perfil en la dirección vale el último perfil usado; si no hay ninguno, se vuelve a elegir. Una prueba falla si alguien vuelve a escribir ese respaldo. |
| 4 | **Salud mostraba avisos de todos los perfiles dentro de cualquiera**, con botones que llevaban a otro perfil. | Media | Arreglado y publicado. Cada perfil ve lo de todo el sistema y lo propio. |
| 5 | **Los ajustes generales solo existían en la Configuración de Jurídico.** | Media | Arreglado y publicado. Se muestran dentro de los Ajustes de cada perfil, con el aviso de que valen para los cuatro. |
| 6 | **La lista de bots traía los de los cuatro perfiles** a la pantalla «Bot IA» de cada uno (se filtraban recién en el navegador). | Baja | Arreglado y publicado (`07e855e`): el servidor entrega la base común y los del perfil. |
| 7 | **«Piden una persona» estaba inflado.** De 94 casos, 36 eran rechazos y 38 no tenían motivo. Causa: al cerrar a alguien como perdido, o al registrar una detención, la marca de «espera a una persona» no se quitaba; y un perdido que escribía de nuevo en un chat sin bot volvía a quedar marcado. | Alta | Arreglado y publicado: al perderse, la oportunidad deja de pedir una persona y el chat vuelve al bot (regla en `alPerderse`, con prueba). La lista se llama «Oportunidades reales», excluye rechazos, perdidos, caídos y captados, y se ordena por interés. |
| 8 | **«Para recuperar» acumulaba gente de hace semanas** (341 personas con más de 10 días de silencio). No había ninguna regla que los cerrara. | Alta | Arreglado y publicado: regla de Caídos (mensaje a los 3 días, 24 horas de espera; lo viejo cae directo). «Para recuperar» se retiró; Caídos y «Quedaron sin respuesta» están en Descartados. |
| 9 | **«Te escribió» significaba cosas distintas** en Hoy (9) y en el filtro de chats (7). | Media | Arreglado y publicado: una sola definición (la última palabra es de la persona y nadie le contestó), guardada en la oportunidad por la base. |
| 10 | **Las 55 incidencias abiertas eran diferencias de la migración del 10/10**, no reclamos. | Media | Archivadas en la limpieza, con nota. Desde ahora solo abren incidencia una amenaza legal contra nosotros o la queja de un cliente captado. |
| 11 | **En Contactos, tocar una persona no hacía nada**: solo funcionaban los dos botones de abajo. | Media | Arreglado y publicado: toda la tarjeta abre a la persona. |
| 12 | **En el celular, Descartados y Ajustes se desbordaban hacia el costado** (una grilla se ensanchaba con nombres o direcciones largas). | Media | Arreglado (pendiente de publicar junto con este documento). |
| 13 | **La prueba «asistente: cada tipo permitido…» fallaba desde hace semanas** porque contaba un número fijo de acciones. | Baja | Arreglada: comprueba que no haya acciones repetidas y que cada una tenga nivel. |
| 14 | **Una misma persona aparecía en «Para cerrar» y en «Oportunidades reales»** (captados que volvieron a escribir). | Baja | Arreglado: quien ya aceptó está solo en «Para cerrar». |

## 2. Comprobaciones hechas en producción

- **Separación entre perfiles (después del arreglo).** Recorrido automático de 110 pantallas por perfil, siguiendo cada enlace: 440 pantallas, **0** con el marco de otro perfil. Cruce de identidad: las 32 listas de cada perfil (Hoy, Chats, Contactos, Descartados, Resultados, Oportunidades, «Por base», Incidencias, Campañas, Agenda, Seguimiento) mostraron 1.361 personas y chats; **los 1.361 son del perfil que los mostraba**.
- **Base de datos (antes de tocar nada):** ninguna conversación, contacto, oportunidad, campaña, base o línea etiquetada en un perfil equivocado. Cinco teléfonos existen en dos perfiles: son registros separados, uno por perfil, y así tiene que ser.
- **«Deshacer» de la limpieza:** probado con un caso; la oportunidad volvió exactamente a su estado anterior (incluida la fecha de última actividad) y un segundo intento responde que ya estaba deshecho.
- **Pantallas nuevas o cambiadas** (Hoy, Activos, Descartados, Movidos en la limpieza, Incidencias, En seguimiento, Ajustes) a 1280 y 375 px: abren, sin errores en la consola.
- Suite unitaria: 411 pruebas, todas pasan. Typecheck, lint y build en verde.

## 3. Limpieza de lo ya cargado (lote `limpieza-1311`)

Autorizada por la responsable («Reclasificar solo»). No se envió ningún mensaje, no se borró nada y no se levantó ninguna detención. Cada movimiento guarda el estado anterior y se deshace desde «Movidos en la limpieza» (en Descartados de cada perfil).

| Movimiento | Jurídico | Coberturas | Marketing | Autos | Total |
|---|---|---|---|---|---|
| Perdidos que seguían pidiendo una persona → dejan de pedirla | 54 | 8 | 6 | 4 | 72 |
| Rechazos que figuraban como atención humana → Perdidos | 0 | 3 | 0 | 0 | 3 |
| Dejaron de responder hace más de 4 días → Caídos | 32 | 26 | 168 | 39 | 265 |
| Releídos por el bot: habían rechazado → Perdidos | 1 | 1 | 61 | 2 | 65 |
| Releídos por el bot: quedan donde estaban | 3 | 0 | 3 | 2 | 8 |
| Incidencias de la migración → archivadas | 55 | 0 | 0 | 0 | 55 |

De los 67 que habían quedado con la última palabra y sin respuesta, el bot releyó cada chat: **ninguno había concretado una llamada** y ninguno quedó como «posible captación». En Marketing, 61 de 62 eran contestadores automáticos de otros negocios (57 tienen frases típicas de respuesta automática; 42 son de un solo mensaje). Están en «Movidos en la limpieza» con su motivo, por si alguno hay que revertirlo.

### Antes y después

| | Antes | Después |
|---|---|---|
| Figuran esperando a una persona | 94 | 18 (Jurídico 8, Marketing 5, Autos 4, Coberturas 1) |
| De esos, sin haber aceptado todavía («Oportunidades reales») | no se distinguía | se mide después de publicar el arreglo 14 |
| Dejaron de responder y seguían a la vista | 347 | 0 (265 en Caídos; el resto, releído) |
| Incidencias abiertas | 55 | 0 |
| Perdidos que seguían pidiendo una persona | 113 chats | 0 |
| Para cerrar (captados sin derivar) | 16 | 16 (no se tocaron) |

## 4. Definiciones: un solo significado por nombre

| Nombre en el panel | Qué significa | De qué dato sale |
|---|---|---|
| Te escribieron | La última palabra del chat es de la persona y nadie le contestó (últimos 7 días). Si el bot atiende el chat, se le dan 10 minutos antes de mostrarlo | `ultima_palabra = persona`, no perdido, sin detención |
| Oportunidades reales | Esperan a una persona del equipo y tienen interés. Sin rechazos, perdidos, caídos ni captados | `attention_state = requiere_humano`, captación abierta, sin detención |
| Para cerrar | Aceptaron el siguiente paso y falta derivarlos | `capture_state = captado`, `derivation_state = no_derivado` |
| Posible captación a revisar | El bot dudó si concretaron una llamada | `posible_captacion = true` |
| Hablando ahora | La persona escribió en los últimos 3 días | `last_inbound_at` |
| En seguimiento | No escriben hace más de 3 días y el sistema todavía lo intenta | última palabra nuestra, sin caer |
| Caídos | Dejaron de contestar y terminó el seguimiento | `followup_state = caido` |
| Quedaron sin respuesta | Escribieron hace más de 7 días y nadie les contestó | `ultima_palabra = persona`, más de 7 días |
| Perdidos | Dijeron que no | `capture_state = perdido`, sin detención |
| No quieren que les escriban | Pidieron la baja, se quejaron o el número es equivocado | detención |
| Incidencia | Amenaza legal o denuncia contra nosotros, o queja de un cliente captado | `incidences.kind` en esos dos tipos |

Las definiciones viven en `src/lib/indicadores.ts`; las pantallas no escriben condiciones propias.

## 5. Pendiente de la auditoría

- **Seguridad completa** (sesión y pertenencia en cada ruta, ingreso por código, pedidos desde otra página, webhooks, secretos en el paquete del navegador, consejos de seguridad de la base, entradas, encabezados, `npm audit`): **no empezada en esta corrida**.
- **Funcionamiento** (errores de producción de las últimas 24 horas, tiempos del latido, carreras): no empezado.
- **Rendimiento** (`campaign_metrics`, consejos de rendimiento de la base): no empezado.
- **Fallas del sistema en un lugar propio** (decisión de la responsable): las reglas de Salud ya separan lo del perfil de lo de todo el sistema, pero falta el bloque «Fallas del sistema» con su contador y su aviso.
- **Aviso a los dispositivos cuando se abre una incidencia de reclamo**: falta.
- **Hoy**: ya usa las definiciones nuevas; falta quitar lo que no lleva a una acción.
- **Estadísticas con embudo y origen**: falta.
- **Portada de perfiles que no se actualiza**: falta.
