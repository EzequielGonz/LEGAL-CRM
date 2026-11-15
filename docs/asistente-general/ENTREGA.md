# Asistente general · entrega (15/11)

Estado: **especificado e implementado en la rama; probado con pruebas unitarias, tipos, lint y build. No publicado ni habilitado.** La migración 0626 no está aplicada (la aplica el coordinador).

## Qué incluye

- **Botón «Asistente general»** en Perfiles, abajo de las cuatro tarjetas (`src/components/asistente/asistente-general.tsx`, montado con una línea en `src/app/perfiles/page.tsx`). Abre un diálogo grande al costado; en el teléfono ocupa toda la pantalla (`panel-asistente-general.tsx`, se carga recién al abrirlo). Foco atrapado, fondo inerte y Escape con `useDialogo`; cerrar no descarta la charla ni las propuestas.
- **Modo general del motor** (`src/lib/asistente/motor.ts`): el mismo bucle y las mismas herramientas del asistente de perfil, cada una con el parámetro `perfil`. Sin perfil claro, la herramienta responde que hay que preguntar. Cada propuesta se guarda con el `rubro_id` del perfil al que va. El asistente de cada perfil quedó igual: su texto de instrucciones se comparó carácter por carácter antes y después (8 combinaciones de perfil y modo, idénticas) y sus herramientas no cambian (prueba).
- **Planillas (Excel o CSV)**, además de imágenes y PDF: se leen en el navegador (`leerTodasLasHojas` en `parse-file.ts`); cada hoja con datos es una planilla aparte. Al modelo solo le llega un resumen por planilla (`resumirHoja`, `sanearResumenes`): nombre, hojas, columnas, filas, columnas de teléfono y nombre detectadas, repetidos dentro del archivo y entre archivos, y hasta 3 filas de ejemplo con teléfonos, documentos y números largos ocultos (11••••1234), nombres reducidos («Ana P.») y correos sin usuario. Las filas completas se suben como JSON al depósito privado `bases-originales` (`asistente-general/<id>/filas.json`) con una URL firmada de un solo uso, como el archivo original de una base (sin el límite de ~4,5 MB por pedido). Hasta 50.000 filas por planilla; más de 5000 se dividen en bases hermanas.
- **Herramientas nuevas**: `resumen_general`, `opciones_wasender`, `analizar_archivo` (personas para contactar sin detenidos ni ya contactados, con el mismo cruce que la importación; avisa si el archivo ya se cargó) y `proponer_plan_campanas`.
- **Propuesta `plan_campanas`** (una por perfil y planilla) con **boceto editable**: totales arriba («N campañas · N personas · N líneas»), una tarjeta plegable por perfil con base nueva, columnas usadas, personas, línea (avisa si está desconectada), ritmo, ejemplos de las plantillas de inicio, límite por día, días y días estimados; se puede destildar un perfil, cambiar nombre, línea (solo del mismo perfil), días, límite, entrenamiento y si se lanza (`PATCH /api/asistente/acciones/[id]/plan`). El botón final dice la cifra exacta.
- **Confirmación**: nivel «contacto» si lanza (casilla reforzada, sin código) y «cambio» si solo importa y crea. Se ejecuta de a un paso por pedido (importar cada parte → crear → sumar las otras partes → lanzar), con lo hecho anotado: si un paso falla, lo hecho no se deshace y «Reintentar lo que falló» sigue desde ahí (vuelve a pedir la casilla si lanza). Si un perfil falla, los demás siguen.
- **Campañas idénticas a las de la pantalla**: se crean llamando a `/api/campaigns` con la sesión de quien confirma y el mismo cuerpo que el formulario con Wasender y «rotar entre las plantillas de inicio» (`cuerpoCampanaWasender`); las partes extra se suman con `/api/campaigns/[id]/agregar-base`; se lanza con `launchCampaign` (la misma función que la ruta de lanzamiento). Importar usa `importBase` con la columna detectada, siempre como base nueva y con la fuente «Creada desde el asistente general». La campaña queda rotulada en `campaigns.creada_desde` (si la migración está aplicada) y en `ops_change_log`.

## Segunda pasada (revisión con skills, 15/11)

- **Retomar lo que quedó a medias**: al abrir el asistente general aparecen los planes de la última semana sin confirmar, a medio hacer o con un paso que falló (`GET /api/asistente/general/planes`), con «Seguir donde quedó» o «Reintentar lo que falló».
- **Lanzar con una confirmación vieja, no**: si un plan quedó a medias más de 30 minutos, el paso de lanzar pide marcar la confirmación de nuevo.
- **Sesión vencida a mitad**: el paso queda en error con «ingresá de nuevo y tocá Reintentar»; lo hecho no se repite.
- **Importación cortada**: si un intento anterior dejó una base a medias, no se adopta; se pide archivarla desde Bases y reintentar.
- **Planilla intacta**: la propuesta guarda la huella de todas las filas y se comprueba al importar. La URL firmada solo crea su propio objeto (sin reemplazo); la ruta la arma el servidor.
- **Boceto**: confirmar espera los cambios que se están guardando y usa la última versión guardada; la casilla «Incluir» y los errores quedan fuera de la parte plegable; foco visible en los días.
- **Laboratorio**: el asistente general no escucha el evento `crm:asistente` ni monta el asistente de perfil (prueba).

## Correcciones de la segunda opinión (15/11)

1. **Base cortada o ajena**: la base se guarda con la fuente «Creada desde el asistente general (propuesta xxxxxxxx)». Si al reintentar ya existe una base con las mismas filas, se usa solo si es de esa propuesta y está completa (`puedeAdoptarBase`); si no, se avisa y ese perfil no sigue.
2. **Paso tomado**: vence a los 120 s (la ruta corta a los 60 s), así nunca se toma un paso que todavía corre.
3. **Ejemplos al modelo**: en claro solo categorías cortas que se repiten (rubro, ciudad, tipo de consulta) y fechas; domicilios, observaciones, apellidos, documentos y números largos van ocultos. El servidor además oculta todo texto de más de 40 caracteres.
4. **Costo y tiempo**: cada planilla se descarga una sola vez por pedido; las campañas del plan se arman en serie y, pasados 35 s, las que faltan se informan para pedirlas en otro mensaje.
5. **JSON de filas en el depósito**: quedan sin vencimiento (ver riesgos del informe).

## Qué no cambia

Bots, seguimiento, campañas existentes, asistente de cada perfil, detenciones (por rubro, como hoy) y lo que pide código (encender un bot, gastar, controles generales). Nada se activa solo; crear no envía nada.
