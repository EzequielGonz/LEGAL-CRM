# Mejoras del 12/11 · qué incluye la rama `mejoras-1211`

Pedido de la responsable (12/11): aplicar los puntos 1 a 6 de la auditoría en una Preview, sin publicar en producción, y reorganizar Hoy, Chats y Contactos. Sale de `main` en `a930706`. Nada de esto habilita envíos: se conservan la pausa general, las campañas pausadas y el seguimiento apagado.

## 1. Arreglos de Wasender
- El modo prueba ya no apaga la IA con la entrega repetida de Wasender (tres personas quedaron sin respuesta por esto).
- Los estados de entrega que llegan antes que el eco se vuelven a aplicar al emparejar; el texto de la falla nombra a Wasender.
- Si la línea se cae, sus campañas se pausan con el motivo y no se reanudan solas (por el aviso de sesión y también en el motor).
- Los interruptores de la pantalla de líneas ya no tapan el texto.

## 2. Ritmo nuevo de envío (solo campañas por Wasender; Meta no cambia)
- Calentamiento por línea: 20 por día los días 1 a 3, 40 hasta el 7, 80 hasta el 14, 150 hasta el 21 y 250 después; nunca por encima del máximo elegido. Se reinicia al volver a vincular el número.
- La plantilla de campaña necesita 4 textos distintos. Saludo con el primer nombre.
- Verificación de que el número tiene WhatsApp antes de escribirle.
- Espera irregular (una de cada diez, más larga) y hasta 20 segundos de desfase dentro del minuto.
- Freno automático: pausa si falla el 30 % o no se entrega la mitad de los últimos 20 envíos (ventana de 12 horas).

## 3. Seguimiento, recontacto y segundo intento por Wasender
- Recontacto: los chats que salen por Wasender no dependen de la ventana de 24 horas.
- Seguimiento (contactos 2 y 3): si el chat sale por Wasender, usa la plantilla propia «…_seguimiento_2/3». Mismo circuito, plazos y compuerta. Necesita la migración 0605.
- Segundo intento a quien nunca respondió (decisión del 12/11): uno solo, entre 5 y 7 días después, si el primero se entregó. Apagado por defecto. Necesita la migración 0605.
- Ocho plantillas nuevas, inactivas, con 4 textos cada una: «…_primer_contacto_v3» y «…_segundo_intento» en los cuatro perfiles (`plantillas-nuevas.sql`, ya cargadas).

## 4. Hoy, Chats y Contactos reorganizados
- **Hoy**: una sola cola «Para hacer ahora». Cada persona aparece una vez, con lo primero que hay que hacer (responder o derivar) y, si corresponde, lo segundo. En Jurídico eran 26 filas repartidas en tres listas con personas repetidas; quedan 14. Debajo, «Para mirar» y «En marcha». Se quitaron los bloques repetidos.
- **Hoy** muestra el estado de cada línea de Wasender, no dice «enviando» si la línea no puede enviar y explica el puntaje del bot.
- **Chats → Oportunidades**, **Contactos → Cartera** y **Para recuperar**: el título coincide con la pestaña; los grupos sin nadie van en un renglón; las cifras de la semana van después del trabajo; aviso de quienes esperan respuesta; la cartera vacía dice dónde está la gente.
- **Ficha**: si la persona escribió y la IA está apagada en ese chat, el siguiente paso pide responder.
- **Salud del sistema**: un control por línea de Wasender.
- **Celular**: letra mínima de 13 px, pestañas deslizables con la activa a la vista, botones más altos.

## Para aprobar y publicar
1. Aplicar `supabase/migrations/0605_wasender_seguimiento.sql` (ver `MIGRACIONES.md`).
2. Pasar `mejoras-1211` a `main`.
3. Revisar y activar las plantillas nuevas que sirvan.
4. Recién después: reconectar la línea, reanudar la campaña a mano y, si se quiere, prender el segundo intento por perfil.
