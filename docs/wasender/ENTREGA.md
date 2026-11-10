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

## Qué no incluye todavía

- **Etapa 4:** plantillas propias, calidad estimada y estadísticas por línea.
- **Etapa 5:** campañas con Wasender.
- **Archivos mandados desde el celular:** aparecen como «[Imagen]» y no se guardan; los que manda la persona sí.
- **Producción:** sin cambios hasta que la responsable apruebe la Preview.
