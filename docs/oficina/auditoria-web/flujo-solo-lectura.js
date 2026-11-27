export const meta = {
  name: 'auditoria-web-panel-2711',
  description: 'Auditoría exhaustiva del panel en navegador real, solo lectura, por zonas, con verificación contra el código',
  phases: [
    { title: 'Audita', detail: 'un agente por zona, navegando producción en solo lectura' },
    { title: 'Verifica', detail: 'un escéptico por zona contrasta cada hallazgo con el código' },
  ],
}

const D = '/tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/aud-web'

const COMUN = `
Sos parte de una auditoría EXHAUSTIVA del panel CRM multirubro (producción: https://legal-crm-nine.vercel.app), hecha en un navegador real. El dueño dijo que la auditoría anterior (leyendo código) no alcanzó.
Antes de empezar leé /home/user/crm-main/cerebro/00-arranque-para-agentes.md y /home/user/crm-main/cerebro/02-ordenes-vigentes.md. El código está en /home/user/crm-main (solo para leer). Usá las skills que sumen (por ejemplo kocos-crm-contexto, kocos-crm-diseno-y-accesibilidad, kocos-crm-reglas-de-captacion, web-design-guidelines).

CÓMO NAVEGAR (obligatorio):
- Escribí tus scripts de Playwright en ${D}/ZONA/ (creá la carpeta con tu zona) y corrélos con: cd ${D} && node ZONA/tu-script.js
- SIEMPRE abrí el navegador con el ayudante: const {abrir} = require('${D}/nav.js'); const a = await abrir({telefono?:true, claro?:true, sinSesion?:true, ancho?, alto?});
  Devuelve {page, ctx, reg, ir(ruta), texto(), foto(nombre), perfil(slug), browser}. a.reg junta errores de JS, de consola, pedidos fallidos, respuestas 4xx/5xx, pedidos cortados y páginas lentas. Cerrá con a.browser.close().
- a.perfil('juridico'|'coberturas_medicas'|'agencia_0km'|'marketing') cambia el rubro activo. Probá tu zona en los rubros que correspondan.
- Capturas: a.foto('ZONA-nombre') las guarda en ${D}/shots/. Miralas con la herramienta Read para juzgar lo visual. Usá deviceScaleFactor por defecto.
- No leas, imprimas ni copies ${D}/sesion.json (es la sesión). No modifiques nav.js.
- La máquina tiene 4 núcleos y hay otros agentes: un navegador por vez, sin paralelizar scripts.

REGLAS QUE NO SE ROMPEN:
1. SOLO LECTURA. El ayudante corta todo lo que no sea GET; igual, NO hagas clic en botones que envían, lanzan, pausan, reanudan, archivan, guardan, borran, aprueban, arrancan o importan. Sí podés: navegar, abrir pestañas, filtros, buscadores, menús, desplegables y diálogos (y cerrarlos con Cancelar/Escape). Si algo solo se puede comprobar escribiendo, anotalo como «sin comprobar: requiere acción».
2. HAY CAMPAÑAS REALES: no tocar nada de campañas, líneas ni plantillas más que mirarlas.
3. No le pegues a mano a ninguna ruta /api (ni con fetch ni con goto). Solo cuentan los pedidos que hace la propia página.
4. DATOS PERSONALES: el panel muestra prospectos reales. En tus informes y en lo que devolvés NO va ningún nombre, teléfono, mensaje ni dato de una persona. Describí el registro por tipo («un prospecto de Coberturas con cita»). Las capturas quedan solo en el scratchpad.
5. Nada de código de ingreso ni claves en archivos ni en la respuesta.
6. No edites el repo, no hagas commits, no toques la base. Solo escribís en ${D}/ZONA/.
7. No inventes: cada hallazgo lleva la ruta, el rubro, qué hiciste, qué esperabas y qué pasó, y si podés el archivo del código donde nace (file:line). Si no lo pudiste reproducir dos veces, marcálo «visto una vez».

QUÉ BUSCAR EN CADA PANTALLA de tu zona (todas las que alcances, cada pestaña, cada filtro, cada menú, cada estado vacío):
- Roto: errores de JS o consola, 4xx/5xx, pantalla en blanco, botones o enlaces que no hacen nada o llevan a 404, pestañas vacías, datos que no cargan, contadores que no coinciden con la lista.
- Mentiroso: decoración que parece función, números o textos fijos en el código, «próximamente», cosas que dicen estar encendidas y no lo están.
- Mezcla de rubros: algo de un perfil que se ve o se abre desde otro (regla dura: cada rubro separado).
- Confuso: textos encimados o cortados, cosas duplicadas, jerga técnica, inglés, pasos de más, botones sin nombre claro, falta de aviso al terminar una acción.
- Diseño: desalineado, contraste bajo, desbordes, saltos de diseño, cosas que se pisan a 1440 y a 1024 de ancho.
- Lento: páginas de más de 4 s (ojo: la máquina está cargada, mirá el tiempo de respuesta del servidor antes de culpar a la página).
Al terminar escribí ${D}/ZONA/informe.md (español rioplatense, sin datos personales) y devolvé los hallazgos en el formato pedido. Gravedad: critico (rompe el trabajo o arriesga datos o plata), alto (función que no anda o engaña), medio (confunde o molesta), bajo (pulido). En «cobertura» listá cada ruta y rubro que realmente abriste y lo que NO pudiste cubrir y por qué.`

const ZONAS = [
  { z: 'entrada-hoy', tipo: 'agent-protocols:test-engineer', que: 'Entrada y día a día: /login (sin sesión, con sinSesion:true, sin intentar códigos), /perfiles, /inicio, /hoy en los 4 rubros (cada bloque, cada contador contra su lista, cada enlace), /resumen, /resultados, el menú superior y «Más» de cada rubro (cada entrada lleva a algo que existe y es del rubro), cambio de modo claro/oscuro, cerrar sesión (solo ver que existe).' },
  { z: 'juridico', tipo: 'agentic-council:Advocate', que: 'Perfil Jurídico (perfil juridico, con Civil y Penal): /agenda, /agentes, /bases y una base, /campanas y una campaña (solo mirar), /casos-cerrados, /configuracion, /estadisticas, /inbox y una conversación, /prospectos y un prospecto, /seguimiento. Mirá especialmente que Civil y Penal se distingan y no se mezclen, y que la línea única de Jurídico sea coherente.' },
  { z: 'coberturas-autos', tipo: 'agent-protocols:test-engineer', que: 'Perfiles Coberturas médicas y Autos 0 km: /panel/coberturas_medicas y /panel/agencia_0km con TODAS sus subrutas (agenda, agentes, bases y una base, campanas y una campaña, casos-cerrados, chats y un chat, configuracion, estadisticas, seguimiento). Compará las dos entre sí: lo que una tiene y la otra no, textos de un rubro que aparecen en el otro. En Autos 0 km la regla es no hablar de cuotas, créditos ni permutas: fijate que la interfaz no lo prometa.' },
  { z: 'marketing', tipo: 'agentic-council:Advocate', que: 'Perfil Marketing: /panel/marketing y TODAS sus subrutas (agenda, agentes, bases, campanas, captacion y un detalle, casos-cerrados, chats y un chat, configuracion, consultas-directas, estadisticas, extraer, lead/[id], presupuestos, prospectos, seguimiento). Regla del dueño: presupuesto pedido pasa a «Interesado» y el bot siempre intenta la llamada; fijate si la interfaz lo refleja. En /extraer solo mirar, no lanzar extracciones.' },
  { z: 'chats-ficha', tipo: 'agent-protocols:code-reviewer', que: 'Conversaciones y ficha, en los 4 rubros: /conversaciones, /conversacion/[id], /ficha/[id], /contactos, /bandeja, /derivar, /descartados, /recuperar, /oportunidades, /revision, /limpieza, /prospectos-por-base, /incidencias. En el chat: el compositor (sin enviar), el botón de reabrir con plantilla (abrir y cancelar), adjuntos, audios, la ficha con las columnas del Excel, etiquetas de estado, captado. Encontrá los ids navegando desde las listas.' },
  { z: 'bots-laboratorio', tipo: 'agentic-council:Skeptic', que: 'Bot IA: /laboratorio (el dueño dice que «está re mal hecho»: recorré cada pestaña, selector, botón y resultado; qué es decoración, qué no llega al bot real, dónde se mezclan rubros), /biblioteca-agentes, /comparacion-agentes, la pantalla de agentes de cada rubro (/agentes, /panel/*/agentes), /asistente (Jarvis: solo mirar, no mandar mensajes). Decí cómo debería quedar el Laboratorio para ser útil de verdad.' },
  { z: 'cerebro-oficina-salud', tipo: 'agentic-council:Skeptic', que: 'Cerebro, Oficina y Salud: /cerebro (todas las vistas, el mapa, pendientes, pedidos a Claude, texto encimado, que las animaciones sigan), /oficina (escritorios, mesa de entrada, colas, tareas listas; NO tocar Arrancar ni aprobar), /salud en los 4 rubros (cada indicador: ¿sale de la base o es fijo?, ¿las acciones sugeridas llevan a algún lado?). El dueño pidió un Cerebro que aprende y sirve, no un cartel.' },
  { z: 'bases-campanas-lineas', tipo: 'agent-protocols:test-engineer', que: 'Bases, campañas, líneas y WhatsApp no oficial, SOLO MIRANDO: el importador de bases (abrir el formulario, no subir nada), listas y detalle de bases en los 4 rubros, listas y detalle de campañas (filtros, estados, el cartel «Campaña con fallas», por qué figura pausada), /meta/lineas, /wasender y /wasender/plantillas, y /redes con sus subrutas (solo anotar; esa parte la trabaja otra sesión). Fijate que el motivo de pausa de una campaña se entienda sin jerga.' },
  { z: 'telefono', tipo: 'agentic-council:Pathfinder', que: 'Vista de teléfono: abrí con abrir({telefono:true}) y recorré /telefono y /telefono/[slug]/campana, /clientes y /estadisticas de cada rubro, y además las pantallas principales del panel en ese tamaño (/perfiles, /hoy, /conversaciones, un chat, una ficha, /oficina, /cerebro, /salud, /laboratorio, una lista de campañas). Buscá desbordes horizontales, botones chicos (menos de 44 px), texto ilegible, menús que no cierran, cosas tapadas por barras fijas.' },
  { z: 'accesibilidad-modo-claro', tipo: 'agent-protocols:accessibility-specialist', que: 'Accesibilidad y modo claro en todo el panel: recorré las pantallas principales de los 4 rubros con abrir({claro:true}) y en oscuro. Medí contraste real (color computado de texto y fondo), orden de tabulación con teclado, foco visible, nombres accesibles de botones e íconos, encabezados, roles de pestañas y diálogos, etiquetas de formularios, movimiento reducido. Si existe axe-core en /home/user/crm-main/node_modules usalo inyectándolo con page.addScriptTag({path}); si no, hacé las mediciones a mano. En modo claro buscá texto invisible, fondos que quedaron oscuros y colores pastel «de colegio» (el dueño no los quiere).' },
  { z: 'rendimiento', tipo: 'agent-protocols:performance-engineer', que: 'Rendimiento medido: para CADA ruta del panel (sacá la lista con find /home/user/crm-main/src/app -name page.tsx, resolviendo ids desde las listas) y cada rubro, medí tiempo del documento (TTFB con response.request().timing()), los pedidos a /api más lentos y su peso, cantidad de pedidos, tamaño de JS, y sondeos que se repiten con la pestaña quieta 60 s. Hay una duda abierta: Hoy y Salud tardan unos 12–16 s en total en Autos 0 km y Coberturas; encontrá qué pedido lo causa y dónde está en el código. La máquina está cargada: confiá en tiempos de red del servidor, no en el reloj del render. Entregá una tabla ordenada por lo más lento.' },
  { z: 'seguridad-separacion', tipo: 'agent-protocols:security-auditor', que: 'Seguridad y separación de rubros, sin atacar nada: (a) con abrir({sinSesion:true}) pedí cada ruta de PÁGINA del panel y comprobá que todas mandan a /login y no filtran datos en el HTML; (b) con sesión, estando en un rubro, abrí por dirección directa recursos de otro rubro (una base, campaña, chat o ficha cuyo id sacaste del otro perfil) y fijate si se ven; (c) mirá qué datos viajan en las respuestas que piden las páginas (campos de más, teléfonos de otros rubros, claves, tokens); (d) leyendo el código de /home/user/crm-main/src/app/api, listá las rutas sin requireSession o sin comprobar rubro, y las GET con efectos. Prohibido: probar códigos de ingreso, pegarle a mano a rutas /api, fuerza bruta. El repo es público: fijate también si algo sensible quedó a la vista en archivos actuales (sin reproducir el valor).' },
]

const HALLAZGOS = {
  type: 'object',
  properties: {
    zona: { type: 'string' },
    cobertura: { type: 'string', description: 'rutas y rubros realmente abiertos, y lo que no se pudo cubrir y por qué' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          gravedad: { type: 'string', enum: ['critico', 'alto', 'medio', 'bajo'] },
          ruta: { type: 'string' },
          rubro: { type: 'string' },
          que_pasa: { type: 'string', description: 'qué se hizo, qué se esperaba y qué pasó; sin datos personales' },
          archivo: { type: 'string', description: 'file:line del código si se ubicó, o vacío' },
          arreglo: { type: 'string', description: 'arreglo propuesto, corto' },
          certeza: { type: 'string', enum: ['reproducido', 'visto una vez', 'sin comprobar: requiere acción'] },
        },
        required: ['titulo', 'gravedad', 'ruta', 'que_pasa', 'certeza'],
      },
    },
    propuesta: { type: 'string', description: 'si la zona lo pide, cómo debería quedar; si no, vacío' },
  },
  required: ['zona', 'cobertura', 'hallazgos'],
}

const VEREDICTOS = {
  type: 'object',
  properties: {
    zona: { type: 'string' },
    veredictos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          veredicto: { type: 'string', enum: ['confirmado', 'falso', 'dudoso'] },
          motivo: { type: 'string' },
          archivo: { type: 'string' },
          gravedad_corregida: { type: 'string', enum: ['critico', 'alto', 'medio', 'bajo'] },
        },
        required: ['titulo', 'veredicto', 'motivo'],
      },
    },
    faltantes: { type: 'array', items: { type: 'string' }, description: 'cosas de la zona que el auditor no miró y habría que mirar' },
  },
  required: ['zona', 'veredictos'],
}

const res = await pipeline(
  ZONAS,
  (zo) => agent(`${COMUN}\n\nTU ZONA (carpeta ${D}/${zo.z}/): ${zo.que}`, { label: `web:${zo.z}`, phase: 'Audita', schema: HALLAZGOS, agentType: zo.tipo }),
  (r, zo) => {
    if (!r || !r.hallazgos || !r.hallazgos.length) return { zona: zo.z, auditoria: r, verificacion: null }
    return agent(`Sos el revisor escéptico de una auditoría del panel CRM (código en /home/user/crm-main, solo lectura; producción https://legal-crm-nine.vercel.app). Un auditor recorrió la zona «${zo.z}» en un navegador y dejó su informe en ${D}/${zo.z}/informe.md y capturas en ${D}/shots/ (empiezan con el nombre de la zona; contienen datos personales: no los copies).
Tu trabajo: intentar REFUTAR cada hallazgo leyendo el código (y mirando la captura si existe). Para cada uno decí confirmado, falso o dudoso, con el motivo y el file:line que lo prueba; corregí la gravedad si está inflada o corta. Un hallazgo sin sustento en el código ni en la captura es «dudoso», no confirmado. Ya hubo un falso positivo en la auditoría anterior (foco «invisible» que una regla CSS posterior sí pintaba): mirá las reglas que pisan a otras. No navegues producción, no edites nada, no escribas datos personales. Al final listá lo que el auditor NO miró de su zona y habría que mirar.
Zona: ${zo.que}
Hallazgos a revisar (JSON):\n${JSON.stringify(r.hallazgos)}`, { label: `verifica:${zo.z}`, phase: 'Verifica', schema: VEREDICTOS, agentType: 'agentic-council:Skeptic' })
      .then((v) => ({ zona: zo.z, auditoria: r, verificacion: v }))
  }
)

const ok = res.filter(Boolean)
log(`zonas con resultado: ${ok.length} de ${ZONAS.length}`)
return ok
