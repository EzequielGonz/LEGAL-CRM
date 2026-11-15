---
description: Estado operativo vigente del panel (qué está encendido y qué no), decisiones recientes de la responsable y cómo retomar el trabajo en curso
scope: root
covers: [estado, memoria, seguimiento, wasender, plantillas, bot, despliegue, pendientes, decisiones]
---

# Estado del proyecto · memoria de trabajo

Se actualiza al cierre de cada vuelta de trabajo. Sin datos personales, claves ni códigos de acceso. Ante una contradicción, mandan `CLAUDE.md` y `.claude/referencias/reglas-comunes.md`.

Última actualización: 14/11/2026.

## Qué está encendido hoy

- **Seguimiento automático** (contactos 2 y 3) en los cuatro perfiles, desde el 12/11 8:00. Antes de cada contacto el bot decide si corresponde insistir. No se apaga ni se vuelve a encender sin que la responsable lo pida.
- **Segundo intento por Wasender** para primeros mensajes enviados desde el 13/11.
- **Cierre automático de descartes** a las 6 horas.
- **Caídos automáticos** (desde el 13/11): mensaje de seguimiento a las 72 horas y 24 horas de espera; lo viejo cae sin otro mensaje. Para apagarlo: borrar `caidos_automaticos` de `system_settings`.
- **Reclamos serios**: una amenaza legal contra nosotros o la queja de un cliente captado abre una incidencia del perfil y el bot no contesta.
- **Recontacto del mismo día** (2 h + 2 h), desde el 24/10.
- **Bot: conocimiento versión 2** predefinido en los cuatro perfiles. La versión 1 se conserva. El 14/11 se sumaron 12 fichas (`fuente = 'mejora 14/11'`).
- **Ritmo humano de Wasender** (14/11): plan del día por línea, tandas y pausas variables, texto al azar sin repetir. Rige solo cuando una campaña de Wasender está en curso con una línea conectada.

## Qué está apagado o en pausa

- La campaña de Wasender de Jurídico está pausada y la línea de Wasender, desconectada (hay que escanear el QR). No se reanuda sola.
- Las campañas las lanza la responsable. Publicar código no lanza nada.

## Decisiones de la responsable que siguen valiendo

- Lo hecho para Meta no se pisa ni se rehace; Wasender se suma al lado.
- Nada se borra: se archiva con motivo.
- El bot insiste una sola vez; cuando alguien se pierde, sale de la vista de trabajo.
- Mejorar el bot es sumar fichas a la versión 2, no crear otra versión ni editar las existentes.
- Se trabaja con el modelo principal. Otro modelo, solo en tareas secundarias muy sencillas y sin margen de error.
- El aviso de captación queda pendiente hasta que la responsable lo pida.
- El panel tiene que poder usarse sin saber cómo está hecho: cada cifra se abre y muestra personas; textos en palabras, sin nombres internos.
- **13/11, madrugada (Plan 4):** alguien pasa a Caídos cuando, después de dejar de contestar, a los 3 días recibe un mensaje más y pasan 24 horas sin respuesta; los que ya llevan más tiempo van directo. Incidencia de una persona es solo amenaza legal o denuncia, o queja de un cliente captado; enojo, rechazo, «ya tengo abogado» o «no me escriban» pasan solos a Perdidos o No contactar. Las fallas del sistema se avisan en un lugar propio, separado. Lo ya cargado se reclasifica solo, con motivo y con lista para deshacer. Diseño «bien llamativo» (vidrio, 3D, movimiento) tomando ideas de la referencia que mandó.
- **Cada rubro va separado** (13/11): cada perfil con sus funciones y su contenido; nada de un perfil se ve ni se abre desde otro. Manda sobre cualquier pantalla o función nueva.
- **Asistente del panel con permiso para todo** (13/11): que pueda hacer todo lo que hace el panel, cambiar secciones y pedir cambios de código. Detalle y resguardos en `PLAN-4.md`, bloque G.
- **Asistente** (13/11): sigue pidiendo confirmación antes de ejecutar. La tarea que revisa sola la Bandeja para Claude, por ahora no.
- **Quedaron sin respuesta** (13/11): si lo último que dijo la persona concretó una llamada, pasa a captado; si no, queda en «Quedaron sin respuesta»; ante la duda, va a «Posible captación a revisar». No se les escribe solos.
- **14/11 (inicio de conversación):** solo Wasender, Meta queda al margen y no se toca. Lunes a sábado sin días de descanso; nada con patrón fijo (hora de arranque, cantidad, tandas, pausas y texto cambian cada día y cada envío). La responsable conecta las líneas el 15/11.
- **15/11 (auditoría):** textos internos («Wasender», «v1/v2», «JSON») no se cambian. «¿De dónde sacaron mi número?»: disculpa y «no tenemos el registro» (lo atiende otra área). Enojo: disculpa breve y cortar; amenaza o denuncia: además, avisar. Crisis: líneas de ayuda y cartel de urgencia en el panel. El bot nunca da precios: el precio lo define el equipo. Código de ingreso de 8 números. Campañas: botón de entrenamiento (20 por día, 7 días) sin quitar la elección manual de límite y ritmo. Tope de 3 automáticos sin respuesta por persona.
- **15/11 (cómo funciona hoy, aclarado por la responsable):** no hay pausa general. Los bots responden siempre los mensajes entrantes; el seguimiento y todo lo programado siguen normal. Lo único que no se ejecuta solo son las campañas con bases o publicidades: salen cuando las lanzamos. Las líneas de ayuda de crisis salen siempre, aunque una persona haya tomado el chat.
- **15/11 (Asistente general y Laboratorio del bot):** en Perfiles hay un «Asistente general» para los cuatro perfiles (planillas Excel/CSV, boceto por perfil, importar, crear y lanzar con la confirmación reforzada de siempre, sin código) y un «Laboratorio del bot» junto a «Conocimiento del bot». La responsable autorizó crear versiones nuevas (v3…) y elegir otros modelos de Gemini, roles por perfil o generales y pruebas A/B en campañas. Regla: nada de lo activo cambia salvo acción manual en el laboratorio; los bots de base siguen con v2 y el modelo principal. Detalle en `docs/asistente-general/` y `docs/laboratorio-1511/`. Migraciones 0626 y 0630 a 0632 aplicadas.
- Producción se publica directo a `main` desde la rama de trabajo del chat (antes `mejoras-1211`; el 13/11 a la noche, `claude/relaxed-cerf-5oncz1`) después de typecheck, lint, pruebas y build, y se recorre como usuaria antes de informar.

## Dónde está cada cosa

- Plan y pendientes de la vuelta en curso: `docs/mejoras-1311/PLAN-4.md` (lo último que pidió la responsable; va primero) con su especificación de trabajo en `docs/mejoras-1311/PLAN-4-DETALLE.md` (orden, datos medidos, pasos, criterios de aceptación) y `docs/mejoras-1311/PLAN-3.md` (lo anterior que sigue pendiente).
- Qué se probó y qué no: `docs/mejoras-1311/INFORME.md`. Migraciones y cómo deshacer cambios de datos: `docs/mejoras-1311/MIGRACIONES.md`.
- Bitácora detallada de la última vuelta (commits, archivos, cambios en la base, medidas, guiones de prueba): `docs/mejoras-1311/BITACORA.md`.
- Análisis del bot y fichas agregadas: `docs/mejoras-1311/BOT-V2.md`.
- Plantillas de inicio (texto fuente y generador de variantes): `docs/mejoras-1311/plantillas-inicio.mjs`, `generar-variantes.mjs`.

## Cómo retomar

1. `git status` y `git log --oneline -5` en la rama de trabajo (tiene que coincidir con `main`).
2. Leer `PLAN-4.md` y `PLAN-4-DETALLE.md` completos y seguir el orden del detalle (A → B → C → D → G → E → F); después «Lo que queda para la próxima vuelta» en `PLAN-3.md`.
3. Cargas grandes de datos (plantillas, variantes): por la API del panel con una sesión iniciada, no pegando SQL largo.
4. Las pruebas con efectos se hacen con casos viejos y se dejan como estaban, con registro en `ops_change_log`.

## Qué quedó hecho el 13/11 a la mañana (Plan 4)

- Bloques A (rubros separados), B (reglas nuevas) y C (limpieza de lo cargado): hechos, publicados y comprobados. Detalle, números y definiciones: `docs/mejoras-1311/AUDITORIA.md`.
- Falta: resto del bloque D (pantallas), E (seguridad, funcionamiento, rendimiento), F (diseño), G (asistente). Ver la tabla «Estado» de `PLAN-4.md`.
- Wasender con código: el proveedor no lo ofrece por su interfaz. 13/11, 10:20: la responsable dijo «yo me encargo»; no se sigue salvo que lo pida.
- **Audios:** hecho y encendido en los cuatro perfiles (13/11). Llave por perfil en Ajustes › Mensajes de voz. Falta ver entrar un audio real.
- **Asistente con permiso para todo:** hecho (13/11). Propone cualquiera de las 77 operaciones del catálogo y la persona confirma; el código de acceso lo pone la responsable al confirmar. Menú a medida por perfil. No hay tarea que revise la Bandeja sola.
- **Seguridad:** política de contenido activa; quedan 2 avisos de dependencias que piden subir Next a 15.5 (plan en `docs/mejoras-1311/AUDITORIA.md` §9).
- **Diseño:** primera fase (vidrio y movimiento) hecha; el modo por defecto sigue oscuro hasta que la responsable decida.
- **Cómo retomar:** `docs/mejoras-1311/PLAN-4.md`, tabla «Estado» y la línea «Lo que sigue».

## Qué quedó hecho el 13/11 a la noche

- **Next 15.5.29 y React 19**; avisos de dependencias en 0.
- **Embudo completo** (conversaron, oportunidades reales, ventas) y gráfico «Día por día» en Resultados.
- **Rutas:** horarios de la agenda en una sola operación; «vaciar la cola» cancela y quitar un teléfono de avisos archiva (ya no borran); cinco rutas avisan si lo pedido no existe.
- **Latido:** tiempos por etapa en Salud. **Fallas del sistema:** aviso a los dispositivos (uno por tipo, perfil y día). Hoy no hay dispositivos con avisos activados.
- **Diseño:** menú plegable, barra inferior en el celular, portada con profundidad. Modo por defecto: oscuro (decisión de la responsable el 13/11).
- **Sin tocar, para decidir:** la edición de la página de Facebook y del perfil de WhatsApp desde Redes manda todos los campos (lo hecho con Meta no se edita).
- **Sigue faltando:** ver al bot contestar un audio real que entra; cambiar el código de acceso.
- Detalle: `docs/mejoras-1311/AUDITORIA.md` §10 y la tabla de la corrida de la noche en `PLAN-4.md`.

## Qué quedó hecho el 14/11

- **Algoritmo de inicio (Wasender):** `src/lib/wasender/ritmo-humano.ts` (plan del día, tandas, pausas, elección del texto, parecido entre textos) conectado en `src/lib/campaigns.ts` y en el segundo intento. Migración 0615 (índice).
- **Plantillas:** 12 nuevas por perfil para bases frías. En la segunda vuelta se archivaron las 40 viejas: rotan solo las nuevas (12 por perfil, unos 680 textos cada uno). Generador: `docs/mejoras-1411/plantillas-frias.mjs`.
- **Velocidad:** sin precarga automática en enlaces de listas; marca y menú en paralelo; `profile_metrics` en una pasada (migración 0616, mismo resultado).
- **Bot v2:** 12 fichas, contestadores nuevos reconocidos, sin «escribilo» ante stickers. `docs/mejoras-1411/BOT-V2-1411.md`.
- **Segunda vuelta:** rotación al azar por defecto en Wasender; envíos repartidos en todo el día; el límite diario de una campaña de Wasender frena el día y no la campaña; informe de mejoras del bot con Gemini en Bot IA (migraciones 0617 y 0618); asistente con reglas para generar plantillas. La confirmación después de captar ya no se pierde (publicado con autorización). `docs/mejoras-1411/SEGUNDA-VUELTA.md`.
- Detalle: `docs/mejoras-1411/ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`.

## Qué quedó hecho el 15/11

- **Cierre al captar (todos los rubros):** al captar, el bot agradece, confirma quién se va a comunicar y se despide, sin preguntas; si el modelo no lo hace, sale el cierre fijo del rubro. `docs/mejoras-1411/CIERRE-AL-CAPTAR-1511.md`.
- **Propuestas aplicadas:** Jurídico «turno médico pendiente» y «oferta baja de la aseguradora»; Autos «primera respuesta con interés» (adaptada: con Wasender no hay botones). Registros 294 a 296.
- **Decisión:** con Wasender el primer mensaje no lleva botones (eran una limitación de Meta). Las fichas nuevas no dependen de un botón.

- **Auditoría del 15/11 (bloques 1 a 4):** detalle en `docs/auditoria-1511/`. Bots: crisis con líneas de ayuda y cartel urgente; enojo y amenaza con disculpa y corte; contestadores en otros idiomas; validador de precios ampliado; captar solo con aceptación real; fechas en el historial; reintento si falla la IA; «Probar el bot real» igual al bot en vivo. Seguridad: código de 8 números (el de 6 sigue hasta cambiarlo), intentos atómicos con tope general, sesión de 7 días sin uso y 30 en total, agenda solo con horarios libres, errores genéricos. Panel: velocidad (0619) y accesibilidad. Negocio: entrenamiento de campañas, tope por persona, captados de más de 24 h en Hoy, freno por respuesta y aviso de línea caída. Migraciones 0619 a 0623 aplicadas.

## Aprendizajes de esta vuelta

- Publicar primero a `main` y después subir la rama: si se suben las dos seguidas, Vercel construye primero la vista previa y producción espera en la cola.
- Los pasos con riesgo (mover archivos, publicar) conviene correrlos en comandos separados y cortos.
- La limpieza y cualquier relectura con el bot van por tandas dentro de los 60 segundos de una función: el pedido se repite hasta que no quedan pendientes.

- Las tareas en segundo plano se cortan si la cuenta llega al límite de uso: guardar un punto de control en la rama antes de lanzarlas y no depender de que terminen.
- `followup_enabled_since` define desde cuándo entran conversaciones al seguimiento: lo anterior nunca entra solo.
- La falla «asistente: cada tipo permitido…» de la suite es anterior y ajena.
- Las vistas previas de Vercel piden sesión de Vercel: se recorren con un enlace compartido temporal, solo mirando.
- Con Next 15, `params`, `searchParams` y `cookies()` se esperan (`await`); `perfilActivo()` también.
- Las variantes que cambian una o dos palabras arman un patrón igual: para variar de verdad hay que cambiar estructura (orden, arranque, largo). La pantalla de plantillas ahora avisa los textos casi iguales.
- La precarga automática de Next en listas largas multiplica los pedidos al servidor: en listas, `prefetch={false}`.
- Gemini puede tardar más de dos minutos con muchas conversaciones: todo lo que lo llame con textos largos va en segundo plano (`after`) con la pantalla consultando.
- Un informe de IA sobre datos viejos marca problemas ya resueltos: darle fechas a cada conversación y la lista de correcciones (`RESUELTO_EN_EL_SISTEMA` en `informe-mejoras-reglas.ts`, actualizarla al corregir algo del bot).
- Los cambios que alteran cómo responde el bot en charlas reales se publican con autorización expresa: quedan en la rama hasta entonces.
