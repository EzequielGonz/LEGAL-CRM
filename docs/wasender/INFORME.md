# Wasender · informe de las etapas 1 a 3

10/11/2026. Rama `wasender-integracion`.

| Estado | Qué | Versión comprobada |
| --- | --- | --- |
| Especificado | `ANALISIS.md` y documento de la responsable | `07a023d` |
| Implementado | Etapas 1 a 3 (ver `ENTREGA.md`) | último commit de la rama |
| Probado | Pruebas automáticas con Wasender simulado (abajo) | último commit de la rama |
| Publicado | Solo en la Preview de la rama. `main` y producción sin cambios | — |
| Habilitado | Nada. Las líneas nacen apagadas; `WASENDER_HABILITADO=true` solo en la Preview de esta rama | — |

## Qué se probó

- **Tipos:** `npm run typecheck` y `tsc -p tests/tsconfig.json` sin errores.
- **Lint:** `npm run lint` sin avisos.
- **Build:** `npm run build` correcto. Aparecen `/wasender`, `/api/wasender/lineas/*` y `/api/webhooks/wasender`.
- **Pruebas unitarias:** 336 de 337. La que falla ya fallaba en `main` antes de este trabajo y no tiene relación: «asistente: cada tipo permitido…», que espera 8 tipos y encuentra 15.
- **Pruebas nuevas de Wasender:** 27 de 27. Cubren:
  - cifrado;
  - firma;
  - cuerpos de la API;
  - reintento por espera;
  - traducción de eventos (texto, `@lid`, grupos, archivos, propios y estados);
  - regla de salida;
  - línea no disponible;
  - envío completo;
  - modo prueba;
  - estados y QR;
  - dirección del webhook en Preview y producción;
  - configuración sin valores;
  - eco;
  - webhook con firma inválida y válida.
- **Pruebas actualizadas:** dos pruebas del menú, por la sección nueva.
- **Auditoría** (`npm audit --omit=dev`): los mismos 4 avisos que antes (next, postcss, source-map-js y xlsx). La librería nueva, `qrcode-generator` 1.4.4, no suma ninguno.
- **Base:**
  - migración aplicada y verificada con consultas de solo lectura;
  - asesor de seguridad sin avisos nuevos (las tablas nuevas tienen el mismo aviso informativo que las demás: RLS sin políticas, acceso solo por servidor).

## Qué no se probó

- **Llamadas reales a Wasender:** crear la línea, el QR, enviar, el webhook real y descifrar archivos. Requieren las variables de Vercel y un chip conectado.
- **Lo que la documentación de Wasender no aclara** se confirma en la prueba real:
  - si el id del eco coincide con el `msgId`;
  - los reintentos del webhook;
  - si llegan los mensajes escritos desde el celular;
  - cuánto dura el QR.
- **Pruebas de integración** (`tests/integracion/correr.sh`): necesitan Docker, que esta sesión no tiene.
- **Revisión visual** de la pantalla en la Preview: la Preview pide el PIN del panel.

## Riesgos que siguen

- Wasender no es oficial: puede bloquear el número. Por eso se usan solo chips nuevos.
- Durante la prueba, producción ve los chats de prueba. El modo prueba los deja en atención humana para que el recontacto de producción no les escriba.
