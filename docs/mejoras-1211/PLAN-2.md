# Plan 2 · pedido de la responsable del 12/11 a la tarde

## Pedido textual
> En la sección HOY hay que corregir y separar los captados y la atención humana y reconocer los descartados, porque se muestran algunos que tienen abogado por ejemplo y esos hay que descartarlos, insistir una vez como ya está programado el bot, pero una vez que se pierde ya se elimina y ni se muestra si no está cerrado. En esta sección «hoy» armar una especie de powerpoint con las estadísticas de la última semana y del mes. Las estadísticas principales que se muestren sean las de la semana actual. El resto que se vea desde esas estadísticas y desde un historial.
>
> En sección chats también hay que emprolijar todo y reordenar. Que sea claro y fácil. Que no se mezcle el prospecto que no sirve del que sí sirve. Además la sección chats y contactos, me parece que habría que unificar o buscarle el sentido, porque son muy iguales.
>
> Aplicar el bot v2 a todo el panel, ya dejarlo predefinido. Vos también armá una mejora sobre las estadísticas que se obtuvieron de la versión 2 y mejoralo, pero nunca eliminando lo actual.
>
> Línea y plantillas hay que actualizarlo y agregarle funciones reales de Wasender, ya que está para Meta.
>
> Redes, también buscarlo hacerlo funcional desde una url o algo que podamos tener acceso a los perfiles, contenido, etc., como si tuviéramos Instagram, Facebook y WhatsApp abiertos dentro del mismo panel, como en url por ejemplo.
>
> Propone, ejecuta los cambios y subí a producción todo.
>
> Antes de estos cambios, volvé a revisar el panel completo, como usuario (…) revisalo exhaustivamente, función por función, vas a ver que hay cosas incoherentes, que no funcionan, que no se usan y que confunden, ayudanos a simplificar y organizar.
>
> Terminá con lo anterior e implementá esto. Generá un punto de guardado en 20 minutos y programá una tarea para las 21 h para retomar con lo que faltó.

## Reglas que siguen valiendo
- Producción autorizada para estos cambios. No se activan envíos, campañas ni seguimiento.
- Nada se borra: se archiva con motivo. «Eliminar» un perdido = dejar de mostrarlo, no borrarlo de la base.
- El camino de Meta no se toca. El bot v1 no se elimina.
- El código de acceso no se escribe en archivos.

## Estado (12/11, 21:30)
- [x] Lo anterior (puntos 1 a 6): migración 0605 aplicada; rama pasada a `main`.
- [x] 0. Revisión como usuaria, función por función (29 pantallas). Hallazgos principales abajo.
- [x] 1. Hoy: «Atención humana» y «Captados para derivar» separados; descartes reconocidos por su último mensaje, fuera de la vista y con un botón para cerrarlos como perdidos.
- [x] 2. Hoy: estadísticas como presentación (esta semana, semana pasada, este mes, mes pasado), cada una comparada con el período anterior; historial a un clic.
- [x] 3. Chats: «Activos», «Todos los chats», «Para recuperar», «Descartados» (perdidos y pedidos de no contacto) e Incidencias. Los perdidos ya no se mezclan con lo recuperable.
- [x] 4. Contactos: «Etapas», con el recorrido completo (sin contactar → sin respuesta → respondieron → en conversación → captados → derivados). Chats = conversar; Contactos = ver a todas las personas por etapa.
- [x] 5a. Bot v2 predefinido: los cuatro perfiles al 100 % en la base (registrado en el historial de cambios) y valor por defecto en el código. La v1 no se elimina.
- [ ] 5b. Mejora sobre las estadísticas de la v2 (versión 3, sin tocar v1 ni v2). Datos del 25/10 al 12/11: Autos v1 1 captado de 12 conversaciones, v2 2 de 16; Marketing v1 1 de 103, v2 3 de 51; **Jurídico v1 5 de 16, v2 4 de 17, con el doble de turnos (69 contra 35) y el doble de detenidos (8 contra 4)**; Coberturas sin muestra (v2 3 conversaciones). Las fichas de objeciones casi no se usan (la más usada, 6 veces): lo que pesa es la base general y la del rubro. Hipótesis para la v3: en Jurídico la v2 conversa de más antes de proponer el paso siguiente; acortar y proponer antes. Hay que leer las conversaciones de Jurídico con v2 que terminaron detenidas antes de escribir la v3. El código hoy solo admite versiones 1 y 2 (`cambiarAsignacion`, ruta de conocimiento, panel): hay que ampliarlo.
- [x] 6. «Líneas y plantillas» ya no es solo de Meta: primero líneas y plantillas de Wasender, después las de Meta. La sección «Wasender» del menú de trabajo se unió ahí. Cada plantilla de campaña dice si está lista o cuántos textos le faltan.
- [ ] 6b. Más funciones de Wasender en esa sección: probar una plantilla con un nombre de ejemplo, enviar una prueba al teléfono del equipo, ver los últimos envíos y fallos de la línea.
- [x] 7. Redes → «Accesos»: Instagram, Facebook, WhatsApp Web, bandeja de Meta, Metricool y la web de cada perfil, cada uno en su ventana al lado del panel. Las direcciones del perfil de Instagram, de la página de Facebook y de la web las carga la responsable (no estaban guardadas en ningún lado).
- [ ] 8. Pendiente de la revisión (ver abajo).

## Hallazgos de la revisión (lo que sigue incoherente o sin uso)
- «Captados sin derivar» aparece en seis pantallas (Hoy, Activos, Citas, Captados y casos, Buscar en la base, Historial). Falta dejarlo en dos: Hoy y Captados y casos.
- «Atención humana» da cuatro números distintos: 0 (Pidieron una persona), 12 (esperan respuesta), 30 (Historial) y 62 (Citas). Hay que unificar la definición: «el último mensaje es de la persona y el bot no le va a contestar».
- Incidencias (Jurídico): 270 cosas «esperan una decisión», de las cuales 215 son detenciones vigentes que no son trabajo. Separar o quitar las detenciones de esa cuenta.
- Hay dos pantallas «Prospectos» (por base y buscador) con el mismo título.
- Seguimiento: toda la pantalla en cero porque la función está apagada; conviene una sola frase y el botón para prenderla.
- Contenido, Publicaciones y Publicidad: todo en cero o apagado; hoy las publicaciones se programan por fuera (Metricool).
- Ajustes: una sola pantalla con 108 campos y 22 botones «Quitar». Conviene partirla en pestañas.
- Bases: nombres repetidos («ART GRAVES» tres veces) y una base llamada «4».
- Marketing → Prioritarios: 300 fichas en una sola página.
- Aviso de captación: no hay pantalla para cargar destinatarios ni código que lo envíe.
- Todos los chats: la lista arranca pegada a las pestañas, sin encabezado.
