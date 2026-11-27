# Análisis del panel · inventario (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Inventario mecánico del panel (solo lectura, repo /home/user/crm-main). Hay páginas huérfanas probables, rutas duplicadas entre el panel global y los paneles por rubro, Jarvis y la Bandeja para Claude repetidos en varios menús, y las dos cargas más lentas del recorrido están en /hoy y en los paneles por perfil (11 a 12 s). De las 151 rutas API, 144 llaman a requireSession; las 7 que no lo hacen tienen razón de ser salvo /api/landing, que hay que revisar. No encontré botones vacíos, href="#", alert() ni texto «próximamente» en src/. Advertencia: el cruce de enlaces se hizo con grep literal, así que las rutas dinámicas y los enlaces armados con template strings pueden salir como falsos huérfanos. Las marcas de «huérfana» son provisorias hasta verificarlas en el navegador o con un grep más fino. No ejecuté Graphify ni invoqué skills (ver herramientas_usadas).

## Hallazgos

### 1. Páginas probablemente huérfanas: landing, diseno-muestra y recuperar

- **Tipo:** existe sin conectar · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** Sin enlace de navegación comprobado. diseno-muestra solo aparece citada en CSS (/home/user/crm-main/src/app/premium-fondo.css y panel-premium.css). landing y recuperar solo aparecen como palabra suelta en textos o componentes, no como href.
- **Por qué:** Pantallas de prueba o de diseño que quedaron publicadas sin menú. Ocupan superficie sin función para el dueño.
- **Pasos:**
  1. Confirmar con grep de href/Link a '/landing', '/diseno-muestra' y '/recuperar' en src/ (y en src/lib/menu.ts y src/lib/jarvis/pantallas.ts).
  2. Si no hay enlace, archivar la página (no borrarla, orden de la responsable) y dejar una nota en docs/ del cambio.
  3. Revisar si /recuperar es un flujo de recuperación de campañas o de contraseña antes de decidir.

### 2. Conversaciones duplicadas: /conversaciones, /inbox, /conversacion/[id] y chats por rubro

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Cuatro entradas para lo mismo: /conversaciones (src/app/conversaciones/page.tsx), /inbox (src/app/(dashboard)/inbox/page.tsx), /panel/<rubro>/chats (src/app/panel/*/chats/page.tsx) y /conversacion/[id] que redirige. En el recorrido, /conversacion/<id> fue a /panel/marketing/chats/<id> para cinco IDs y a /inbox/<id> para uno (_rutas.json, n=69 a 74).
- **Por qué:** Se fueron agregando vistas nuevas sin retirar las anteriores. El redirect de /conversacion/[id] no elige el rubro de forma visible: siempre cae en marketing o en inbox.
- **Pasos:**
  1. Elegir una sola vista de chats por rubro (/panel/<rubro>/chats) y dejar /inbox y /conversaciones como redirects.
  2. Corregir /conversacion/[id] en src/app/conversacion/[id]/page.tsx para resolver el rubro del prospecto antes de redirigir (riesgo de mezcla entre rubros).
  3. Revisar el selector src/components/perfiles/selector-pc.tsx que enlaza a /conversacion/[id].

### 3. Asistente y Jarvis: dos superficies distintas con el mismo rol

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** El acceso central dice «Jarvis» pero apunta a /asistente (src/components/perfiles/accesos-centrales.tsx:13). Además hay un orbe flotante Jarvis importado en src/components/perfiles/marco-perfil.tsx:10, un panel por perfil que llama a /api/asistente (src/components/asistente/asistente-panel.tsx:227) y un chat general (src/components/asistente/chat-asistente-general.tsx). Hay también rutas /api/jarvis/* separadas (mensaje, parte, tablero).
- **Por qué:** La migración a Jarvis dejó el asistente anterior en paralelo. Por eso el panel muestra dos asistentes, uno de ellos con el nombre viejo.
- **Pasos:**
  1. Dejar un único punto de entrada: Jarvis (orbe) en marco-perfil.tsx, y quitar el panel de asistente por perfil de las vistas de rubro.
  2. Unificar /asistente y /api/asistente con /api/jarvis, o dejarlos como alias.
  3. Quitar la etiqueta «asistente virtual» que quedó en las vistas (no la encontré en src/*.tsx con grep exacto; revisar también src/lib/jarvis/pantallas.ts).

### 4. Bandeja para Claude aparece en cuatro lugares además de la ruta propia

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** Está en el menú Más (src/components/menu-mas.tsx:111), como tarjeta negra abajo del menú del perfil (src/components/menu-perfil.tsx:21), en la pantalla de Oficina (src/app/oficina/page.tsx:42) y en el Cerebro (src/components/cerebro/hablar-con-claude.tsx:54). La ruta propia es /bandeja (src/app/bandeja/page.tsx) con API /api/bandeja-claude.
- **Por qué:** Cada pantalla nueva agregó su propio acceso. El pedido 9 pide que dentro de cada perfil queden solo Jarvis y Bandeja para Claude, y hoy hay al menos tres accesos a la Bandeja por perfil.
- **Pasos:**
  1. Dejar un solo acceso a la Bandeja dentro del perfil (menu-perfil.tsx) y quitarlo de menu-mas.tsx.
  2. Dejar el de Oficina y Cerebro como enlaces, no como tarjetas con contador propio.
  3. Verificar que el contador de pedidos abiertos sea el mismo en todos los lugares que lo muestran.

### 5. Biblioteca de agentes y Comparar agentes fuera de la sección Bot IA

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Existen y se abren: /biblioteca-agentes (src/app/biblioteca-agentes/page.tsx) y /comparacion-agentes (src/app/comparacion-agentes/page.tsx). Se llega a ellas desde src/components/menu-mas.tsx y desde src/app/(dashboard)/configuracion/page.tsx. No se encontró un enlace dentro de la sección Bot IA (/agentes o /panel/<rubro>/agentes).
- **Por qué:** Se montaron como pantallas sueltas en vez de sub-vistas del bot. Por eso no están donde el dueño las busca.
- **Pasos:**
  1. Mover ambas como pestañas dentro de /panel/<rubro>/agentes (src/app/panel/*/agentes/page.tsx) con el mismo contenido.
  2. Dejar las rutas sueltas como redirects a esas pestañas.
  3. Verificar que Biblioteca y Comparar sean funcionales y no vistas de solo lectura antes de mudarlas (eso lo mide otro hallazgo).

### 6. Rutas duplicadas entre panel global y paneles por rubro

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Par global y por rubro: /prospectos y /panel/marketing/prospectos, /seguimiento y /panel/*/seguimiento, /agenda y /panel/*/agenda, /estadisticas y /panel/*/estadisticas, /campanas y /panel/*/campanas, /bases y /panel/*/bases, /configuracion y /panel/*/configuracion, /contactos y /oportunidades (sin par visible). En src/app/panel/marketing hay además captacion, extraer, presupuestos, consultas-directas y lead/[id] sin par global.
- **Por qué:** El panel por rubro se fue construyendo al lado del global. Las dos rutas muestran datos de los mismos rubros, así que hay que mantener dos copias.
- **Pasos:**
  1. Decidir cuál es la vista canónica (la del rubro) y dejar la global como redirect o como selector de rubro.
  2. Quitar de la navegación las vistas que no tienen dueño claro (ver preguntas).
  3. Revisar src/lib/perfil-ruta.ts para que el redirect conserve el rubro.

### 7. Paneles por rubro redirigen a /hoy?perfil=…

- **Tipo:** riesgo · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** En el recorrido, /panel/juridico, /panel/agencia_0km, /panel/coberturas_medicas y /panel/marketing respondieron 200 pero terminaron en /hoy?perfil=<rubro> (_rutas.json n=23, 31, 37, 43). No existe src/app/panel/juridico ni src/app/panel/agencia_0km/page.tsx es la de la home del rubro (sí existe para agencia_0km y coberturas_medicas, y para marketing; la home de juridico no tiene carpeta propia).
- **Por qué:** La home del rubro se resuelve por query string y no por ruta. Cualquier parámetro mal escrito puede caer en otro perfil si la lectura de perfil no está validada.
- **Pasos:**
  1. Confirmar en src/app/panel/[slug]/page.tsx que el slug se valida contra la lista de rubros y que un slug desconocido no muestra datos.
  2. Dejar la URL canónica /panel/<rubro> sin redirect, o documentar el redirect.
  3. Agregar prueba de aceptación para que /hoy?perfil=X no mezcle datos del otro rubro (reglas de captación).

### 8. Rutas de prueba que dan 404 en el recorrido

- **Tipo:** no existe · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** En _rutas.json dieron 404: /jarvis, /chats, /citas, /mas, /piezas y /meta (n=6, 13, 15, 16, 20, 22). _errores.txt registra los mismos seis. Las equivalentes reales existen: /asistente, /panel/<rubro>/chats, /meta/lineas (src/app/meta/lineas/page.tsx), menú Más.
- **Por qué:** El recorrido usó nombres que se le ocurrieron, no rutas que existan. No es un enlace roto de la UI en lo que pude revisar, pero no verifiqué con grep cada uno de esos textos en src/.
- **Pasos:**
  1. Antes de decir que hay enlaces rotos, correr grep de '"/chats"', '"/mas"' y '"/piezas"' en src/ para descartar enlaces a esas rutas.
  2. Si no hay enlaces, descartar los hallazgos y no tocar nada.
  3. Actualizar el recorrido para que use solo rutas reales (las del find src/app -name page.tsx).

### 9. Lentitud en /hoy y en las home de los paneles por rubro

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Medidos en _rutas.json: /hoy 11.823 ms (n=2), /salud 11.755 ms (n=11), /panel/agencia_0km 12.327 ms (n=31), /panel/coberturas_medicas 12.443 ms (n=37). Las demás páginas responden entre 0.8 y 4.5 s; /panel/marketing respondió en 2.464 ms.
- **Por qué:** Probablemente la home de rubro y /hoy cargan muchos datos en el servidor antes de responder (conteos, tableros, tarjetas). Esta medición no separa cold start de tiempo real, así que hay que repetirla.
- **Pasos:**
  1. Repetir la medición tres veces por ruta para separar cold start.
  2. Revisar src/app/panel/[slug]/page.tsx y el componente del tablero Hoy (src/components/inicio/tablero-hoy.tsx) para ver qué consultas se hacen en serie.
  3. Usar Suspense por bloque o cachear conteos donde no cambien en el día.

### 10. API sin requireSession: 7 rutas

- **Tipo:** riesgo · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** Sin requireSession: /api/acceso/ingresar, /api/acceso/salir, /api/campaigns/tick, /api/landing, /api/webhooks/meta, /api/webhooks/wasender, /api/webhooks/whatsapp. Las de webhooks y tick tienen su propia verificación (tick usa CRON_SECRET por Bearer en src/app/api/campaigns/tick/route.ts:39-45; webhooks verifican firma). Las de acceso son login y logout. Quedan 144 rutas con requireSession (listado en /tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/analisis2711/api_auth.txt).
- **Por qué:** Las rutas de login, webhooks y cron no tienen sesión por diseño. /api/landing es la excepción sin justificación visible: no la revisé a fondo.
- **Pasos:**
  1. Revisar src/app/api/landing/route.ts: si recibe formularios públicos debe validar límite de envíos y no devolver datos de prospectos.
  2. Confirmar que las tres de webhooks verifican firma antes de cualquier escritura.
  3. Dejar la lista en docs/ como excepción aprobada.

### 11. Botones o enlaces vacíos, «próximamente» o alert(): no hay

- **Tipo:** anda bien · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Grep en src/ de onClick={() => {}}, onClick={undefined}, href="#", window.alert y alert(): cero resultados. Grep de «próximamente», «en desarrollo» y «en construcción»: cero resultados en tsx. Los 12 resultados de TODO son comentarios o texto del dominio (ej. src/lib/contenido/politica.ts:85, src/lib/agentes/modulos.ts:144), no funciones pendientes.
- **Por qué:** El grep no detecta handlers que sí existen pero no hacen nada (solo cambian un estado, o llaman a una función que no persiste). Eso sí hay que medirlo con recorrido real.
- **Pasos:**
  1. Para los botones que no hacen nada, revisar con el recorrido de la otra sesión (Laboratorio de bots, Salud, Pendientes) que el clic tenga efecto en la base o en la API.
  2. Si hace falta un chequeo automático, agregar un test de aceptación que cuente clics con efecto observable.

## Propuestas

- **Script de inventario que cruce enlaces con template strings** (S). El grep literal dio falsos huérfanos. Un script que lea Link, href, router.push y menu.ts daría una lista confiable para archivar o unir páginas.
- **Recorrido con rutas reales y repetición de tiempos** (S). El recorrido actual midió rutas que no existen (6 de 70 dieron 404) y una sola muestra por ruta. Con tres repeticiones se separa cold start de la lentitud real.
- **Un único mapa de navegación por rubro** (M). Unifica Jarvis, Bandeja, Biblioteca y Comparar en el perfil, y elimina las copias globales. Resuelve de una vez los pedidos 9 y 10 del dueño.

## Preguntas para el dueño

- ¿Archivamos landing, diseno-muestra y recuperar, o alguna la querés mantener? (Se archiva, no se borra.)
- ¿Los chats quedan solo por rubro (/panel/<rubro>/chats) y se retiran /inbox y /conversaciones, o querés una vista global de conversaciones?
- ¿La Bandeja para Claude queda solo dentro de cada perfil, o también la querés en Oficina y Cerebro?
- ¿Jarvis es el orbe flotante (marco-perfil.tsx) o la pantalla /asistente? Hoy hay ambos.

## Herramientas usadas

- Bash (find sobre src/app, grep de enlaces por ruta, grep de API requireSession, grep de placeholders, lectura de _rutas.json y _errores.txt con python3)
- Glob y Grep no usados por separado; todo con Bash
- Graphify no ejecutado (no se corrió graphify explain ni se leyó cerebro/mapa-codigo): queda pendiente
- Skills (kocos-crm-contexto y otras) no invocadas: queda pendiente
- ToolSearch, SearchSkills y subagentes no usados
- Ningún conector ni MCP de Supabase: no hizo falta
- Archivo de salida: /tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/analisis2711/api_auth.txt
