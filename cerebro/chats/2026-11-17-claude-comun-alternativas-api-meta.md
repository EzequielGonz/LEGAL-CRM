# Alternativas a la API de Meta para 6 líneas de WhatsApp (emulador, pasarela y Wasender)

## 1. Encabezado

- **Título del chat:** «Alternativas a la API de Meta».
- **Inicio:** 17/11/2026 04:34. **Fin:** 21/11/2026 05:57 (último mensaje: pedido de volcado a la memoria, sin respuesta en la exportación). Horarios en UTC según la exportación (no confirmado).
- **Origen:** Claude común. 47 mensajes.
- **Perfiles o líneas que toca:** las 6 líneas de WhatsApp del CRM. Se nombran explícitamente Jurídico (VITA), 0 km, coberturas y marketing. Las otras dos no se nombran (no confirmado).

## 2. Objetivo

Conectar 6 líneas de WhatsApp al CRM sin Meta y sin 6 celulares físicos, porque la API de Meta cobra cada envío de campaña. La responsable quiere que las líneas queden «como están ahora» en el CRM, con el entrenamiento (20 contactos por día, plantillas distintas, tiempos al azar), los agentes que responden y el panel. Pregunta de fondo: si se puede reemplazar Wasender.

## 3. Órdenes y decisiones de la responsable

- **17/11 04:34:** «no tengo tantos telefonos para gestionar y conectar 6 lineas, la api de meta cobra demasiado el envio de mensajes, que otra forma aparte de la api de meta hay para gestionar y controlar 6 whatsapp, solo conectarlos al crm como estan ahora».
- **17/11 04:49 y 04:51:** pidió evaluar «https://www.duoplus.net» y «bluestacks».
- **17/11 05:46:** «wasender todo el tiempo se desconecta y pide que vuelva a iniciar sesion, lo que estamos usando para el envio de mensaje… por eso necesito un emulador para no tener que estar colocando todo el tiempo los chips fisicos en cada linea».
- **17/11 05:51:** «no, tengo que cambiar de chip en el celular fisico, no en bluestacks». Y: «Necesito tener las 6 lineas en un solo lugar, que queden prendidas ahi, y que ahi, si en algun momento se desconecta alguna, vuelva a conectarse sola al panel».
- **17/11 05:51 (argumento):** «Justamente hay un entrenamiento y un algoritmo que empieza con 20 contactos diarios… Ya deja de ser por bloqueo».
- **17/11 05:53:** «la del telefono fijo no es opcion. necesito un emulador o algo que las mantenga abiertas, si se cierra esta bien, la abro otra vez desde el emulador, pero con el celu fijo/fisico, no es opcion…» («fijo» se refiere al celular físico).
- **17/11 05:55:** «y en el caso que funcionen los emuladores, es necesario wasender?»
- **17/11 05:56:** «esta todo en el crm, los agentes que responden, todo...». Esto responde si el entrenamiento está en el CRM o en Wasender.
- **17/11 05:58:** «entonces, decime como hago en bluestacks».
- **17/11 08:13:** «me exige que lo detecte automatico no me da opcion».
- **17/11 08:20:** «no se comprueba la verificacion».

## 4. Correcciones que hizo la responsable

- **Celular físico.** Claude propuso Android usados y celular con dos chips (05:46 y 05:51). La responsable lo rechazó: «la del telefono fijo no es opcion» (05:53). La opción quedó descartada.
- **Chip.** Claude escribió que el chip solo hace falta para verificar. La responsable aclaró que el cambio de chip lo hace en el celular físico, no en BlueStacks (05:51).
- **Método de instalación.** Claude sugirió instalar WhatsApp como APK. La responsable: «no me anda con el whatsapp apk, se queda conectando» (05:46 y 06:17). Claude le pidió cambiar de versión de BlueStacks, de Desktop 16 (Android 16 Beta) a BlueStacks 5 Pie 64-bit (06:18 a 06:22).
- **WhatsApp Business.** Claude dijo que no hacía falta instalar otro WhatsApp (06:02). La responsable confirmó que ya lo tenía.
- **Entrenamiento y bloqueo.** Claude sostuvo que, si los envíos son a quien no escribió, habrá cortes con cualquier herramienta no oficial (05:55). La responsable afirmó que el algoritmo de 20 contactos evita el bloqueo (05:51). Desacuerdo no resuelto en el chat.
- **Claude afirmó que el CRM envía solo por Meta** (05:56). La responsable dijo que Wasender es lo que usan para enviar (05:46). Ver sección 12.

## 5. Qué se hizo, con estado

1. **Comparación de vías** (API de Meta, pasarela por QR, DuoPlus, BlueStacks, celular físico, Android Studio, celular en la nube). **Especificado** solo en el chat.
2. **Costos citados** (Meta, DuoPlus, pasarelas). **No confirmado:** Claude los cita sin fuente en el chat, o los atribuye a reseñas.
3. **BlueStacks.** Primero se instaló BlueStacks Desktop 16 (Android 16 Beta), que Claude pidió reemplazar. Después, BlueStacks 5 Pie 64-bit con perfil de celular Samsung S21 Ultra, Android 9, sin root, en vertical. **Implementado** en el equipo de la responsable según el chat (07:48). WhatsApp Business instalado; a qué versión y por qué vía (APK o Play) no quedó claro.
4. **Verificación del número en BlueStacks.** **Probado y fallido**. WhatsApp mostró «Esperando para detectar automáticamente el SMS» sin opción de escribir el código a mano. Después, «no se comprueba la verificación» (08:20). Ningún número quedó verificado.
5. **Certificación de Google Play.** Claude dio el identificador GSF del equipo para registrarlo en google.com/android/uncertified (07:57). **No confirmado** si se registró. No consta que Play Protect haya dado «El dispositivo está certificado».
6. **Pasarela.** **Especificada** en el chat: Evolution API o WAHA en un servidor propio, con la línea por Meta o por pasarela, entrada nueva en el CRM y avisos de estado. Claude propuso armar un documento técnico «Líneas por pasarela» y preguntó si lo quería. No hay respuesta registrada ni documento generado.
7. **Wasender.** Sigue en uso para enviar (dicho por la responsable). Nada cambió.
8. **CRM.** **No se cambió nada** («No cambié nada en el CRM», 04:35; «No toco el CRM hasta que lo autorices», 04:51 y 05:58).
9. **Plan propuesto y no ejecutado:** no reintentar el número con error (24 a 48 h); mañana probar DuoPlus o GeeLark con un número; si verifica, sumar las 6 líneas y conectar la pasarela.

## 6. Todo lo concreto

- **Herramientas:** BlueStacks 5 Pie 64-bit; WhatsApp Business; «My Device IDs: GSF GAID viewer» (APSoft Studio), recomendada en lugar de «Device ID» (Evozi); google.com/android/uncertified (registro del identificador GSF).
- **Perfil de BlueStacks:** Samsung Galaxy S21 Ultra (SM-G998B), Android 9, sin root, orientación vertical (no confirmado DPI final).
- **Pasarelas y servicios mencionados:** Evolution API, WAHA, Baileys, whatsapp-web.js, Z-API, Green-API, Whapi.cloud, Wassenger, DuoPlus (duoplus.net), GeeLark, Android Studio (emulador con imagen Google Play), AutoResponder («autoresponderwa»).
- **Precios citados (no confirmados):**
  - Meta, Argentina: marketing USD 0,07107 y utilidad USD 0,02990 por mensaje.
  - Meta: 1.000 mensajes de servicio gratis por mes desde el 01/10/2026; 7 días de envío gratis para conversaciones iniciadas desde anuncios desde el 21/09/2026.
  - Plantillas `estudio_juridico_vita`: 1.610 registradas, unos USD 114 si fueron de marketing.
  - DuoPlus: USD 2 por equipo por mes, más USD 0,15 cada 30 min (tope USD 0,9 por día y equipo), o USD 19,9 por mes por equipo encendido siempre.
  - Pasarela en servidor propio: USD 5 a 10 por mes. Evolution API es gratis.
- **Números de cuenta:** cada app de WhatsApp admite 2 cuentas (WhatsApp y WhatsApp Business). Con 6 líneas, hacen falta 3 instancias o un equipo y uno más.
- **Datos personales:** no se copió ningún número de teléfono. El identificador GSF del equipo tampoco se copia aquí.
- **Ningún cambio en Meta, Wasender, Vercel, Supabase ni Google más allá del registro del identificador de dispositivo.**

## 7. Datos del negocio

- Son 6 líneas de WhatsApp. Hay un solo celular físico, de la responsable, y las cuentas se cierran al cambiar chips.
- Hoy el envío de mensajes usa Wasender («lo que estamos usando para el envio de mensaje»).
- El CRM tiene entrenamiento, agentes que responden, seguimiento y panel (dicho por la responsable, 05:56).
- El estudio jurídico tiene datos de clientes en sus chats, lo que hace riesgosa una nube de terceros (criterio de Claude).

## 8. Pendiente, a medias o bloqueado

- **Verificar un número en BlueStacks.** Bloqueado: WhatsApp exige detección automática del SMS y no ofrece otra opción. Claude sugirió esperar 24 a 48 h antes de volver a intentar.
- **Certificación de Google Play.** No confirmada. Puede tardar hasta un día (según Claude).
- **Decidir el costo.** Pagar DuoPlus o GeeLark (USD 2 por equipo por mes más uso) o un servidor de pasarela (USD 5 a 10 por mes). Requiere autorización expresa de la responsable (`CLAUDE.md`: no se paga nada sin autorización).
- **Documento técnico «Líneas por pasarela».** No hecho. Incluiría: selector Meta o Pasarela por línea, envío y recepción por la pasarela, plantillas de texto libre en líneas por pasarela, estado de cada línea y pruebas.
- **Desarrollo en el CRM.** No empezado. Tendría que hacerlo el programador.
- **Destino de Wasender.** Sin decidir.

## 9. Aprendizajes

- «Dispositivo no certificado» viene de Google Play, no de WhatsApp (dicho por Claude).
- «Error, esperá» es un bloqueo de WhatsApp por demasiados intentos. Cada intento alarga la espera (dicho por Claude).
- WhatsApp puede abrir en modo tablet («Dispositivos vinculados», QR). Para evitarlo se cambió el perfil del emulador a celular y se empezó de cero (chat, 07:42). No se verificó que funcione.
- Cuando el SMS no se puede detectar y no hay opción de escribir el código, WhatsApp está bloqueando el emulador. Claude lo concluyó el 17/11 a las 08:20, sin captura de la pantalla de verificación.
- Wasender se corta cuando se cierra sesión en el celular o cuando WhatsApp detecta envíos automáticos. Una pasarela como Evolution API se reconecta sola si no se cerró la cuenta (dicho por Claude).
- Lo que no funcionó: APK en BlueStacks Desktop 16, verificación por SMS en BlueStacks, Device ID en Play sin el registro previo.

## 10. Preguntas abiertas

- ¿Autoriza la responsable un servicio pago (DuoPlus, GeeLark o servidor de pasarela)?
- ¿Se mantiene Wasender o se da de baja cuando haya pasarela?
- ¿Qué pasa con las 2 líneas que no se nombraron?
- ¿Se armó el documento técnico de la pasarela? Claude lo ofreció y no hay respuesta.
- ¿Se registró el identificador GSF en Google y el equipo quedó certificado?
- ¿Cuándo se hace la prueba de DuoPlus o GeeLark con un número (propuesta para el 18/11)?

## 11. Ramas y cambios

- **Repo y rama:** ninguno. No se tocó el CRM.
- **Commits, PR, archivos tocados, migraciones, despliegues:** ninguno.
- **Configuración fuera del código:**
  - BlueStacks instalado con perfil de celular, WhatsApp Business instalado, sin cuenta verificada (no confirmado).
  - Registro del identificador GSF en google.com/android/uncertified con la cuenta de Google del emulador (no confirmado).
  - Borrado de datos de Google Play, Servicios de Google Play y WhatsApp Business: indicado como paso, no confirmado.
- **Encendido o apagado:** pasarela no creada, no hay servicio contratado. Wasender sigue como estaba. El emulador queda como instancia de prueba.

## 12. CONTRADICE

- **Wasender dentro del CRM.** Claude afirmó (05:56 y 05:59): «hoy el CRM envía y recibe solo por la API de Meta. Wasender trabaja por fuera, y por eso los chats que manda no entran al panel». El repo dice otra cosa:
  - `src/lib/wasender/` con `envio.ts`, `entrada.ts`, `webhook-url.ts`, `lineas.ts`, `campanas.ts`, entre otros.
  - `src/app/api/webhooks/wasender/route.ts` y rutas `src/app/api/wasender/lineas/…`.
  - `cerebro/03-crm-y-bots.md`: menú «WhatsApp por QR (Wasender)», canal de entrada «Meta/Wasender» en Chats y método «Meta/Wasender» en Campañas.
  - La propia responsable dice que usan Wasender para enviar.
  - Conclusión: la afirmación del chat es incorrecta o está desactualizada. Esto cambia la premisa de «pasarela como reemplazo directo» (sección 4 del chat). Hay que revisar antes de diseñar la conexión.
- **Android usado como opción.** Claude lo recomendó (05:46 y 05:51) y la responsable lo rechazó (05:53). `cerebro/03` lo marca como descartado. Coincide con la decisión final; no es contradicción de hechos, pero se publicó como recomendación.
- **Cifras de Meta y DuoPlus.** Claude las cita sin fuente. `cerebro/03` coincide en el costo de DuoPlus y GeeLark («~USD 2/equipo/mes»). Las cifras de Meta no están verificadas.
- **«Ya deja de ser por bloqueo»** (responsable) frente a «los cortes van a seguir» (Claude). Desacuerdo abierto, no resuelto en el chat ni en `cerebro/03`.
