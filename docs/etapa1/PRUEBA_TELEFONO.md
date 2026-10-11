# Etapa 1 — Procedimiento de prueba en un teléfono real (bloque 1.9)

Lo que solo se puede comprobar con un teléfono en la mano. Ninguno de estos
pasos envía mensajes a prospectos: la pausa general sigue activa, la
campaña de prueba no tiene destinatarios reales y los pasos 6 y 7 usan un
teléfono propio.

## Antes de empezar

- La versión nueva está publicada y se ingresa con el PIN.
- Para el paso 5 (avisos web), las claves de avisos están cargadas en Vercel
  (Configuración → Avisos web → "Generar claves", copiar `VAPID_PUBLIC_KEY` y
  `VAPID_PRIVATE_KEY` a Vercel como variables de Producción sensibles y volver a publicar).
- Un archivo de prueba (CSV o Excel) con estas filas, **todas con números ficticios**:

  | Nombre | Teléfono |
  |---|---|
  | Prueba Uno | 11 9990-0001 |
  | Prueba Dos | 011 15 9990-0002 |
  | Prueba Uno bis | 1199900001 |
  | Sin teléfono | |
  | Número corto | 12345 |

## 1. Instalar el panel

1. Abrir la dirección del panel en el teléfono e ingresar con el PIN.
2. Elegir **Teléfono**.
3. Android (Chrome): botón **Instalar el panel en este teléfono** o menú → *Instalar app*.
   iPhone/iPad (Safari): **Compartir** → **Agregar a pantalla de inicio**.
4. Abrir el panel desde el ícono. Debe verse a pantalla completa, con los perfiles.

Esperado: cada perfil con su nombre y sus tres accesos (Iniciar campaña, Clientes cerrados, Estadísticas).

## 2. Iniciar campaña: cargar no envía

1. Perfil **Agencia 0KM** (hoy no tiene datos, así los 2 contactos ficticios no se mezclan con
   Jurídico; el sistema no borra contactos) → **Iniciar campaña** → elegir el archivo de prueba.
2. Revisar lo que muestra antes de guardar: nombre del archivo y hoja, 5 filas,
   columnas propuestas (Teléfono y Nombre), validación: 3 utilizables, 1 repetida
   en el archivo, 2 que requieren corrección (con su motivo).
3. **Guardar base (no envía mensajes)**.
   Esperado: "2 nuevos + 1 duplicado + 2 inválidos = 5 (coincide con las 5 filas)" y "No se envió ningún mensaje".
4. Volver a cargar **el mismo archivo**. Esperado: avisa que ya se importó y ofrece ver esa base; no la duplica.
5. En la base guardada: elegir **Crear una campaña nueva**, nombre "PRUEBA TELÉFONO",
   el canal que aparezca y línea "asignar después". La plantilla dice "Elegí primero la línea"
   (se elige del catálogo; un nombre escrito a mano ya no cuenta como aprobado).
   Esperado: campaña creada en borrador con 2 destinatarios; no se envió nada.
6. Paso **Iniciar la campaña**: debe listar lo que falta (pausa general activa,
   línea sin asignar, plantilla aprobada del catálogo, nombres del perfil si faltan) y el botón
   **Confirmar e iniciar** debe estar deshabilitado.

Comprobación en la computadora (panel de Agencia 0KM): Campañas → "PRUEBA TELÉFONO" en borrador
con 2 pendientes y 0 mensajes enviados; Bases → la base de prueba con su resumen y su calidad.
Después, **Archivar** la campaña y la base de prueba.

## 3. Clientes cerrados

1. Perfil Jurídico → **Clientes cerrados**. Hoy no hay captados: debe decir
   "No hay clientes en esta vista" (no muestra cifras de ejemplo).
2. Cuando exista el primer captado: abrirlo, ver la ficha completa y los datos faltantes,
   tocar **Compartir…** (se abre el menú del teléfono) y cancelar.
   Esperado: sigue en **No derivado**. Derivado se marca solo con **Marcar Derivado**.

## 4. Estadísticas

1. Perfil Jurídico → **Estadísticas**.
2. Esperado para la campaña "BASE 21 9": 925 prospectos, 725 pendientes, 200 mensajes enviados,
   10 personas que responden; las mismas cifras que en la computadora (Campañas → detalle).
3. Las cifras del perfil coinciden con Estadísticas en la computadora.

## 5. Avisos web

1. En la pantalla Teléfono → **Avisos en este teléfono** → poner un nombre (por ejemplo "Teléfono de Vita")
   → **Activar avisos** → aceptar el permiso.
   En iPhone, solo funciona abriendo el panel desde el ícono instalado (iOS 16.4 o posterior).
2. **Enviar aviso de prueba**. Esperado: llega la notificación "Aviso de prueba".
3. Cerrar el panel y, desde la computadora (Configuración → Avisos web → **Probar** en ese dispositivo),
   enviar otro. Esperado: llega con el panel cerrado. Al tocarlo se abre el panel (si la sesión
   se cerró, pide el PIN y continúa).
4. **Desactivar en este dispositivo**. Esperado: en Configuración figura desactivado y ya no recibe avisos.

## 6. Archivos que manda una persona (después de publicar en producción)

En Preview no se puede probar: Meta manda los mensajes solo a la dirección de producción.
Hacelo desde **un teléfono propio** (no de un prospecto), escribiendo a la línea de Civil o Penal.

1. Mandá un audio de voz, una foto y un PDF.
2. En el Inbox, en esa conversación: el audio tiene reproductor y "Escuchar audio"; la foto, "Ver foto";
   el PDF, "Abrir documento". Al tocarlos se abren en una pestaña nueva (el enlace vence a los pocos minutos).
3. En la ficha del contacto, sección **Archivos que mandó**: los tres con su estado "Guardado".
4. Esperado: **nadie responde nada** (sin transcripción ni respuesta automática; la pausa general sigue activa)
   y no sale ningún mensaje.
5. Revisión → **Archivos sin guardar**: vacío. Si alguno quedó sin guardar, "Guardar ahora" (Meta lo deja descargar 7 días).
6. Copiá la dirección del enlace "Abrir documento" (la del panel, `/api/adjuntos/...`) y abrila en una ventana
   privada sin sesión: debe responder "Sesión requerida" y no mostrar el archivo. La dirección del
   almacenamiento a la que lleva el enlace, una vez abierto, vence a los 2 minutos.

## 7. Respuesta manual e IA (después de publicar)

1. Desde el Inbox, respondé a mano a tu teléfono de prueba.
2. Esperado: el mensaje llega; la conversación queda con la IA apagada y en "Requiere atención humana"
   (se apaga **antes** de enviar); el mensaje muestra Enviado → Entregado → Leído sin recargar la página.

## Qué informarme

Para cada paso: si se vio lo esperado, y una captura si algo no coincide (modelo de teléfono y navegador).
