# Wasender · entrega de las etapas 1 a 3

10/11/2026. Rama `wasender-integracion`. El análisis previo está en `ANALISIS.md`.

## Qué incluye

**Etapa 1: envío por la línea correcta**
- Módulo propio en `src/lib/wasender/`.
- Cuando la persona escribió por última vez por una línea de Wasender, la respuesta sale por esa línea. Vale para el bot, el chat manual, las citas y el recontacto.
- Si escribió por Meta, sale como siempre. En `messaging.ts` solo se agregó la pregunta y el envío por Wasender; el bloque de Meta quedó igual.
- Si la línea de Wasender está apagada, desconectada o archivada, no sale nada y el chat dice por qué. Nunca se pasa sola a otra línea.
- Interruptor general `WASENDER_HABILITADO`: sin él no sale nada por Wasender.

**Etapa 2: sección «Wasender» debajo de Campañas, en los cuatro perfiles**
- Arriba muestra qué falta configurar en Vercel, solo por nombre y sin valores.
- **Agregar línea:** nombre, número y área. Se crea en Wasender:
  - con protección de cuenta (1 mensaje cada 5 s);
  - sin guardar mensajes en Wasender;
  - sin grupos ni difusiones.
- **Al crearse la línea:**
  - queda apagada y en modo prueba;
  - su clave y su secreto se guardan cifrados.
- **Números de Meta:** si el número figura como línea de Meta, la pantalla pide confirmar que ya se eliminó de Meta (en WhatsApp Manager) antes de agregarlo. La confirmación queda en `ops_change_log`. Así se pueden pasar números de Meta a Wasender sin escanear por error uno que sigue en Meta.
- **QR:** «Conectar con QR» muestra el QR como imagen. La pantalla consulta el estado cada 4 s hasta que la línea queda conectada.
- **Interruptores de cada línea:** «Envía mensajes», «Responde el bot» y «Modo prueba».
- **Otras acciones:** desconectar y archivar con motivo. No se borra nada.
- **Base de datos:** migración `0600_wasender`, aplicada y verificada. Ver `MIGRACIONES.md`.

**Etapa 3: webhook propio, `/api/webhooks/wasender?linea=<id>`**
- **Firma:** sin la firma de la línea no se procesa nada y queda retenido en `wasender_eventos`.
- **Mensajes de una persona:** siguen el mismo camino que los de Meta (`handleInboundMessage`, sin cambios): contacto (el mismo si el número ya existe), oportunidad, chat y bot con su conocimiento v1 y v2.
- **Estados de entrega:** se guardan con la misma función que Meta.
- **Archivos recibidos:** se bajan en el momento y se guardan en el mismo almacenamiento privado, así el chat los abre como siempre.
- **Eco de lo que manda el panel:** se empareja con su envío, así no se duplica.
- **Mensajes escritos desde el celular:** aparecen en el chat y el chat queda tomado por una persona.
- **Modo prueba** (pedido del 10/11):
  - entre mensaje y mensaje, el chat queda en atención humana;
  - cuando la persona escribe, vuelve a la IA, el bot responde y el chat se vuelve a tomar;
  - si una persona tomó el chat a mano, se respeta.
  - Así el recontacto de producción no le escribe por Meta a un chat de prueba.

## Cómo se usa

1. **En Vercel**, entorno Preview: `WASENDER_PAT`, `WASENDER_CLAVE_CIFRADO` y el bypass para automatización. `WASENDER_HABILITADO` ya está cargada solo para esta rama.
2. **Redeploy:** las variables nuevas valen desde el próximo despliegue de la Preview.
3. **Preview de la rama:**
   1. Entrar a «Wasender».
   2. «Agregar línea» con un chip nuevo.
   3. «Conectar con QR» y escanear desde WhatsApp → Dispositivos vinculados.
4. **Encender:** con la línea conectada, prender «Envía mensajes». «Responde el bot» viene prendido.
5. **Probar** escribiéndole al chip desde otro celular propio. Nunca a terceros.

## Bloque 1: plantillas propias (10/11)

La responsable decidió pasar todo a Wasender, con los números al final.
- **Pestaña «Plantillas»** en la sección Wasender, con:
  - las variables `{{nombre}}`, `{{asesor}}` y `{{marca}}`;
  - variantes del mismo mensaje;
  - vista previa;
  - archivo con motivo.
- **Copia de las plantillas aprobadas de Meta** para los cuatro perfiles, con un botón. Sin los avisos internos ni la de ejemplo.
  - Las variables se traducen según la asignación de la plantilla. Si no tiene asignación, se deducen por el texto («Hola {{n}}», «soy {{n}}», «de {{n}}»).
  - Lo que no se puede deducir, como la hora de un turno, queda «[revisar n]» y la plantilla queda inactiva.
  - Los botones de respuesta rápida pasan a «Respondé: …».

## Paso a producción (10/11)

La responsable pidió pasar todo a producción para seguir desde el panel real.
- **Código:** la rama `wasender-integracion` se integró en `main` sin conflictos (avance directo).
- **Base:** sin cambios nuevos. `0600` y `0601` ya estaban aplicadas en la base compartida.
- **Variables en Vercel para producción:**
  - `WASENDER_PAT` y `WASENDER_CLAVE_CIFRADO` las carga la responsable.
  - La clave de cifrado tiene que ser **la misma** que en la Preview, si no las claves de las líneas ya guardadas no se pueden leer.
  - `WASENDER_HABILITADO=true` habilita el envío en general, pero cada línea sigue apagada hasta que se prenda «Envía mensajes».
- **Botón «Recibir en este panel»:** una línea conectada desde la Preview le sigue avisando a la Preview. La pantalla lo detecta y ofrece el botón, que le pasa a Wasender la dirección de producción. No toca la conexión, el QR ni los interruptores, y queda en `ops_change_log`.
- **Pausas:** se conservan la pausa general, los agentes, campañas y seguimiento como estaban. Las líneas de Meta funcionan igual.

## Bloque 3: campañas por Wasender (10/11)

Pedido de la responsable: la creación, la configuración y el algoritmo de envío son los mismos que con Meta; solo cambia el método de envío.
- **«Método de envío»** en «Preparar una campaña»: Meta, como siempre, o Wasender. Con Wasender se elige una línea de Wasender y una plantilla propia en vez de la línea y la plantilla de Meta.
- **Lo que no cambia:** base, nombre, rol del bot, ritmo, días, horario y límite diario. Con Wasender se elige la línea y la plantilla propia; lo demás es igual.
- **El mismo motor** (`src/lib/campaigns.ts`). La campaña de Wasender usa el mismo tick, bloqueo, reserva atómica del destinatario, prioridad, detenidos, revalidación antes de enviar, espera al azar entre mínimo y máximo, lotes con pausa, límite diario de la campaña, días, horario y calendario. Las ramas nuevas son solo cuatro:
  - **Antes de lanzar y en cada vuelta:** se comprueban la línea de Wasender (conectada, con «Envía mensajes» prendido, con clave y del perfil) y la plantilla propia (activa, del perfil y sin «[revisar]»).
  - **Envío:** por la línea de Wasender, con la variante que le toca a esa persona y sus datos (`{{nombre}}`, `{{asesor}}`, `{{marca}}`).
  - **Errores:** se clasifican con las mismas categorías que Meta.
    - Si el problema es de la línea, el envío queda pendiente y la campaña se pausa.
    - Si Wasender pide esperar, el envío vuelve a la cola.
    - Si no se sabe si salió, queda para revisión y no se reenvía solo.
    - Si el número no tiene WhatsApp, queda como fallido.
  - **Registro:** en el chat queda el texto real que recibió la persona, el chat queda asociado a la línea de Wasender y la respuesta de la persona vuelve por esa línea con el bot.
- **Máximo por día de cada línea de Wasender:** botón «Máximo por día» en la tarjeta de la línea. Suma todas sus campañas, igual que el límite de las líneas de Meta.
- **Estados:** cuando Wasender confirma el envío, el destinatario guarda ese id, así entregado, leído y respondió llegan a las estadísticas de la campaña.
- **Eco de la campaña:** si el aviso de «enviado» llega antes de que se guarde el mensaje, no se toma como escrito desde el celular y el chat no pasa a atención humana.
- **Base:** migración `0602_wasender_campanas`. Ver `MIGRACIONES.md`.
- **Pendiente para después** (lo pidió la responsable): rotación de plantillas.

## Qué no incluye todavía

- **Etapa 4:** calidad estimada y estadísticas por línea.
- **Archivos mandados desde el celular:** aparecen como «[Imagen]» y no se guardan; los que manda la persona sí.
