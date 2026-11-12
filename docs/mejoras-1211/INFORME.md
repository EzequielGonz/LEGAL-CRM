# Mejoras del 12/11 · qué se probó y qué no

Versión comprobada: rama `mejoras-1211`. Producción (`main`, `a930706`) no cambió.

| Parte | Implementado | Probado | Publicado | Habilitado |
|---|---|---|---|---|
| Arreglos de Wasender | Sí | Pruebas unitarias | No (solo Preview) | No |
| Ritmo nuevo de envío | Sí | Reglas con pruebas unitarias; motor sin prueba de punta a punta | No | No |
| Verificación del número | Sí | No contra la API real | No | No |
| Recontacto sin ventana | Sí | Prueba unitaria de la regla | No | No |
| Seguimiento por Wasender | Sí | Reglas con pruebas unitarias; motor sin probar (falta 0605) | No | No (seguimiento apagado) |
| Segundo intento | Sí | Regla con pruebas unitarias; motor sin probar (falta 0605) | No | No (apagado) |
| Hoy, Chats, Contactos, Salud, ficha | Sí | Recorrida de la Preview en escritorio y celular | No | — |

- Pruebas unitarias: pasan todas menos una, «asistente: cada tipo permitido…», que ya fallaba en `main`. Una de Search Console falla de forma intermitente cuando corre toda la tanda y pasa sola.
- `npm run typecheck` y `npm run lint`: sin errores. La Preview compila en Vercel.
- No se corrieron las pruebas de integración (`tests/integracion/correr.sh`).
- No hubo ningún envío: ni a personas ni de prueba.
- La respuesta de Wasender para un número sin WhatsApp no está documentada: el código solo corta el envío si responde `exists: false`; con cualquier otra respuesta sigue como antes.
- Recorrida de la Preview (solo mirar): Hoy de los cuatro perfiles, Oportunidades, Cartera, Para recuperar, Salud, líneas y plantillas de Wasender. Sin errores de consola ni desborde. Faltó recorrer el chat abierto y el detalle de campaña.
