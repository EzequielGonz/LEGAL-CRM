# Diagnóstico del panel · 24/10/2026 (recorrido completo)

Recorrido en vivo por Chrome con la sesión de la responsable. Pasé por los 4 perfiles, sus pestañas, grupos desplegables, «Más opciones», la ficha, el chat, campañas, bases, redes, configuración, agentes, la bandeja, el teléfono y el asistente. Solo se abrieron formularios, sin guardar ni enviar. Rutas revisadas: ~45 de las 80 del código; el resto son variantes por perfil o detalles con id.

## A. Lo vital que está escondido
1. Atención humana:
   - En Inicio de Jurídico, «piden una persona» (20) y «atención humana» (32) solo aparecen en «Más opciones».
   - En Contactos › Citas figura «Atención humana (52)».
   - En Conversaciones, «Quieren hablar con alguien» da 0.
   - Son cuatro números distintos para lo mismo.
2. Calidad de la línea:
   - «Meta: Conectada · calidad alta» existe, pero solo en Configuración › Perfil y marca › Líneas de WhatsApp, abriendo un grupo.
   - No hay límite diario visible ni estado del pago.
3. Bot:
   - El puntaje (Jurídico 20/100, Coberturas 30, Marketing 51) está en Configuración › pestaña Agentes IA.
   - No hay acceso desde el menú ni desde Inicio.
   - La «Sugerencia» es la misma frase en los tres perfiles.
4. Campaña pausada:
   - Inicio dice «Campañas activas 0».
   - El detalle muestra «Motivo: Pausada desde el panel» y no el error 131042.
   - El bloque «Por qué fallaron» queda abajo, debajo del formulario para cargar otra base.
5. Presupuestos (Marketing): están escondidos como pestaña de Contactos («Piden presupuesto»).

## B. Entrenamiento: base + rol (el punto que planteaste)
- Hay tres sistemas superpuestos:
  - (1) «Configuración que responde hoy»: Agente Civil, con un texto de 5.037 caracteres («Sos Leonardo…»), y Agente Penal.
  - (2) Biblioteca: «Agente principal · base común v1» (APAGADO) y «Agente Jurídico v1 · Preparado · sin asignación: no responde».
  - (3) Roles por base.
- Hoy responde solo (1). La «base común» no se aplica a nadie.
- El rol se suma al prompt, pero con la orden «seguilo por encima del guion general».
- El formulario «Nuevo rol» no muestra la base sobre la que se apoya.
- /biblioteca-agentes abre sin menú ni diseño (página rota). /comparacion-agentes redirige a Agentes IA.

## C. Desorden e inconsistencias entre perfiles
- Los menús llevan a rutas distintas: Jurídico usa /campanas, /configuracion y /estadisticas; los otros /panel/<perfil>/…
- Configuración de Jurídico tiene 8 grupos; la de Coberturas y Autos tiene otros grupos y manda «los ajustes generales» a la de Jurídico.
- El chat de Jurídico es lista + conversación al lado (/inbox). En Coberturas es una lista a pantalla completa (/panel/…/chats), tarda en cargar y muestra «0 conversaciones» mientras carga.
- Las pestañas cambian según el perfil: Jurídico tiene «Incidencias» y «Casos»; Coberturas «Clientes cerrados» y no tiene Incidencias; Marketing «Prioritarios», «Piden presupuesto» y «Consultas directas».
- Los nombres no coinciden: la pestaña «Revisión» abre /recuperar («lo que se cayó») y la pestaña «Incidencias» abre una página titulada «Revisión».
- El aviso de salud de Jurídico aparece en todos los perfiles.
- En Coberturas los textos dicen «pasarlos al profesional» (es lenguaje jurídico).
- En la ficha y en Oportunidades, el botón «← Volver al inicio» no vuelve a donde estabas.
- /telefono es una segunda app con su propio diseño. En «Campaña» abre directo el formulario para cargar una base. No muestra los 20 que piden persona en Jurídico, pero sí en Marketing.
- Las rutas /redes/perfiles, /plantillas y /publicidad dan 404 sin ?perfil.
- Las plantillas están repetidas completas en Configuración › Canales y en Redes › Plantillas.
- El perfil de WhatsApp del negocio se edita en «Redes y contenido».

## D. Datos y textos que confunden
- Bases duplicadas: «ART GRAVES» aparece tres veces (dos con 0 contactos nuevos). En el selector de campaña figuran las tres con 320.
- Los conteos no coinciden: GRAVES tiene 542 contactos en un lado y 564 en otro; LEVES 441 y 450. «Enviados 197» contra «100 con envío».
- Campañas «Finalizada · no quedan mensajes por enviar» con 228 de 356 o 203 de 320 enviados.
- Hora: «Última actividad 23/10 03:30:21» en la campaña (fue 15:30). Los «Últimos accesos» de Configuración salen desordenados y con hora corrida.
- La línea PENAL figura como «PENAL · Civil».
- En cada perfil se ofrece «asignar» las líneas de los otros perfiles, como si estuvieran libres (riesgo de mezclar líneas).
- La disponibilidad de citas muestra 10 bloques vacíos por área.
- Tareas: Salud dice que el latido corre, pero Configuración dice «la tarea externa… hoy está inactiva por decisión».
- Revisión › Incidencias: 55 abiertas, todas del 9/10 (importación vieja), y 141 detenciones mezcladas con lo urgente.
- «Hablando ahora» incluye chats con 3 días sin actividad.
- Marketing: 3 «captados para derivar» que ya tienen el presupuesto enviado (el estado no avanzó). Hay dos herramientas de extracción que se superponen: Google Maps API y Outscraper.
- Configuración muestra nombres técnicos (WHATSAPP_PENAL_WABA_ID, VAPID, GCP, Vercel).

## E. Propuesta (para aprobar)
1. Inicio = tablero de mando, igual en los 4 perfiles. Arriba, cuatro tarjetas:
   - Atender ya: un solo número de «piden persona / atención humana».
   - Campaña: estado y motivo real.
   - Línea: calidad, límite, pago.
   - Bot: puntaje, rol, «Pedir cambio».
   - Debajo, los captados y las cifras.
2. Un solo menú y las mismas rutas para todos: Inicio · Chats · Contactos · Campañas · Bot IA · Línea y plantillas · Redes · Ajustes. Lo propio de cada perfil (Presupuestos, Extraer) va como pestaña dentro de la sección que corresponda.
3. Bot IA como sección propia:
   - Base general única (la que responde hoy pasa a ser la base) + rol por base que se suma («la base sigue vigente; el rol agrega o ajusta»).
   - Vista previa combinada, probar conversación y evaluación.
   - Se elimina la doble configuración.
4. Datos coherentes: un solo cálculo por indicador, la hora en Buenos Aires en todo el panel, y la etiqueta de «Finalizada» y los conteos corregidos.
5. Limpieza:
   - Archivar con motivo las bases vacías o duplicadas y las incidencias viejas (sin borrar).
   - Avisos solo del perfil.
   - Lo técnico pasa a «Avanzado».
   - Quitar «asignar» de las líneas de otros perfiles.
   - Arreglar las páginas rotas y los 404.
