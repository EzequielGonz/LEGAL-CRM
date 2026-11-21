# Alternativas a la API de Meta
- Origen: Claude común (exportación de datos 21/11/2026)
- Creado: 2026-11-17T04:34 · Actualizado: 2026-11-21T05:57
- Mensajes: 47
- Texto tal cual, con claves, códigos y teléfonos tachados.

## RESPONSABLE · 2026-11-17T04:34

no tengo tantos telefonos para gestionar y conectar 6 lineas, la api de meta cobra demasiado el envio de mensajes, que otra forma aparte de la api de meta hay para gestionar y controlar 6 whatsapp, solo conectarlos al crm como estan ahora

## CLAUDE · 2026-11-17T04:35

```
This block is not supported on your current device yet.
```

```
This block is not supported on your current device yet.
```


Las líneas de Meta no necesitan teléfonos. Lo que cuesta caro son los envíos que arranca el CRM (las campañas), no las respuestas. Fuera de Meta existen alternativas, pero ponen en riesgo los números.

**Sobre la API de Meta (la que ya usa el CRM)**
- Un número conectado a la API no necesita un celular: el chip se usa solo para recibir el código de verificación una vez.
- Las respuestas a quien te escribió primero son baratas. Desde el 1 de octubre de 2026 cada número de empresa tiene 1.000 mensajes de servicio gratis por mes, y después se cobra cada mensaje entregado. Con 6 líneas son 6.000 respuestas gratis por mes.
- Las campañas son lo que encarece. En Argentina, la plantilla de marketing cuesta USD 0,07107 y la de utilidad USD 0,02990. Las 1.610 plantillas `estudio_juridico_vita` registradas, si fueron de marketing, salen unos USD 114.
- Desde el 21 de septiembre de 2026, las conversaciones que empiezan desde anuncios de clic a WhatsApp tienen 7 días de envío gratis. Lograr que el prospecto escriba primero (anuncios, botones de las landings) es la forma de bajar el costo sin dejar la vía oficial.

**La alternativa sin Meta: conectar por WhatsApp Web**
Son pasarelas que vinculan cada número con un código QR, como WhatsApp Web, y lo pasan al CRM:
- Para instalar en un servidor propio: Evolution API, WAHA, Baileys o whatsapp-web.js. No se paga por mensaje, solo el servidor.
- Como servicio pago: Z-API, Green-API, Whapi.cloud o Wassenger. Cobran una cuota mensual por número.

Lo que conviene saber antes de elegir esta vía:
1. **Sigue haciendo falta un celular por cuenta, aunque no seis.** Cada número tiene que estar activo en alguna app. Un Android con dos chips puede tener WhatsApp y WhatsApp Business, y cada app admite una segunda cuenta. Después el celular solo tiene que conectarse cada tanto para que no se caiga la vinculación.
2. **Va contra las condiciones de WhatsApp.** Si WhatsApp detecta el uso, puede bloquear el número y se pierden los chats.
3. **Con campañas a prospectos que no escribieron primero, el bloqueo es casi seguro.** Para la captación en frío esta vía es la más riesgosa. Funciona mejor para atender a quien escribe.
4. Se pierden funciones que el CRM ya usa con Meta: el catálogo de plantillas, los estados de entrega oficiales y la calidad de cada línea.

**Mi recomendación:** una opción mixta. Las campañas siguen por Meta en una o dos líneas, y se apuntan las demás a que el prospecto escriba primero, donde los primeros 1.000 mensajes por mes son gratis. Una pasarela por QR la usaría solo en líneas de atención y con números que se pueda perder sin problema.

No cambié nada en el CRM. Si querés, armo la comparación de costos con tus volúmenes reales por línea, o el plan para sumar una pasarela como Evolution API en una sola línea de prueba.

## RESPONSABLE · 2026-11-17T04:49

https://www.duoplus.net y esta pagina?

## CLAUDE · 2026-11-17T04:50

```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```

DuoPlus sirve para una sola parte del problema: reemplaza los celulares, pero no conecta nada al CRM. Son celulares Android virtuales que alquilás y manejás desde el navegador.

**Cómo encajaría**
1. En cada celular virtual instalás WhatsApp o WhatsApp Business y registrás tu número con el código que llega a tu chip.
2. Vinculás esa cuenta por QR a una pasarela como Evolution API o WAHA. La pasarela es la que se conecta al CRM.

Así no necesitás 6 celulares físicos. Usá siempre tus propios números: los números virtuales que ellos ofrecen se pueden perder y con ellos la cuenta.

**Costo aproximado** (según reseñas, el sitio no muestra precios: confirmalo en la prueba gratis)
- Cada celular cuesta USD 2 por mes, y el uso se cobra aparte: USD 0,15 cada 30 minutos (con tope de USD 0,9 por día y equipo) o USD 19,9 por mes por equipo para tenerlo prendido siempre.
- Si la pasarela maneja los mensajes, el celular virtual no necesita estar prendido todo el tiempo, solo encenderlo cada tanto para que no se caiga la vinculación. Con 6 líneas serían unos USD 15 a 20 por mes, más el servidor de la pasarela.
- Si en cambio lo tenés prendido siempre, son unos USD 130 por mes.

**Riesgos, más altos que con un celular físico**
- **Bloqueos.** El sitio se presenta como herramienta para manejar muchas cuentas de redes y se titula «Anti-Detection Cloud Phone», es decir, para que la plataforma no detecte el uso. WhatsApp busca justamente eso: un número usado desde un equipo virtual y con envíos en cantidad tiene bastante chance de bloqueo. Para las campañas en frío no lo usaría.
- **Confidencialidad.** Los chats quedarían en un equipo de un tercero, que viene del equipo técnico de AdsPower. En la línea del estudio jurídico hay datos de clientes, así que ahí no lo recomiendo.
- **Doble dependencia.** Si se cae DuoPlus o la pasarela, se corta la línea.

**Mi opinión:** lo probaría en una sola línea de atención, con un número que puedas perder, antes de llevarlo a las 6. Para el estudio jurídico y para las campañas seguiría con la API de Meta: ahí no hace falta ningún celular, y las respuestas a quien escribe primero tienen 1.000 mensajes gratis por línea al mes.

Si querés, armo la prueba de una línea (DuoPlus + Evolution API conectada al CRM) como guía para el programador. No toco nada hasta que lo autorices.

## RESPONSABLE · 2026-11-17T04:51

y bluestacks?

## CLAUDE · 2026-11-17T04:51

BlueStacks cumple el mismo papel que DuoPlus, pero gratis y en tu propia computadora. Para lo que necesitás, me parece mejor opción que DuoPlus.

**Cómo funcionaría**
1. Instalás BlueStacks en una PC y con su administrador de instancias creás 6 Android, uno por línea.
2. En cada uno instalás WhatsApp o WhatsApp Business y lo verificás con el código que llega a tu chip.
3. Vinculás cada cuenta por QR a la pasarela (Evolution API o WAHA), que es la que conecta con el CRM.
4. La PC no tiene que estar prendida todo el día. Pero cada tanto hay que abrir las 6 instancias para que WhatsApp no cierre la vinculación. Hoy son unos 14 días: conviene hacerlo una vez por semana.

**Ventajas frente a DuoPlus**
- No pagás por equipo ni por uso.
- Los chats quedan en tu PC y no en la nube de un tercero. Para la línea del estudio jurídico esto es mucho mejor.

**Contras**
- **Consume bastante.** 6 instancias abiertas a la vez piden una PC con 16 GB de RAM o más. Con menos memoria, abrilas de a dos o tres cuando toque hacer la reconexión.
- **WhatsApp puede detectar que es un emulador.** En general funciona, pero el riesgo de bloqueo es algo mayor que en un celular real, y sube mucho si mandás campañas a gente que no te escribió.
- **Si esa PC se rompe o se formatea**, tenés que volver a verificar los 6 números. Activá la copia de seguridad de cada cuenta.
- La pasarela igual necesita un servidor siempre prendido: un VPS de USD 5 a 10 por mes o el hosting que ya use el programador.

**Si podés conseguir un celular viejo**, es más estable que cualquier emulador. Un Android con dos chips puede tener WhatsApp y WhatsApp Business, y cada app admite una segunda cuenta. Con uno o dos equipos usados cubrís las 6 líneas.

**Mi sugerencia:** BlueStacks para las líneas de atención (marketing, 0 km, coberturas). El estudio jurídico y las campañas, por la API de Meta. Empezaría probando con una sola línea durante una o dos semanas antes de pasar las demás.

Si querés, preparo la guía de esa prueba para el programador. No toco el CRM hasta que lo autorices.

## RESPONSABLE · 2026-11-17T05:42

para que funciona la pasarela?

## CLAUDE · 2026-11-17T05:42

La pasarela es lo que conecta WhatsApp con el CRM. Funciona como un WhatsApp Web que queda abierto todo el tiempo en un servidor: recibe los mensajes y se los pasa al CRM, y manda los mensajes que el CRM le pide.

**Por qué hace falta**
Hoy el CRM no habla con los celulares sino con Meta:
- Cuando alguien escribe, Meta avisa al CRM (en `/api/webhooks/whatsapp`).
- Cuando el CRM responde, le pide a Meta que mande el mensaje.

Si dejás Meta, alguien tiene que hacer ese trabajo, y eso es la pasarela.

**Qué hace cada parte**

| Parte | Qué hace |
|---|---|
| Celular, BlueStacks o DuoPlus | Tiene la cuenta de WhatsApp de cada número. Solo hace falta abrirlo cada tanto. |
| Pasarela (Evolution API, WAHA) | Queda vinculada por QR a cada número, como WhatsApp Web, y está siempre conectada en un servidor. |
| CRM | Recibe y manda mensajes a través de la pasarela, en vez de a través de Meta. |

**Qué hace concretamente**
1. Mantiene las 6 sesiones conectadas aunque los celulares o emuladores estén apagados.
2. Cuando llega un mensaje, se lo reenvía al CRM al instante.
3. Cuando el CRM responde, lo manda por WhatsApp desde el número que corresponda.
4. Maneja fotos, audios y documentos, y te avisa si un número se desconectó y hay que volver a escanear el QR.

**Sin la pasarela**, BlueStacks solo te deja usar WhatsApp a mano, número por número, y nada llega al CRM.

**Lo que implica para el CRM:** la pasarela no usa el mismo formato que Meta. El programador tiene que agregar al CRM una conexión nueva para hablar con la pasarela, al lado de la de Meta. Eso es desarrollo, no solo configuración, y además hace falta un servidor para la pasarela (unos USD 5 a 10 por mes).

Si querés, preparo la guía de esa conexión para el programador empezando por una sola línea. No avanzo sin tu autorización.

## RESPONSABLE · 2026-11-17T05:46

el problema es que en bluestacks al descargar whatsapp, aparece en google play como dispositivo no certificado y sale error en la verificacion, que espere, lo hice muchisimas veces  y nada... wasender todo el tiempo se desconecta y pide que vuelva a iniciar sesion, lo que estamos usando para el envio de mensaje... por eso necesito un emulador para no tener que estar colocando todo el tiempo los chips fisicos en cada linea.

## CLAUDE · 2026-11-17T05:46

No hace falta tener el chip puesto: solo se usa para recibir el código cuando se verifica la cuenta. Una vez verificado, WhatsApp sigue funcionando sin el chip. Si estás cambiando chips todo el tiempo, es porque las cuentas se cierran y se vuelven a verificar, y eso es lo que hay que cortar.

**Por qué falla BlueStacks**
- **«Dispositivo no certificado»** es un aviso de Google Play, no de WhatsApp. Lo esquivás bajando WhatsApp directamente de whatsapp.com/android.
- **«Error, esperá»** es WhatsApp frenando por demasiados intentos. Cada intento nuevo alarga la espera y deja marcado el número. Ese número no lo vuelvas a intentar por 24 a 48 horas, y no desde BlueStacks. WhatsApp detecta muchos emuladores, así que es probable que no puedas verificar ahí aunque esperes.

**Por qué se desconecta Wasender**
Wasender funciona como WhatsApp Web, igual que la pasarela de la que hablamos. Se suele cortar por dos razones:
1. El celular donde está la cuenta pierde la sesión: se sacó el chip, se verificó el número en otro equipo o se cerró la cuenta.
2. WhatsApp detecta envíos automáticos en cantidad y corta la sesión como advertencia. Si sigue, bloquea el número.

Cambiar de emulador no arregla la segunda causa. Si los envíos son a contactos que no les escribieron, los cortes van a seguir con cualquier herramienta no oficial.

**Lo que haría, de más simple a más sólido**

1. **Uno o dos Android usados, siempre enchufados al wifi.**
   - Cada uno aloja varias cuentas: WhatsApp y WhatsApp Business, y cada app admite una segunda cuenta (según la versión).
   - Verificás cada número una sola vez, sacás el chip y lo guardás.
   - Con 2 equipos cubrís las 6 líneas, y Wasender queda vinculado a cada cuenta sin que nadie toque nada.
   - Es la forma más estable sin Meta, y los equipos se pagan en uno o dos meses frente a cualquier servicio pago.

2. **Celular en la nube (DuoPlus o similar)** si de verdad no querés tener equipos físicos.
   - Están hechos para pasar la verificación mejor que BlueStacks.
   - El riesgo de bloqueo en envíos masivos es el mismo, y se paga por mes.

3. **API de Meta para la línea que hace campañas.**
   - No necesita celular ni chip, y no se desconecta.
   - Solo se paga cada envío, y es la única forma de mandar en cantidad sin perder el número.
   - El CRM ya está preparado para esto.

**Mi recomendación:** la opción 1 para las líneas de atención, y la API de Meta para las campañas. Si se siguen haciendo campañas en cantidad por Wasender, tarde o temprano se pierde algún número, uses el equipo que uses.

¿Querés que arme una guía paso a paso para dejar las 6 cuentas en 2 celulares y vinculadas a Wasender sin volver a tocar los chips?

## RESPONSABLE · 2026-11-17T05:51

no, tengo que cambiar de chip en el celular fisico, no en bluestacks. 
recien lo descargue y cree la cuenta de bluestacks, inicie google play, mi cuenta y no me deja certificar el dispositivo. 

Claro, tengo un solo telefono y siempre tengo que cerrar las cuentas, son 6 lineas en total. 
Justamente hay un entrenamiento y un algoritmo que empieza con 20 contactos diarios, incluso menos, con plantillas de inicio distintas, tiempo de envio aleatorio, etc etc. Ya deja de ser por bloqueo. 

Necesito tener las 6 lineas en un solo lugar, que queden prendidas ahi, y que ahi, si en algun momento se desconecta alguna, vuelva a conectarse sola al panel... siempre es por cerrar sesion o cuenta

## CLAUDE · 2026-11-17T05:51

El problema es tener que cerrar las cuentas para cambiar el chip. Cada vez que cerrás una cuenta en el celular, se corta su vinculación con Wasender y ningún programa puede reconectarla solo, porque pide un QR nuevo. La solución es que las 6 cuentas queden abiertas a la vez y no se cierren nunca más.

**El chip solo hace falta para verificar**
Verificás cada número una vez, sacás el chip y la cuenta sigue funcionando. No hace falta volver a ponerlo salvo que cierres sesión.

**Cómo entrar las 6 en tu celular (o en dos)**
- **WhatsApp normal:** admite 2 cuentas (Ajustes → flecha junto a tu nombre → Agregar cuenta).
- **WhatsApp Business:** admite otras 2.
- Con eso ya tenés **4 cuentas abiertas a la vez** en un solo celular, sin cambiar chips.
- Para las 2 que faltan:
  - Si tu celular trae **«Aplicaciones duplicadas»** (Xiaomi), **«Dual Messenger»** (Samsung) o algo parecido según la marca, duplicás WhatsApp y entran las otras 2.
  - Si no lo trae, un Android usado barato para esas 2 líneas.

**Pasos**
1. Poné el chip 1, verificá, agregá la cuenta y sacá el chip. Repetí con cada número. No cierres sesión en ninguna.
2. Vinculá cada cuenta a Wasender desde «Dispositivos vinculados».
3. Dejá el celular enchufado y con wifi. Mientras ninguna cuenta se cierre, Wasender no debería pedir sesión de nuevo.

**Sobre la reconexión automática**
- Si se cae internet o el servidor, una pasarela como Evolution API se reconecta sola. Wasender, según cómo esté instalado, a veces no.
- Si la cuenta se cerró en el celular, no hay herramienta que la reconecte sola: siempre hay que vincularla de nuevo. Por eso la clave es no cerrarlas.

**Si igual querés probar BlueStacks**
1. Instalá la app «Device ID» dentro de BlueStacks y copiá el número que aparece como **GSF**.
2. Cargalo en google.com/android/uncertified con tu cuenta de Google.
3. Esperá un rato, borrá los datos de Google Play y Play Services, y reiniciá BlueStacks.
4. También podés saltear Play y bajar WhatsApp de whatsapp.com/android.

Igual, WhatsApp puede rechazar la verificación por ser un emulador. Además, para vincular sin cámara tendrías que usar «Vincular con número de teléfono» en vez del QR. Primero probaría lo del celular, que es más estable y no te cuesta nada.

¿Qué marca y modelo es tu celular? Con eso te digo si duplica apps y cuántas de las 6 cuentas entran ahí.

## RESPONSABLE · 2026-11-17T05:53

no, la del telefono fijo no es opcion. necesito un emulador o algo que las mantenga abiertas, si se cierra esta bien, la abro otra vez desde el emulador, pero con el celu fijo/fisico, no es opcion...

## CLAUDE · 2026-11-17T05:53

Entonces hay que lograr que el emulador funcione. Los dos errores que tuviste tienen arreglo.

**1. «Dispositivo no certificado» en BlueStacks**
Tenés dos caminos:
- **Saltear Google Play:** bajá WhatsApp y WhatsApp Business desde whatsapp.com/android, abrí el archivo en BlueStacks y se instala sin pasar por Play.
- **Certificar el equipo:**
  1. Instalá la app «Device ID» (si Play no te deja, buscá el archivo de instalación) y copiá el número **GSF Android ID**.
  2. Cargalo en google.com/android/uncertified con tu cuenta de Google.
  3. Esperá entre 30 minutos y un par de horas, borrá los datos de Google Play y Play Services, y reiniciá BlueStacks.

**2. «Error en la verificación, esperá»**
Eso lo pone WhatsApp cuando un número tuvo demasiados intentos, sin importar en qué equipo.
- Con ese número, esperá 24 a 48 horas sin intentar.
- Cuando vuelvas a probar, poné el chip en el celular y elegí **«Llamarme»** si el SMS no llega.
- Probá primero con otro número que no hayas intentado hoy, para saber si el emulador funciona.

**Cómo dejar las 6 líneas en BlueStacks**
- Cada instancia de BlueStacks puede tener WhatsApp y WhatsApp Business, y cada app admite 2 cuentas.
- Con 2 o 3 instancias entran las 6, y el chip solo lo ponés en tu celular cuando verificás cada número, una sola vez.
- Para vincular Wasender, el emulador no tiene cámara para el QR. Si Wasender ofrece **«Vincular con número de teléfono»**, usá esa opción: te da un código que escribís en WhatsApp.
- Si una cuenta se cierra, la volvés a abrir desde el emulador sin tocar el celular. El chip solo hace falta si WhatsApp te pide verificar de nuevo.

**Si BlueStacks sigue fallando, dos alternativas**
- **Emulador de Android Studio** (gratis): usando una imagen «Google Play», el equipo ya viene certificado por Google y WhatsApp suele verificar mejor. Es más técnico de instalar y consume bastante; el programador lo puede dejar listo en un rato.
- **Celular en la nube** (DuoPlus o GeeLark): quedan prendidos las 24 horas sin depender de tu PC y verifican mejor que BlueStacks. Pagás por mes y por equipo.

Mi orden: BlueStacks con WhatsApp bajado de la web y un número sin intentos de hoy. Si no verifica, Android Studio. Si tampoco, el celular en la nube.

¿Tu PC es Windows o Mac, y cuánta memoria RAM tiene? Con eso te digo cuántas instancias aguanta prendidas a la vez.

## RESPONSABLE · 2026-11-17T05:55

y en el caso que funcionen los emuladores, es necesario wasender?

## CLAUDE · 2026-11-17T05:55

Hace falta algo que haga lo que hoy hace Wasender. El emulador solo tiene las cuentas abiertas: no manda mensajes automáticos ni pasa nada al CRM. Ese algo puede ser Wasender o una pasarela conectada al CRM, pero no tiene sentido usar las dos.

**Qué hace cada pieza**
- **Emulador:** tiene las 6 cuentas abiertas. Sin nada más, solo podés escribir a mano en cada una.
- **Wasender o una pasarela:** se vincula a cada cuenta, manda los mensajes automáticos y recibe las respuestas.

**Tus dos opciones**

| | Emulador + Wasender | Emulador + pasarela (Evolution API) |
|---|---|---|
| Quién envía | Wasender | El CRM, a través de la pasarela |
| Respuestas en el CRM | No, salvo que Wasender las exporte | Sí, cada chat entra solo al panel |
| Si se corta la conexión | A veces pide iniciar sesión de nuevo | Se reconecta sola, salvo que la cuenta se haya cerrado en el emulador |
| Costo | La licencia de Wasender | Gratis, más un servidor de unos USD 5 a 10 por mes |
| Trabajo extra | Ninguno, ya lo usan | El programador tiene que conectar la pasarela al CRM |

**Mi recomendación**
Si querés las 6 líneas conectadas al panel «como ahora», la pasarela reemplaza a Wasender. Queda una sola herramienta, los chats entran al CRM y la reconexión es automática. Wasender te sirve solo si la idea es seguir mandando desde ahí y atender las respuestas por fuera del CRM.

Una pregunta define el camino: el entrenamiento (20 contactos por día, plantillas distintas, tiempos al azar), ¿está armado en Wasender o en el CRM?
- Si está en el CRM, la pasarela es el reemplazo directo.
- Si está en Wasender, el programador tendría que pasar esa lógica al CRM antes de dejar Wasender.

## RESPONSABLE · 2026-11-17T05:56

esta todo en el crm, los agentes que responden, todo...

## CLAUDE · 2026-11-17T05:56

```
This block is not supported on your current device yet.
```

Entonces no necesitás Wasender: lo reemplaza una pasarela conectada directamente al CRM. Revisé el código y hoy el CRM envía y recibe solo por la API de Meta. Wasender trabaja por fuera, y por eso los chats que manda no entran al panel.

**Cómo quedaría**
```
Emulador (6 cuentas abiertas)
   ↕ vinculadas por código, sin QR
Pasarela Evolution API (en un servidor, siempre prendida)
   ↕
CRM: campañas, entrenamiento, agentes, panel
```

**Lo que no cambia**
El entrenamiento (20 por día, plantillas distintas, tiempos al azar), los agentes que responden, el seguimiento y el panel. Todo eso ya está en el CRM y sigue igual.

**Lo que el programador tiene que agregar**
1. **Elegir por cuál vía va cada línea**: en Configuración, cada línea se marca como «Meta» o «Pasarela». Podés tener líneas de los dos tipos al mismo tiempo.
2. **Enviar**: el CRM manda por la pasarela en vez de por Meta. Los límites y los tiempos se respetan igual.
3. **Recibir**: una entrada nueva para que la pasarela le pase al CRM los mensajes que llegan. Desde ahí entran a los agentes como cualquier mensaje.
4. **Plantillas**: hoy el CRM exige plantillas aprobadas por Meta. En las líneas por pasarela no hace falta aprobación, así que se usan textos cargados en el panel.
5. **Estado de cada línea**: un aviso en el panel de qué línea está conectada o caída. Si la pasarela no se puede reconectar sola, el aviso te da un código para volver a vincularla desde el emulador.

**Qué hace falta aparte del código**
- **Un servidor para la pasarela**: Vercel no sirve porque la pasarela tiene que estar prendida todo el tiempo. Un servidor chico de Hostinger u otro proveedor cuesta unos USD 5 a 10 por mes. Evolution API es gratis.
- **Que el emulador funcione con las 6 cuentas.** Esto conviene confirmarlo antes de que el programador invierta tiempo.

**Orden que propongo**
1. Vos: lograr que BlueStacks (o la alternativa) verifique al menos 1 número.
2. Yo: armar el documento técnico del bloque «Líneas por pasarela» para el programador, con los cambios, las pruebas y cómo volver atrás.
3. Programador: lo implementa y lo prueba con esa 1 línea antes de pasar las 6.

Esto sería un bloque nuevo del CRM, así que no lo empiezo sin tu autorización. ¿Querés que arme el documento técnico, o primero probás si el emulador verifica?

## RESPONSABLE · 2026-11-17T05:58

entonces, decime como hago en bluestacks

## CLAUDE · 2026-11-17T05:59

Te dejo el paso a paso para BlueStacks 5 en Windows. Probalo primero con **un solo número**, y que no sea uno de los que intentaste hoy.

**1. Preparar BlueStacks**
1. Actualizá BlueStacks a la última versión.
2. Abrí el **administrador de instancias** (Ctrl + Shift + 8) y creá una instancia nueva con **Android 11 de 64 bits**. Suele traer menos problemas con Google que las versiones viejas.
3. En esa instancia, andá a Configuración → **Teléfono** (o Dispositivo) y elegí un modelo conocido, por ejemplo Samsung Galaxy S22. Así no aparece como «BlueStacks».
4. En Configuración → Avanzado, dejá el **root desactivado**: WhatsApp lo detecta.

**2. Instalar WhatsApp sin Google Play**
1. Desde la PC bajá WhatsApp de **whatsapp.com/android**.
2. Arrastrá el archivo a la ventana de BlueStacks, o usá el botón **«Instalar APK»** de la barra lateral (Ctrl + Shift + B).

Si tus líneas son **WhatsApp Business**, ese archivo no está en la web oficial y tenés que instalarlo desde Google Play, así que primero hay que certificar el equipo (paso 3). Si pasás un número de Business a WhatsApp normal, perdés el perfil de empresa.

**3. Certificar el equipo en Google (solo si necesitás Play)**
1. Conseguí la app **«Device ID»** (de Evozi). Si Play no te deja, bajala de APKMirror e instalala como en el paso 2.
2. Abrila y copiá el número que dice **«Google Service Framework (GSF)»**.
3. Desde la PC entrá a **google.com/android/uncertified** con la misma cuenta de Google de BlueStacks, pegá el número y registralo.
4. Esperá entre 30 minutos y un par de horas.
5. En BlueStacks andá a Ajustes de Android → Apps, y en **Google Play Store** y **Servicios de Google Play** tocá «Borrar almacenamiento».
6. Reiniciá la instancia y volvé a entrar a Play.

**4. Verificar el número**
1. Poné el chip de esa línea en tu celular.
2. Abrí WhatsApp **en BlueStacks** e ingresá el número.
3. El código te llega al celular: escribilo en BlueStacks. Si el SMS no llega en 2 o 3 minutos, elegí **«Llamarme»**.
4. Si sale «Esperá», **no insistas**: cada intento alarga la espera. Volvé a probar cuando termine el contador.
5. Al verificar en BlueStacks, la cuenta se cierra en el celular. Es lo esperado: desde ahí la cuenta vive en el emulador y podés sacar el chip.

**5. Sumar las otras líneas**
- Lo más simple es **una instancia por línea**, 6 en total, si tu PC tiene 16 GB de RAM o más.
- Si tiene menos, usá 3 instancias con 2 cuentas cada una: en WhatsApp, Ajustes → flecha junto a tu nombre → **Agregar cuenta**.
- En el administrador de instancias ponele a cada una el nombre de la línea (Jurídico, 0 km, etc.).

**6. Para que no se cierren**
- No desinstales WhatsApp, no borres sus datos y no cierres sesión.
- Abrí las instancias al menos una vez por semana.
- Activá la copia de seguridad en Google Drive de cada cuenta (Ajustes → Chats → Copia de seguridad).

**Cuando se conecte la pasarela**, la vinculación se hace en cada instancia: WhatsApp → Dispositivos vinculados → Vincular un dispositivo → **«Vincular con número de teléfono»**, y escribís el código que muestra la pasarela. No hace falta cámara.

Si en algún paso aparece un error, mandame una captura o el texto exacto y lo vemos.

## RESPONSABLE · 2026-11-17T06:02

no abre el administrador de instancias... como hago? whatsapp business necesito, ya lo tengo instalado, tengo que instalar otro?

## CLAUDE · 2026-11-17T06:02

No, no hace falta instalar otro. Con el WhatsApp Business que ya tenés alcanza para probar. Las instancias las vemos después, cuando el primer número verifique.

**Ahora: probar un número en lo que ya tenés**
1. Abrí WhatsApp Business en BlueStacks e ingresá un número **que no hayas intentado hoy**.
2. Poné el chip en el celular, esperá el código y escribilo en BlueStacks. Si no llega, elegí «Llamarme».
3. Si verifica, el emulador funciona y seguimos. Si sale error, mandame el texto exacto.

**Cuántas cuentas entran en ese WhatsApp Business**
- Admite **2 cuentas**: Ajustes → flecha junto a tu nombre → **Agregar cuenta**.
- Para las otras 4 necesitás más instancias. Cada instancia es un Android aparte, así que en cada una se instala WhatsApp Business de nuevo.

**Para abrir el administrador de instancias** (probá en este orden)
1. **Barra lateral derecha de BlueStacks**: buscá el ícono de dos o tres cuadraditos superpuestos («Administrador de instancias»). Si no ves la barra, tocá las flechitas « arriba a la derecha.
2. **Menú Inicio de Windows**: escribí **«Multi-Instance Manager»** o «Administrador de instancias». Es un programa aparte que se instala junto con BlueStacks y también suele tener acceso directo en el escritorio.
3. El atajo Ctrl + Shift + 8 solo funciona con la ventana de BlueStacks seleccionada.

Si no aparece en ninguno de esos lugares, puede que tengas **BlueStacks X** u otra versión que no trae instancias. En la ventana de BlueStacks, ¿qué dice arriba a la izquierda o en «Acerca de»: BlueStacks 5, BlueStacks X o BlueStacks 10?

**Un atajo para después:** cuando tengas una instancia con WhatsApp Business instalado y **sin cuenta registrada**, podés **clonarla** desde el administrador y ya queda instalado en la copia. No clones una instancia que ya tiene una cuenta verificada, porque se duplica la sesión y WhatsApp puede cerrarla.

## RESPONSABLE · 2026-11-17T06:17

no me anda con el whatsapp apk, se queda conectando. es el bluestack que tengo que tener?

## CLAUDE · 2026-11-17T06:18

Sí, el problema es la versión. Tenés **BlueStacks Desktop 16 con Android 16 (Beta)**, como se ve arriba a la izquierda de tu captura. Es una versión de prueba: no trae el administrador de instancias, y WhatsApp puede no funcionar bien sobre Android 16. Además, en la captura está instalado **WhatsApp normal**, no Business.

**Antes de reinstalar, una prueba de 1 minuto**
Abrí Chrome dentro de BlueStacks (está en la barra de abajo) y entrá a cualquier página.
- Si **no carga**, BlueStacks no tiene internet y por eso WhatsApp se queda «conectando». Revisá que no tengas VPN, proxy o un antivirus bloqueándolo.
- Si **carga**, el problema es la versión: seguí con lo de abajo.

**Cambiar a BlueStacks 5 (la estable)**
1. Desinstalá BlueStacks Desktop desde Windows → Configuración → Aplicaciones.
2. Bajá **BlueStacks 5** desde bluestacks.com. Si la página te ofrece la versión nueva, buscá «BlueStacks 5» en support.bluestacks.com, donde están las versiones anteriores.
3. Al instalar o en el administrador de instancias, elegí **Android 11 (64 bits)**.
4. Abrí el **administrador de instancias** con el ícono de la barra lateral o buscando «Multi-Instance Manager» en el menú Inicio. Esa versión sí lo trae.
5. Entrá a Play Store con tu cuenta e instalá **WhatsApp Business**. Si te sale «dispositivo no certificado», hacé el paso 3 de la guía anterior (Device ID → google.com/android/uncertified).
6. Verificá **un solo número** que no hayas intentado hoy, con el chip en el celular y la opción «Llamarme» si no llega el SMS.

Cuando lo tengas instalado, mandame una captura de la ventana y te digo si quedó bien configurado antes de verificar.

## RESPONSABLE · 2026-11-17T06:22

cual descarg?

## CLAUDE · 2026-11-17T06:22

Descargá **Pie 64-bits**. Es la versión estable de BlueStacks 5, y WhatsApp Business funciona bien en Android 9.

Te había dicho Android 11, pero esta página ya no la ofrece. Las otras dos no te convienen:
- **Nougat 32-bits** es Android 7 y es vieja: WhatsApp puede dejar de funcionar ahí en cualquier momento.
- **Android 13 (Beta)** es una versión de prueba, como la que te daba problemas.

**Al instalar**
1. Antes, desinstalá BlueStacks Desktop para que no choquen las dos versiones.
2. Instalá la Pie 64-bits y abrila.
3. Entrá a Play Store con tu cuenta e instalá **WhatsApp Business**.
4. Si Play dice «dispositivo no certificado», hacé el paso de Device ID → google.com/android/uncertified que te pasé antes.
5. Antes de verificar, abrí Chrome dentro de BlueStacks y comprobá que cargue una página.

Cuando esté instalado, mandame una captura y seguimos con la verificación del primer número.

## RESPONSABLE · 2026-11-17T07:41

ya lo hice, tanto la apk como en google play me apareece como un wpp web

## CLAUDE · 2026-11-17T07:42

Eso pasa porque **WhatsApp cree que BlueStacks es una tablet**. En tablets, WhatsApp arranca en modo «dispositivo vinculado», con un QR igual al de WhatsApp Web, en vez de dejarte registrar un número. Se arregla haciendo que BlueStacks parezca un celular.

**1. Pasar BlueStacks a formato celular**
En BlueStacks, abrí **Configuración** (el ícono de engranaje de la barra lateral derecha, o el menú ☰ arriba a la derecha):
- **Pantalla:** elegí orientación **Vertical** y la resolución **1080 × 1920** (o 720 × 1280 si la PC es justa). En **DPI** poné 420 o 320.
- **Teléfono** (o **Dispositivo**): elegí un perfil de celular, por ejemplo **Samsung Galaxy S22** o **OnePlus**.
- Guardá. BlueStacks te va a pedir **reiniciar**: aceptá.

**2. Empezar WhatsApp Business de cero**
Sin esto, WhatsApp va a seguir abriendo en modo tablet.
1. En BlueStacks andá a Ajustes de Android → Aplicaciones → **WhatsApp Business** → Almacenamiento → **Borrar almacenamiento**. También podés desinstalarlo y volver a instalarlo desde Play.
2. Abrilo: ahora debería aparecer **«Aceptar y continuar»** y el campo para el número, no el QR.

**3. Si igual aparece el QR**
Tocá los **tres puntitos** arriba a la derecha de esa pantalla, o buscá abajo una opción como **«Registrar un número de teléfono»** o «Usar en este dispositivo». Según la versión, WhatsApp la muestra ahí.

**Importante:** no escanees ese QR con tu celular. Si lo hacés, la cuenta queda dependiendo del celular, y es justo lo que querés evitar.

Si después del reinicio sigue apareciendo el QR, mandame una captura de esa pantalla y de Configuración → Pantalla.

## RESPONSABLE · 2026-11-17T07:48

esta en vertical, lo del telefono tambien, pero no encuentro eso de ajustes de android

## CLAUDE · 2026-11-17T07:48

Ya está todo bien configurado: BlueStacks 5 (P64), vertical y con WhatsApp Business. Los ajustes de Android están dentro de la carpeta **«Aplicaciones del sistema»**, pero hay una forma más simple.

**Lo más fácil: desinstalar y volver a instalar**
1. Mantené apretado el ícono de **WhatsApp Business** hasta que aparezca un menú y elegí **«Desinstalar»**.
2. Hacé lo mismo con **WhatsApp** (el normal). Si no lo vas a usar, así no se confunden las dos apps.
3. Abrí **Store** o Google Play, buscá **WhatsApp Business** e instalalo de nuevo.
4. Abrilo: debería aparecer **«Aceptar y continuar»** y el campo para el número.

**Si preferís borrar los datos sin desinstalar**
Abrí la carpeta **Aplicaciones del sistema** → **Configuración** (el engranaje) → **Aplicaciones** → **WhatsApp Business** → **Almacenamiento** → **Borrar almacenamiento**.

**Si aun así aparece el QR**
- Tocá los **tres puntitos** de esa pantalla y fijate si aparece la opción para registrar un número.
- Revisá en la configuración de BlueStacks (engranaje de abajo a la derecha) → **Pantalla** que el **DPI** esté en **320 o más**. Con DPI bajo, WhatsApp sigue viéndolo como tablet.
- Mandame una captura de la pantalla del QR.

## RESPONSABLE · 2026-11-17T07:50

me dice q me tiene que llegar un sms y detectarlo... y me tira que descargue la app oficial, por que el sms llega al celular

## CLAUDE · 2026-11-17T07:51

Son dos cosas distintas.

**1. «Tiene que llegar un SMS y detectarlo»**
Es normal. WhatsApp intenta leer el SMS solo, pero en BlueStacks no puede porque el SMS llega a tu celular. **Escribí el código a mano** en los casilleros cuando te llegue. Si no llega, esperá a que termine el contador y elegí **«Llamarme»**: el código te lo dicta una llamada. Si la cuenta está abierta en el celular, el código también puede llegar como aviso dentro de WhatsApp ahí.

**2. «Descargá la app oficial»**
WhatsApp muestra ese mensaje cuando cree que la app no es la original o que el equipo no es confiable. En BlueStacks suele ser lo segundo. Probá esto, en orden:
1. Instalá WhatsApp Business **solo desde Google Play**. Si el que tenés viene de un APK bajado de otro sitio, desinstalalo.
2. **Certificá el equipo** (si no lo hiciste): Device ID → número GSF → google.com/android/uncertified → esperá un rato → borrá los datos de Google Play y Play Services → reiniciá BlueStacks.
3. Volvé a intentar con el número.

**Si con eso sigue diciendo «app oficial»**, WhatsApp está bloqueando BlueStacks y no hay forma confiable de saltearlo. Las alternativas son:
- **Emulador de Android Studio** con imagen «Google Play»: Google lo ve más confiable que BlueStacks, aunque no hay garantía.
- **Celular en la nube** (DuoPlus o GeeLark): son los que mejor pasan esa revisión, pero se pagan por mes.

Para no adivinar: ¿me mandás una captura del mensaje de «app oficial»? Según el texto exacto te digo si es el equipo o la app.

## RESPONSABLE · 2026-11-17T07:54

Certificá el equipo (si no lo hiciste): Device ID → número GSF → google.com/android/uncertified → esperá un rato → borrá los datos de Google Play y Play Services → reiniciá BlueStacks. comop hago esto??

## CLAUDE · 2026-11-17T07:54

Así se hace, paso a paso:

**1. Instalar «Device ID»**
1. En BlueStacks abrí **Google Play** y buscá **«Device ID»**. Instalá la de **Evozi** (ícono azul con huella).
2. Abrila. En la lista buscá la fila **«Google Service Framework (GSF)»**. Al lado hay un código de letras y números, por ejemplo `3f9a2c...`.
3. Tocá esa fila para **copiarlo**.

**2. Registrarlo en Google (desde la PC)**
1. En el navegador de la PC entrá a **google.com/android/uncertified**.
2. Iniciá sesión con la **misma cuenta de Google** que usaste en BlueStacks.
3. En el campo **«Google Services Framework Android ID»** pegá el código con Ctrl + V. Lo que copiás en BlueStacks normalmente se pega en Windows; si no, copialo a mano.
4. Marcá **«No soy un robot»** y tocá **Registrar**.

Si la página te dice que el número no es válido, mandame el código y te lo paso al formato que pide (la app lo muestra en hexadecimal y a veces Google lo pide en números decimales).

**3. Esperar**
Entre 15 minutos y un par de horas. Mientras tanto no intentes verificar el número.

**4. Borrar los datos de Google Play**
1. En BlueStacks abrí la carpeta **Aplicaciones del sistema** → **Configuración** (engranaje) → **Aplicaciones**.
2. Si no ves las de Google, tocá los **tres puntitos** arriba → **Mostrar sistema**.
3. Entrá a **Google Play Store** → **Almacenamiento** → **Borrar almacenamiento**.
4. Volvé y entrá a **Servicios de Google Play** → **Almacenamiento** → **Administrar espacio** → **Borrar todos los datos**.
5. Hacé lo mismo con **WhatsApp Business** → Almacenamiento → **Borrar almacenamiento**, así arranca de cero.

**5. Reiniciar y comprobar**
1. Cerrá BlueStacks por completo y volvé a abrirlo.
2. Abrí Google Play → tu foto arriba a la derecha → **Configuración** → **Información**. En **«Certificación de Play Protect»** tiene que decir **«El dispositivo está certificado»**.
3. Si lo dice, abrí WhatsApp Business y probá el número de nuevo. El código del SMS escribilo a mano.

Si en algún paso algo no aparece igual, mandame captura.

## RESPONSABLE · 2026-11-17T07:56

cual es?

## CLAUDE · 2026-11-17T07:56

Instalá **«My Device IDs: GSF GAID viewer»** de **APSoft Studio**, la del ícono azul con «Device IDs». Ya en el nombre dice que muestra el **GSF**, que es el código que necesitás. La de Evozi no aparece en tu búsqueda, y esta hace lo mismo.

Cuando la abras, buscá la fila **GSF** (o «GSF ID»), copiá el código y seguí desde el paso 2: pegarlo en google.com/android/uncertified desde la PC.

Si muestra dos versiones del GSF (una con letras y otra solo con números), usá **la de solo números**, que es la que pide Google.

## RESPONSABLE · 2026-11-17T07:57



## CLAUDE · 2026-11-17T07:57

```
This block is not supported on your current device yet.
```

Encontraste el código: es la fila **Google Service Framework (GSF) ID**. La app lo muestra en hexadecimal (`3ec9fab420e7afe3`); en números decimales, que es como lo suele pedir Google, es:

**`4524422952223485923`**

**Ahora, desde la PC**
1. Entrá a **google.com/android/uncertified**. También podés tocar **«Registrarse»** debajo del código en la app, que lleva a la misma página.
2. Iniciá sesión con la **misma cuenta de Google** que usás en BlueStacks.
3. Pegá **`4524422952223485923`**. Si la página lo rechaza, probá con `3ec9fab420e7afe3`.
4. Marcá «No soy un robot» y tocá **Registrar**.

**Después**
5. Esperá entre 15 minutos y un par de horas.
6. Borrá los datos de **Google Play Store**, **Servicios de Google Play** y **WhatsApp Business** (Aplicaciones del sistema → Configuración → Aplicaciones → tres puntitos → Mostrar sistema → cada una → Almacenamiento).
7. Cerrá y abrí BlueStacks, y comprobá en Google Play → tu foto → Configuración → Información que diga **«El dispositivo está certificado»**.
8. Recién ahí probá el número en WhatsApp Business, escribiendo el código a mano.

El perfil quedó bien: Samsung S21 Ultra (SM-G998B), Android 9 y sin root.

## RESPONSABLE · 2026-11-17T08:11

esto sirve ? autoresponderwa se llama

## CLAUDE · 2026-11-17T08:11

Para lo que necesitás, no: no reemplaza la pasarela ni conecta las líneas al CRM. Sirve para respuestas automáticas simples.

**Cómo funciona AutoResponder**
- Lee las **notificaciones** de WhatsApp en ese mismo Android y contesta según reglas, como las de tus capturas («si el mensaje contiene "Test"...»).

**Lo que no puede hacer**
- **No inicia conversaciones**, así que no hay campañas ni el entrenamiento de 20 contactos por día. Solo responde a quien escribe.
- **No pasa los chats al CRM**, así que los agentes y el panel no ven nada.
- **Pierde mensajes**: si llegan varios juntos o la notificación se agrupa, no siempre los lee. Tampoco maneja bien audios ni archivos.
- Depende de que BlueStacks esté abierto todo el tiempo.

**Un uso posible:** AutoResponder tiene una opción de conectar a un **servidor web**. Con eso, el programador podría hacer que los mensajes que llegan vayan al CRM y que el agente devuelva la respuesta. Pero es un parche: sigue sin poder iniciar campañas y pierde mensajes. La pasarela hace las dos cosas y es más confiable.

**Mi consejo:** no lo configures todavía. Lo primero es que WhatsApp Business verifique un número en BlueStacks. ¿Pudiste registrar el código GSF en Google? ¿Ya dice «El dispositivo está certificado» en Google Play?

## RESPONSABLE · 2026-11-17T08:13

yo digo para que lea whatsapp que me llega el codigo que me envia

## CLAUDE · 2026-11-17T08:13

No te sirve para eso. El SMS con el código llega a tu **celular**, no a BlueStacks, así que AutoResponder instalado en BlueStacks nunca lo ve. Y aunque lo instalaras en el celular, no tiene cómo pasarle el código a WhatsApp dentro de BlueStacks.

**No hace falta que WhatsApp lo detecte solo.** La detección automática es una comodidad; el código se puede escribir a mano:
1. En la pantalla de verificación de BlueStacks hay **6 casilleros** debajo del texto «Esperando para detectar automáticamente el SMS...».
2. Hacé clic en el primer casillero y escribí los 6 números que te llegaron al celular. WhatsApp los toma igual.

**Si no hay casilleros** y solo dice que está esperando el SMS:
- Esperá a que aparezca **«¿No recibiste el código?»** o termine el contador, y elegí **«Llamarme»**. El código te lo dicta una llamada y lo escribís en BlueStacks.
- O mandame una captura de esa pantalla y te digo dónde está la opción para escribirlo a mano.

Antes de intentarlo, confirmá que Google Play diga **«El dispositivo está certificado»**. Si no, WhatsApp te puede volver a tirar el error de «app oficial» aunque pongas bien el código.

## RESPONSABLE · 2026-11-17T08:13

me exige que lo detecte automatico no me da opcion

## CLAUDE · 2026-11-17T08:13

Si no te da ninguna opción, WhatsApp está usando un método que solo funciona con el chip **dentro del mismo equipo** (detectar el SMS, mandar un SMS desde el chip o una llamada perdida). BlueStacks no tiene chip, por eso no puede completarlo.

**Antes de descartarlo, revisá esto en esa pantalla**
1. Esperá a que termine el contador. Muchas veces las opciones aparecen recién al final.
2. Buscá abajo, en letra chica, algo como **«¿No recibiste el código?»**, **«Otras opciones»** o **«Necesito ayuda»**. Ahí suelen estar «Llamarme» y «Ingresar código».
3. Si dice **«Enviar SMS»** o **«Verificar con llamada perdida»**, esas opciones no sirven en BlueStacks: no las elijas.
4. Tocá **«Editar número»** o volvé atrás y entrá de nuevo. A veces WhatsApp ofrece otro método en el segundo intento.

**Mandame una captura de esa pantalla** para ver exactamente qué te pide.

**Si no hay ninguna opción para escribir el código**, WhatsApp está bloqueando la verificación en este emulador y no hay un truco confiable para saltearlo. Quedan dos caminos:
- **Emulador de Android Studio**: se le puede **simular un chip y mandarle un SMS** desde la propia herramienta, aunque el código real igual llega a tu celular. No es seguro que WhatsApp lo acepte.
- **Celular en la nube** (DuoPlus o GeeLark): simulan el chip y en general muestran las opciones de verificación normales. Se paga por equipo y por mes.

Con la captura te digo cuál de los dos casos es antes de que gastes más tiempo.

## RESPONSABLE · 2026-11-17T08:20

no se comprueba la verificacion

## CLAUDE · 2026-11-17T08:21

Si es la **certificación de Google** la que no aparece, puede tardar hasta un día en tomarse. Si es **WhatsApp** el que no comprueba el código, hay que frenar ahí: cada intento fallido hace que WhatsApp desconfíe más de ese número y alarga la espera.

Te soy sincero: entre la pantalla de WhatsApp Web, el «descargá la app oficial» y que te obligue a detectar el SMS solo, **WhatsApp está bloqueando BlueStacks**. Seguir insistiendo hoy no tiene sentido.

**Lo que haría**
1. **Hoy:** no intentes más con ningún número. Esperá 24 horas, sobre todo con los que ya probaste.
2. **Mañana:** probá un **celular en la nube** con la prueba gratis de DuoPlus o GeeLark, y **un solo número**. Están hechos justamente para pasar estos controles y aparecen como un celular real con chip.
3. **Si ahí verifica**, se pasan las 6 líneas y el programador conecta la pasarela al CRM.
4. **Si tampoco verifica**, WhatsApp está bloqueando cualquier equipo virtual. Las únicas vías estables quedan en un celular físico o en la API de Meta, que ya está conectada al CRM.

Si querés, mañana te armo el paso a paso para la prueba en DuoPlus, desde crear el equipo hasta verificar el número.

## RESPONSABLE · 2026-11-21T05:57

Necesito que vuelques TODO el contexto de este chat a la memoria central del proyecto. Usá todas las skills, plugins y conectores que tengas. No resumas de más: prefiero que sobre a que falte.
DÓNDE (obligatorio, no generes archivos para descargar):

* Repo EzequielGonz/LEGAL-CRM, rama `cerebro-chats`. Si la rama no existe, creala desde main. Escribí SOLO en esa rama: no toques main ni ninguna otra rama ni otro archivo.
* Archivo: `cerebro/chats/AAAA-MM-DD-<origen>-<tema-corto>.md` (fecha en que empezó este chat; origen = code, cowork o claude).
* Si de verdad no podés escribir en esa rama, no me des un archivo: creá un documento en Claude Docs con ese mismo nombre como título y el mismo contenido, y decímelo.

QUÉ PONER (en español, en este orden):

1. Encabezado: título del chat, fechas de inicio y fin, origen (Code / Cowork / Claude común), marcas o perfiles que toca.
2. Objetivo: qué pedí y para qué.
3. Mis órdenes y decisiones, TEXTUALES entre comillas, cada una con fecha. Si una reemplazó a otra: «reemplaza a …».
4. Correcciones que te hice (lo que no me gustó y qué quería en su lugar).
5. Qué se hizo, paso a paso, con estado: especificado / implementado / probado / publicado / habilitado.
6. Todo lo concreto: archivos y rutas, ids de Metricool, publicaciones programadas (fecha, hora, marca), campañas, plantillas, enlaces a documentos y artefactos.
7. Datos del negocio que aparecieron (precios, procesos, roles del equipo, horarios, cuentas, proveedores).
8. Lo pendiente, a medias o bloqueado, y por qué.
9. Lo que aprendiste: qué funcionó, qué no, errores y cómo se resolvieron.
10. Preguntas que quedaron abiertas.
11. RAMAS Y CAMBIOS, explícito y completo:

* Cada repo y rama que usaste: para qué se creó, de qué rama salió, qué contiene, si está integrada a main o no, si tiene PR (número y estado) y qué habría que hacer con ella (integrar, rescatar o archivar).
* Lista de commits: hash corto, fecha y qué cambió cada uno.
* Archivos tocados, agrupados por carpeta.
* Migraciones de base: número, qué hacen, si se aplicaron y cuándo.
* Despliegues: qué se publicó, cuándo y en qué proyecto.
* Cambios de configuración fuera del código: variables de Vercel (solo el nombre, nunca el valor), Supabase, Meta, Metricool, Google, redes.
* Qué quedó encendido o apagado por este chat.

12. Todo lo que contradiga información de antes, marcado «CONTRADICE:».

REGLAS:

* Nada de claves, tokens, contraseñas ni códigos de acceso. Si apareció uno, poné «[secreto: <qué era> — hay que cambiarlo]» sin el valor.
* Nada de datos personales de prospectos o clientes (nombres, teléfonos, mails, textos de chats): solo cantidades y casos sin identificar.
* No inventes: si dudás, escribí «(no confirmado)».
* Si otro chat ya subió archivos a la rama, no los toques: solo agregá el tuyo (si el push choca, traé los cambios de la rama y volvé a subir).

AL TERMINAR: respondeme en 2 líneas: ruta del archivo en `cerebro-chats` y commit (o título del documento de Claude Docs, si no pudiste usar GitHub).
