# Verificar el número de una línea desde el panel · entrega 19/10/2026

Pedido de la responsable (19/10): el número +54 9 11 7250 2391 (línea MARKETING) se subió dos veces a Meta, quedó «Pendiente» y en el Administrador de WhatsApp no aparece dónde verificarlo. Rama `verificar-numero`. Sin migraciones.

## Qué incluye

- **Configuración › Líneas de WhatsApp:** en cada línea activa cuyo estado en Meta no es «Conectada» aparece el botón **«Verificar el número en Meta»**. Lista los números que Meta informa para la cuenta de la línea (identificador, estado y estado del código) y guía tres pasos: pedir el código (SMS o llamada), confirmarlo y registrar el número con un PIN de 6 dígitos.
- **Identificador del número:** marca cuál es el que la línea tiene cargado hoy y, si no coincide, indica la variable de Vercel donde cargarlo (`<PREFIJO>_PHONE_NUMBER_ID`).
- **API:** `GET /api/lineas/numero?line_id=` (solo lectura) y `POST /api/lineas/numero` (`accion`: `pedir_codigo`, `verificar`, `registrar`). Con `requireSession`. Solo actúa sobre números que figuran en la cuenta (`<PREFIJO>_WABA_ID`) de la línea. Deja un renglon en el historial de cambios sin códigos ni PIN.
- **Reglas:** el código llega al propio número, no se contacta a nadie; el código y el PIN no se guardan ni se registran; el token nunca se devuelve; los textos de error son propios.

## Qué no hace

- No cambia variables en Vercel ni redespliega: si el identificador del número no es el cargado, lo cambia la responsable o el programador.
- No envía mensajes, no lanza campañas y no toca pausas.
- Si el número está duplicado en otra cuenta de WhatsApp Business o activo en la app de WhatsApp, Meta no deja avanzar: hay que quitarlo de ese lugar primero.

## Pruebas

- Unitarias `tests/unitarias/verificar-numero.test.ts`: 6/6 con Meta simulado (validaciones, paso siguiente, llamadas correctas, solo números de la cuenta, errores en texto propio, sin token ni PIN en la respuesta). Junto con `estado-linea.test.ts`: 14/14.
- No se probó contra Meta real ni en pantalla.

## Archivos

- `src/lib/whatsapp/verificar-numero.ts` · `tests/unitarias/verificar-numero.test.ts`
- `src/app/api/lineas/numero/route.ts`
- `src/components/perfiles/verificar-numero.tsx` · `src/components/perfiles/profile-settings.tsx`
