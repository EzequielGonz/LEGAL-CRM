export const meta = {
  name: 'pruebas-con-acciones-panel-2711',
  description: 'Prueba de punta a punta del panel en producción haciendo clic de verdad, sin campañas ni mensajes a personas',
  phases: [{ title: 'Prueba', detail: 'un agente por recorrido, con acciones reales acotadas' }],
}
const D = '/tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/aud-web'
const COMUN = `
Sos parte de la auditoría exhaustiva del panel CRM multirubro (producción: https://legal-crm-nine.vercel.app). Otro grupo ya recorre todo en solo lectura; a vos te toca PROBAR DE VERDAD, haciendo clic. El dueño lo autorizó hoy con estas palabras: «toca todo lo que quieras, solo no lances campañas. proba todo.»
Antes de empezar leé /home/user/crm-main/cerebro/00-arranque-para-agentes.md y /home/user/crm-main/cerebro/02-ordenes-vigentes.md. El código está en /home/user/crm-main (solo para leer y entender qué hace cada botón ANTES de tocarlo). Usá las skills que sumen (kocos-crm-contexto, kocos-crm-pruebas-de-aceptacion, kocos-crm-reglas-de-captacion, kocos-agentes-entrenamiento-y-evaluacion).

CÓMO NAVEGAR (obligatorio):
- Scripts de Playwright en ${D}/ZONA/ y se corren con: cd ${D} && node ZONA/tu-script.js
- SIEMPRE con el ayudante: const {abrir} = require('${D}/nav.js'); const a = await abrir({escribir:true});
  Devuelve {page, ctx, reg, ir(ruta), texto(), foto(nombre), perfil(slug), browser}. a.reg.escritos lista cada acción que salió al servidor, a.reg.cortados lo que el ayudante frenó, más errores de JS, consola y respuestas 4xx/5xx. Cerrá con a.browser.close().
- a.perfil('juridico'|'coberturas_medicas'|'agencia_0km'|'marketing') cambia el rubro activo.
- Capturas con a.foto('ZONA-nombre') (quedan en ${D}/shots/); miralas con Read.
- No leas ni copies ${D}/sesion.json. No modifiques nav.js. Un navegador por vez: la máquina tiene 4 núcleos y hay otros agentes.

LÍMITES (el ayudante frena varios, pero la responsabilidad es tuya):
1. CAMPAÑAS: no lanzar, pausar, reanudar, crear, editar ni archivar. Hay campañas reales.
2. NINGÚN MENSAJE A UNA PERSONA REAL: no enviar por chat, plantilla, recontacto, seguimiento, cita ni presupuesto. A Jarvis o a cualquier asistente solo se le PREGUNTA; nunca se le pide que mande, agende o cambie algo de un contacto.
3. No cambiar cómo responde el bot real: no guardar reparto de versiones, no aplicar versión o rol al bot en vivo, no desactivar ni editar conocimiento, no publicar agentes, no cambiar la ficha del negocio ni instrucciones del bot, no tocar líneas ni plantillas. Probar simuladores, comparadores y evaluaciones SÍ.
4. Datos de prospectos reales: no cambiar estado, etapa ni datos de un prospecto. Si la zona lo pide, solo cosas internas y reversibles (una nota o recordatorio que diga «PRUEBA AUDITORÍA»), y dejalo como estaba.
5. Nada se borra. Lo que crees se llama «PRUEBA AUDITORÍA 27/11» y al final lo dejás archivado o descartado con ese motivo. Listá en tu informe cada cosa creada y cómo quedó.
6. Gemini tiene tope de gasto: como máximo 15 acciones que llamen a la IA en toda tu corrida.
7. No pegarle a mano a rutas /api: todo por la interfaz. No pagar nada. No importar archivos reales.
8. DATOS PERSONALES: ni nombres, teléfonos ni mensajes de personas en tu informe ni en lo que devolvés. Sin códigos ni claves.
9. No edites el repo ni la base. Solo escribís en ${D}/ZONA/.
10. Si dudás de si un botón manda algo a una persona o cambia el bot real, leé su código primero; si sigue la duda, no lo toques y anotalo como «sin probar: riesgo».

QUÉ ENTREGAR: por cada acción probada, qué hiciste, qué esperabas, qué pasó (mensaje que vio el usuario, pedido que salió, respuesta, si la pantalla se actualizó sola, si quedó guardado al recargar). Buscá: botones que no hacen nada, acciones sin aviso de éxito o error, errores crudos, doble envío al hacer doble clic, estados que no se actualizan, validaciones que faltan (vacío, texto larguísimo, caracteres raros), cosas que dicen hacer algo y hacen otra, mezcla de rubros, tiempos de más de 10 s sin indicador. Escribí ${D}/ZONA/informe.md y devolvé el resultado en el formato pedido. Gravedad: critico, alto, medio, bajo.`

const ZONAS = [
  { z: 'acc-oficina', tipo: 'agent-protocols:test-engineer', que: 'Oficina de punta a punta (/oficina): crear una tarea de prueba de texto para un rubro (por ejemplo «PRUEBA AUDITORÍA 27/11: tres ideas de saludo para Coberturas»), elegir alcance (un rubro, varios, todo el panel), cantidad de respuestas en competencia, tocar «Arrancar ahora» y seguir el recorrido por los escritorios hasta que queda lista; probar pedir cambios, ver las respuestas que compitieron y el juez, y al final descartarla con motivo. Probar también: tarea vacía, tarea con datos personales (debe frenarla), doble clic en Arrancar, qué se ve mientras trabaja (¿los agentes se mueven?, ¿se actualiza sola?), y qué dice cuando la tarea es de código y Claude no está conectado. NO aprobar tareas que no sean las tuyas.' },
  { z: 'acc-laboratorio', tipo: 'agentic-council:Skeptic', que: 'Laboratorio y Bot IA: en /laboratorio y en Bot IA de cada rubro (/agentes, /panel/*/agentes), correr cada simulador y comparador con mensajes de prueba, «Probar en un toque», «Calidad del rol», crear un rol «PRUEBA AUDITORÍA 27/11» y archivarlo, «Pedir mejora» (y seguir a dónde va a parar), «Probar el bot real» (es simulación: verificá en el código que no manda nada a nadie), «Probar conversación» y «Correr evaluación», el informe de mejoras, /biblioteca-agentes y /comparacion-agentes. Una auditoría de código dice que la prueba y la evaluación de Bot IA contestan siempre la misma frase fija y que publicar no cambia el bot: confirmalo o desmentilo en vivo. Decí, por cada control, si es real, decoración o peligroso. Respetá el límite 3 al pie de la letra.' },
  { z: 'acc-jarvis-cerebro', tipo: 'agentic-council:Oracle', que: 'Jarvis y Cerebro: en /asistente y donde aparezca Jarvis, hacerle en cada rubro preguntas de análisis («¿cuántos captados hubo esta semana?», «¿qué campaña rinde mejor?», «¿qué dice el cerebro sobre horarios?») y comparar cada respuesta con lo que muestra el panel: ¿inventa?, ¿mezcla rubros?, ¿cita de dónde saca el dato?, ¿cuánto tarda? En /cerebro: el buscador, cada vista y el mapa, crear un pedido a Claude «PRUEBA AUDITORÍA 27/11» y descartarlo, pendientes, y si el Cerebro realmente aprende algo o solo muestra documentos. Recordá: a Jarvis solo se le pregunta.' },
  { z: 'acc-formularios', tipo: 'agent-protocols:test-engineer', que: 'Formularios y controles del día a día en los 4 rubros, sin guardar nada que afecte a personas: buscador global y Ctrl+K si existe, filtros y orden de cada lista, paginado, exportar o descargar si hay, cambio de modo claro/oscuro (¿se recuerda al recargar?), cambio de perfil desde la interfaz, /configuracion de cada rubro (abrir cada sección; guardar solo con los mismos valores que ya tiene), el importador de bases hasta la vista previa SIN confirmar, el formulario de nueva campaña y el de nueva cita completados y CANCELADOS, avisos push de prueba si existe el botón, /limpieza y /revision solo hasta el paso previo a confirmar. Buscá validaciones que falten y botones que no avisan.' },
  { z: 'acc-chats', tipo: 'agentic-council:Advocate', que: 'Chats y ficha con acciones internas, en los 4 rubros: abrir conversaciones y fichas, escribir en el compositor SIN enviar (¿guarda borrador?, ¿avisa la ventana de 24 h?), abrir «reabrir con plantilla» y cancelar, agregar una nota o un recordatorio «PRUEBA AUDITORÍA 27/11» en UN solo contacto por rubro y después quitarlo o cerrarlo, probar adjuntos y audios en modo lectura (reproducir, transcripción), copiar teléfono, abrir en WhatsApp (solo ver el enlace), pestañas de la ficha, columnas del Excel, etiquetas. Fijate si la lista se actualiza sola, si los contadores de no leídos bajan y si algo de un rubro aparece en otro.' },
]
const SALIDA = {
  type: 'object',
  properties: {
    zona: { type: 'string' },
    probado: { type: 'string', description: 'lista de acciones realmente ejecutadas' },
    creado: { type: 'string', description: 'cada cosa creada en producción y cómo quedó al final' },
    sin_probar: { type: 'string', description: 'lo que no se probó y por qué' },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          gravedad: { type: 'string', enum: ['critico', 'alto', 'medio', 'bajo'] },
          ruta: { type: 'string' },
          rubro: { type: 'string' },
          que_pasa: { type: 'string' },
          archivo: { type: 'string' },
          arreglo: { type: 'string' },
        },
        required: ['titulo', 'gravedad', 'ruta', 'que_pasa'],
      },
    },
  },
  required: ['zona', 'probado', 'creado', 'hallazgos'],
}
const res = await parallel(ZONAS.map((zo) => () =>
  agent(`${COMUN}\n\nTU RECORRIDO (carpeta ${D}/${zo.z}/): ${zo.que}`, { label: `prueba:${zo.z}`, phase: 'Prueba', schema: SALIDA, agentType: zo.tipo })))
return res.filter(Boolean)
