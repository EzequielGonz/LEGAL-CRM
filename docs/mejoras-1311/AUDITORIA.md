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
| 12 | **En el celular, Descartados y Ajustes se desbordaban hacia el costado** (una grilla se ensanchaba con nombres o direcciones largas). | Media | Arreglado y publicado (`6854fa9`). Comprobado: 36 pantallas de los cuatro perfiles a 375 px, sin desborde ni errores. |
| 13 | **La prueba «asistente: cada tipo permitido…» fallaba desde hace semanas** porque contaba un número fijo de acciones. | Baja | Arreglada: comprueba que no haya acciones repetidas y que cada una tenga nivel. |
| 14 | **Una misma persona aparecía en «Para cerrar» y en «Oportunidades reales»** (captados que volvieron a escribir). | Baja | Arreglado: quien ya aceptó está solo en «Para cerrar». |
| 15 | **En Hoy, «Se enfriaron» y «Pidieron una persona» usaban otra cuenta**: después de la limpieza «Se enfriaron» mostraba 168 en Marketing (los que ya eran Caídos). | Media | Arreglado y publicado (`b82065b`): se llaman «En seguimiento» y «Oportunidades reales» y usan la misma definición que las listas. Comprobado en los cuatro perfiles: Hoy y Chats muestran los mismos números. |
| 16 | **La lista de campañas de un perfil dio error de tiempo en producción** (4 veces el 13/11). | Media | Arreglado y publicado (`8718a66`): índice nuevo y cifras guardadas 20 segundos. |
| 17 | **Las cifras de la portada de perfiles no se actualizaban** hasta recargar a mano. | Media | Arreglado y publicado (`868f09f`). |

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
| De esos, sin haber aceptado todavía («Oportunidades reales») | no se distinguía | 7 (Jurídico 3, Marketing 3, Autos 1, Coberturas 0). Los otros 11 ya aceptaron y están en «Para cerrar» |
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

## 5. Seguridad (revisada el 13/11 a las 10:00)

| Qué se miró | Resultado |
|---|---|
| Sesión en las rutas del servidor | Las 7 rutas sin control de sesión son las que tienen que ser públicas (formulario de las landings, ingreso y salida, tres webhooks, latido), cada una con su propia verificación. Todas las demás exigen sesión, y además el middleware corta cualquier pedido sin sesión antes de llegar. |
| Sesión en las pantallas | Todas pasan por el middleware; los paneles tienen además el control en su marco. |
| Ingreso por código | Código guardado con `scrypt` y comparado en tiempo constante; bloqueo por origen después de los intentos fallidos; cookie `HttpOnly`, `Secure` y `SameSite=Lax`. Observación: la sesión dura 400 días mientras se use (decisión anterior, «sin vencimiento programado»); el cierre de sesión en todos los dispositivos existe. |
| Pedidos desde otra página | `SameSite=Lax` impide que otra web dispare cambios con la sesión de la responsable. |
| Webhooks | Meta: firma `X-Hub-Signature-256` verificada sobre el cuerpo crudo; lo que no valida va a retenidos. Wasender: secreto por línea. |
| Latido | Secreto solo por encabezado, comparación en tiempo constante. |
| Secretos en el navegador | Ningún archivo de cliente lee variables privadas; la clave de servicio no aparece en el paquete del navegador. |
| Base de datos | Todas las tablas (incluidas las nuevas) con RLS y sin políticas para la clave pública: solo entra el servidor. Avisos del proveedor: extensión `pg_net` en el esquema público (viene así de la plataforma; sin acción) y protección de contraseñas filtradas (no aplica: el panel no usa cuentas de Supabase). |
| Búsquedas que arman filtros | El texto de búsqueda de chats pasa por `textoBusquedaSeguro`; los demás filtros usan identificadores fijos o validados. |
| HTML insertado | Solo en la vista previa de piezas propias de Contenido y en el guion del modo claro/oscuro. Nada que venga de un prospecto. |
| Encabezados | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y, desde el 13/11 a la tarde, **política de contenido (CSP)**: programas y llamadas solo al propio panel y al almacenamiento, un único marco externo (la vista previa de Instagram), sin marcos ajenos y sin cambiar a dónde envían los formularios. Recorridas 106 pantallas en producción con la política activa: ningún bloqueo. Los guiones y estilos en línea siguen permitidos (Next los necesita); cerrarlos del todo va con la subida de versión. |
| Dependencias (`npm audit --omit=dev`) | **De 4 avisos a 2** (13/11 a la tarde). Resueltos: `xlsx` (se dejó de usar: Excel se lee con `read-excel-file` y se escribe con `write-excel-file`; un `.xls` viejo ahora pide guardarlo como `.xlsx` o CSV) y `source-map-js` (actualizado). Quedan `next` y el `postcss` que trae adentro: no hay arreglo en la línea 14, hay que subir a 15.5.28 o más (ver §9). Mientras tanto se apagó el optimizador de imágenes de Next, que el panel no usa y es donde están los dos avisos críticos que aplican a un servidor propio; el panel no usa acciones de servidor, que es donde están los de caída del servicio. |
| Mezcla entre perfiles | Ver hallazgos 1 a 6: corregida y comprobada. Con un solo código compartido no hay permisos por perfil; la separación es de pantallas y consultas. |

## 6. Funcionamiento y rendimiento

- **Errores de producción (últimas 24 horas):** un solo grupo, 4 veces: la lista de campañas de Coberturas se quedó sin tiempo al calcular las cifras de una campaña. Causa: `campaign_metrics` contaba los mensajes de la campaña recorriendo toda la tabla de mensajes, y la lista la pedía una vez por campaña en cada carga. **Arreglado:** índice nuevo (migración `0609`) y las cifras de cada campaña se guardan 20 segundos.
- **Portada de perfiles que no se actualizaba:** arreglado (se actualiza sola cada 30 segundos y al volver a la pestaña; al navegar ya no se muestra la copia vieja).
- **Latido:** el motor de caídos corre desfasado de los descartes (minuto 5 y minuto 0 de cada diez) y cada cambio se aplica solo si la oportunidad sigue como se leyó. Tiempos por etapa: sin medir en esta corrida.

## 7. Pendiente de la auditoría

- **Subida de Next a la línea 15.5** (plan en §9). Es lo único que cierra los dos avisos de dependencias que quedan.
- **Latido:** medir tiempos por etapa y probar dos latidos a la vez.
- **Aviso a los dispositivos** cuando se abre una incidencia de reclamo o aparece una falla del sistema.
- **Diseño «bien llamativo»** (bloque F del plan).
- **Estadísticas:** el embudo no tiene todavía las etapas «conversaron», «oportunidad real» y «ventas».
- **Hallazgos del inventario de rutas** (§8.5): horarios de agenda que se reemplazan sin red, dos borrados de verdad y rutas que dicen «ok» sin comprobar.
- **Sin caso real todavía:** un audio entrando, un reclamo serio y una «posible captación».

## 8. Corrida de la tarde (13/11, desde las 13:50)

### 8.1 Audios

Ver `PLAN-4.md`, bloque I. Publicado y encendido en los cuatro perfiles. Comprobado con pruebas unitarias (10) y, en producción, con «Pasar a texto» sobre 3 audios viejos de Jurídico, Autos y Marketing: 4 a 6 segundos cada uno, texto correcto, duración leída del archivo (6, 15 y 15 segundos). Solo se escribió el texto en el mensaje (`ops_change_log` 230). Falta ver entrar un audio real: no se puede simular sin mandarle uno a una línea.

### 8.2 Hoy: qué se queda y qué se fue

| Bloque que había | Decisión |
|---|---|
| Chips de estado (línea, campaña, bot, Wasender) | Se quedan: avisan si algo está frenado. 40 px de alto en el celular |
| «Atención humana» | Se queda: a quién hay que contestarle |
| «Captados para derivar» | Se queda: a quién hay que pasar |
| Aviso «N respondieron que no siguen» con su botón | Se queda: es una acción |
| «Para mirar» → Oportunidades reales | Se fue: repetía la lista de arriba |
| «Para mirar» → Bot trabado | Pasa a «También hoy», solo si hay alguien |
| «Para mirar» → En seguimiento | Pasa a la línea «Qué está haciendo el bot» |
| «Para mirar» → No interesados («solo cifra») | Se fue: no llevaba a ninguna acción |
| «En marcha» → Agendaron | Pasa a «También hoy» como «Citas próximas», solo si hay |
| «En marcha» → Hablando ahora | Pasa a «Qué está haciendo el bot» |
| «En marcha» → Derivados sin resultado | Pasa a «También hoy», solo si hay |
| «Campañas activas» | Pasa a «Qué está haciendo el bot» (enviados de cada campaña) |
| «Esta semana» (cinco cifras por período) | Se mudó a Resultados, como embudo |
| «Última base» | Se fue: está en Resultados e Historial |
| «Más indicadores» (modo avanzado) | Se fue: las mismas listas están en Contactos y Salud |

Hoy quedó en: chips, dos listas, «También hoy» (solo lo que pide algo y tiene a alguien), «Qué está haciendo el bot» (una línea, cada dato abre su lista) y el enlace a Resultados.

### 8.3 Resultados

Arriba, el embudo del período: contactados → respondieron → captados → derivados, con el porcentaje de paso entre etapas y la comparación con el período anterior; los perdidos van aparte porque no son una etapa. Cada etapa abre sus personas (reemplaza a los botones «Qué ver»). Debajo sigue «De dónde vienen». Usa las mismas cuentas que tenía Hoy (`src/lib/hoy/periodos.ts`), sin definiciones nuevas. Comprobado en producción (Jurídico, semana del 9 al 13/11: 220 → 22 → 3 → 2; 65 perdidos).

La tabla vieja «Captados y casos» se retiró: su dirección lleva a la lista equivalente de Contactos (`destinoDeCasosViejos`).

### 8.4 Asistente con permiso para todo

- **Cómo quedó:** el asistente tiene sus herramientas propias de antes (campañas, chats, bot, roles, publicaciones) y, para todo lo demás, un catálogo de **77 operaciones** (`src/lib/asistente/catalogo.ts`). Busca la operación, pide lo que falte y la deja como propuesta. Al confirmar, el servidor llama **a la misma ruta que usa la pantalla**, con la sesión de quien confirma: no hay una copia de la lógica que pueda saltearse una validación.
- **Perfil:** lo pone el servidor (el del panel donde está abierto). Las cosas se nombran por su nombre o por el teléfono de la persona y se comprueba que sean de ese perfil; lo de otro perfil se rechaza con el aviso de abrir el asistente ahí.
- **Niveles (se conservan los tres y se recalculan en el servidor):** un clic; confirmación reforzada si puede salir un mensaje a una persona; código de acceso si gasta, enciende un bot o cambia un control general. El asistente nunca ve ni escribe el código.
- **Secciones:** menú a medida por perfil (renombrar, ocultar y mover secciones, renombrar pestañas), con deshacer. Hoy y Ajustes no se pueden ocultar. Tabla `personalizacion_perfil` (migración 0611); historial en `ops_change_log`.
- **Código:** lo que hay que programar se arma como pedido completo y queda en la Bandeja para Claude (no hay tarea que la revise sola: decisión de la responsable).
- **Órdenes de afuera:** el texto de los chats, las bases y los archivos es dato; el asistente no propone acciones porque un mensaje de un contacto lo pida.
- **Cobertura:** una prueba recorre las rutas del panel que cambian algo y exige que cada una esté en el catálogo, tenga herramienta propia o figure en `FUERA_DEL_CATALOGO` con su motivo (35 rutas afuera a propósito: las que piden subir un archivo, tipear un código que llega al teléfono, o ver algo en pantalla para decidir).
- **Probado en producción (13/11, 14:45), con cosas inofensivas y restauradas:**

| Pedido | Resultado |
|---|---|
| Agregar un feriado el 8/12/2027 (Coberturas) | Propuesta de un clic; al confirmar se creó por la ruta del calendario |
| Quitar esa excepción | La encontró por el día; al confirmar quedó archivada |
| Renombrar «Contactos» a «Clientes» en el menú | Confirmado y después deshecho: el menú volvió al original |
| Poner la pausa general | Propuesta con «pide el código»; confirmar sin código: rechazado (428). Descartada |
| Archivar desde Coberturas una campaña de Jurídico | No la encontró en ese perfil y avisó que hay que abrir el asistente en Jurídico |
| «Quiero una pantalla nueva…» | Armó el pedido para la Bandeja para Claude. Descartado |
| «¿Qué podés hacer con las líneas de Wasender?» | Listó las operaciones del grupo |

### 8.5 Hallazgos del inventario de rutas (sin arreglar, para decidir)

Al relevar las 97 rutas que cambian algo aparecieron cosas que no son del asistente pero conviene saber:

1. **Horarios de la agenda (`agenda/availability`):** al guardar, borra todas las reglas del área y después inserta las nuevas, sin transacción. Si el guardado falla en el medio, se pierden los horarios. Por eso quedó fuera del catálogo. Arreglo: una sola operación en la base.
2. **Dos borrados de verdad** (contra «nada se borra»): «vaciar la cola» de búsquedas de Google Maps borra las pendientes de todos los perfiles, y quitar un teléfono de avisos borra la fila. Arreglo: marcar como canceladas / archivadas.
3. **Rutas que responden «ok» aunque el identificador no exista:** pausar campaña, cancelar cita (ruta vieja), encender o apagar la IA de un chat, revisar un caso del corpus, cambiar el estado de un pedido de mejora.
4. **Cambiar el teléfono principal de avisos:** un pedido mal formado lo borra.
5. **Editar la página de Facebook o el perfil de WhatsApp desde Redes:** manda todos los campos siempre; lo que se deja vacío pisa lo que hay en Meta.
6. **«Recibir acá» en una línea de Wasender:** hecho desde una vista previa del sitio, desviaría los mensajes entrantes de producción.

## 9. Plan para subir Next (de 14.2 a 15.5)

**Por qué:** los avisos de `next` no tienen arreglo en la línea 14 (última: 14.2.35, la que está). La primera versión sin avisos es la 15.5.28. No se hizo en esta corrida porque cambia cómo se leen los datos de cada pedido en todas las pantallas y rutas, y eso pide una vuelta dedicada con recorrido completo.

**Qué cambia (lo que toca a este panel):**
1. `params` y `searchParams` de páginas y rutas pasan a ser promesas: hay que esperarlos. Afecta a unas 70 rutas y páginas con tramos dinámicos y a 63 páginas que leen `searchParams`. Next trae un programa que hace la mayor parte del cambio solo (`npx @next/codemod@latest next-async-request-api .`); lo que no pueda resolver lo deja marcado.
2. `cookies()` y `headers()` también pasan a ser asíncronas (sesión, perfil activo).
3. React pasa a la 19 (App Router lo exige). Revisar las librerías que dependen de React.
4. Las rutas `GET` y la navegación dejan de guardarse en memoria por defecto: el ajuste `staleTimes` que se puso el 13/11 deja de hacer falta.
5. `next lint` y la configuración de ESLint cambian de formato.

**Pasos, en una rama aparte:**
1. Subir `next`, `react`, `react-dom`, `eslint-config-next` y los tipos; correr el programa de migración.
2. `typecheck`, `lint`, las 442 pruebas y `build` hasta dejarlos en verde.
3. Probar en una vista previa **solo mirando** (comparte base y líneas con producción): ingreso, los cuatro perfiles, las 106 pantallas del recorrido, un chat, la ficha, el asistente y los webhooks con un evento de prueba firmado.
4. Publicar un día de poco movimiento, con la versión anterior lista para volver atrás desde Vercel.
5. Después: cerrar la política de contenido (guiones firmados por pedido en lugar de «en línea»).

**Tiempo estimado:** una vuelta de trabajo dedicada. **Riesgo si no se hace:** los avisos que quedan son de caída del servicio y de almacenamiento intermedio; los dos críticos apuntan al optimizador de imágenes, que ya está apagado.
