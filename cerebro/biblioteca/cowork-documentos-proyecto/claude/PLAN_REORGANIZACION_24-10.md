# Plan de reorganización · versión final para aprobar (24/10/2026)

Junta lo acordado con el dueño más el tercer chequeo del panel en Chrome. Detalle: DIAGNOSTICO_PANEL_24-10.md y CAPTACION_ANALISIS_24-10.md.

## 1. Captación (aprobado)
- Plantillas nuevas, sin decir «consultaste» (las bases se compran; Marketing no se toca):
  - Jurídico: «Hola {{1}}, soy {{2}}, del Estudio Jurídico VITA. Nos dedicamos a revisar accidentes laborales con ART: muchas personas cobran menos de lo que les corresponde o reciben el alta con secuelas. ¿Tuviste algún accidente de trabajo en los últimos años?»
  - Coberturas, sin botones: «Hola {{1}}, soy {{2}}, de Compara tu Obra Social. Ayudamos a encontrar una prepaga u obra social que te cubra mejor o te cueste menos. ¿Hoy tenés cobertura o estás sin?». Cierre: llamada agendada o un asesor que le escribe.
  - 0 km: «Hola {{1}}, soy {{2}}, de Automotores Kocos. Ayudamos a conseguir 0 km con financiación y entrega rápida. ¿Estás pensando en cambiar el auto este año?»
  - Van a revisión de Meta (de minutos a 24 h). Las viejas quedan, sin asignar.
- El bot insiste una sola vez con algo útil:
  - «ya tengo abogado» → segunda opinión gratis.
  - «ahora no» → otro momento.
  - «¿de dónde salió mi número?» → respuesta aprobada: «Soy asesor del estudio; las bases las maneja el equipo de marketing. Tu contacto nos figura como una consulta que llegó por redes o internet (Facebook, Instagram o alguna página web de consultas), a veces de hace tiempo. Si preferís, te damos de baja ahora mismo. Si no, ¿te cuento en un minuto qué revisamos?»
  - Si vuelve a decir que no: se disculpa y no escribe más.

## 2. Estadísticas separadas, contando personas (no mensajes)
- Por cerrar: interés + duda que el bot no sabe. Única tarea manual destacada; el bot queda en pausa en ese chat y se puede «enseñarle la respuesta».
- Pidió una persona (solo interesados) · Bot trabado · Se enfrió (interesado sin respuesta en +48 h) · No interesados, bajas y quejas (solo cifra).
- Se reemplazan los cuatro números distintos de «atención humana» y los «84 mensajes» por personas.

## 3. Diseño premium en todo el panel (aprobado)
- Boceto v3: oscuro con dorado de la marca y títulos con tipografía serif. Más un modo claro con selector (se recuerda por dispositivo).
- Se aplica a todas las pantallas: selector de perfiles (tarjetas rediseñadas), Hoy, Chats, Ficha, Contactos, Campañas, Bot IA, Línea y plantillas, Redes, Ajustes, Salud y el asistente.
- Tarjetas del selector de perfiles: personas (no mensajes), «Por cerrar», estado de campaña con motivo, calidad de línea y puntaje del bot.

## 4. Orden y funcionamiento
- Mismo menú y mismas rutas en los 4 perfiles: Trabajo (Hoy · Chats · Contactos · Campañas) / Configurar (Bot IA · Línea y plantillas · Redes · Ajustes). Lo propio de cada perfil va en pestañas (Presupuestos, Extraer negocios, Consultas directas).
- Un solo chat: hoy hay tres pantallas distintas (/inbox, /panel/…/chats y /conversacion).
- Se elimina la vista de Teléfono; el panel se adapta al celular.
- Bot IA:
  - Base general única (el texto que responde hoy) + rol por base que se suma («la base sigue vigente; el rol agrega o ajusta»).
  - Asignable a cada base.
  - La prueba usa lo mismo que responde de verdad.
  - Se retira la doble configuración (biblioteca sin asignar, «Asignar versión» por área bloqueada, enlace de probar que no hace nada).
- Campañas: motivo real de pausa arriba, «por qué fallaron» visible, conteos coherentes («Finalizada» con envíos pendientes, 542 contra 564), hora de Buenos Aires.
- Asistente «Pedile algo», con permisos nuevos:
  - Leer y responder chats.
  - Marcar captado o derivado.
  - Tomar o detener contactos.
  - Cargar bases y presupuestos.
  - Reanudar campañas.
  - Editar la base y los roles del bot.
  - Siempre con confirmación antes de enviar o cambiar.
- Redes: mostrar el perfil público de Instagram por enlace, sin Metricool; calendario propio del panel.
- Limpieza: archivar con motivo (sin borrar) las bases duplicadas «ART GRAVES» y las incidencias viejas del 9/10. Avisos solo del perfil. Lo técnico pasa a Avanzado. Quitar «asignar» de las líneas de otros perfiles. «PENAL · Civil» corregido. Bloques vacíos de disponibilidad. Páginas rotas y 404.

## 5. Tercer chequeo en Chrome (24/10)
- Selector de perfiles: sigue contando mensajes; otro diseño (azul).
- 0 km: 133 envíos, 2 respuestas, 0 captados; el bot sin puntaje (4 charlas).
- Marketing: en un chat con presupuesto enviado, el «siguiente paso» todavía dice «pidió hablar con una persona» (estado que no avanza).
- La vista para celular no se pudo probar desde la extensión (la ventana no cambia de tamaño); se prueba con el navegador del entorno antes de publicar.

## Fuera de alcance (sin cambios)
- Fase 3 pausada. No se lanzan campañas ni se paga nada. Marketing mantiene su circuito y su plantilla.
