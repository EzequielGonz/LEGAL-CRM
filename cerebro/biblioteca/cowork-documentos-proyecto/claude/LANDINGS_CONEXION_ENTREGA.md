# Landings: formularios por correo y cambios de las 4 páginas (20/10)

Rama `landings-conexion`. Sin migraciones. No envía mensajes a personas ni inicia campañas.

## Qué cambia en el CRM

- `POST /api/landing` (la ruta que ya reciben las 4 landings) ahora, después de guardar la consulta, **avisa por correo** a la casilla del rubro:

| Perfil / área | Casilla |
|---|---|
| Jurídico (`civil`, `penal`) | estudiojuridicointegralvita@gmail.com |
| Agencia 0 km (`agencia_0km`) | autoskocos@hotmail.com |
| Coberturas (`coberturas_medicas`) | comparatuobrasocial@hotmail.com |
| Marketing (`marketing`) | agenciakocos@hotmail.com |

- El aviso es secundario: si falla o no hay clave, la consulta igual queda guardada y la landing recibe «ok». No se registran datos del contacto en los logs.
- Archivos: `src/lib/landing-email.ts` (nuevo, funciones puras + envío por Resend con `fetch`), `src/app/api/landing/route.ts` (un bloque nuevo antes de la plantilla de continuidad), `tests/unitarias/landing-email.test.ts` (5 pruebas).
- Sin `RESEND_API_KEY` o sin `LANDING_EMAIL_FROM` **no se envía nada** (queda un aviso en el log). Hasta cargarlas, el código publicado no cambia el comportamiento actual.

## Pasos para activarlo (programador y responsable)

1. Responsable: crear cuenta en resend.com (plan gratuito, hasta 3.000 correos por mes). Sin tarjeta; si el servicio pidiera un pago, no se contrata sin autorización.
2. Verificar un dominio propio en Resend (por ejemplo `kocosmkt.com`) y cargar en Vercel DNS los registros que indica (SPF, DKIM y, si lo pide, MX/TXT de retorno). Pedir a Claude que los cargue es posible: tiene acceso a Vercel DNS.
3. Crear una clave de API en Resend. **Pegarla solo en Vercel**, no en el chat.
4. En Vercel (proyecto `legal-crm`, Production): `RESEND_API_KEY` = la clave, `LANDING_EMAIL_FROM` = `Avisos <avisos@kocosmkt.com>` (el remitente del dominio verificado). Redeploy.
5. Probar con un formulario real de una landing (ver pruebas). Revisar la carpeta de spam de Hotmail la primera vez y marcar como seguro.

## Mensajes prearmados e identificación del origen

- Todos los botones de WhatsApp de las landings abren el número del CRM del rubro con un texto que lleva una frase fija y, si se conoce, «(llegué desde Instagram/Facebook/Google/TikTok)». El CRM ya sabe leer eso (`src/lib/fuente.ts`).
- **Falta en el panel**: cargar en cada perfil, como textos identificadores con fuente «Landing», estas frases: «desde la web de Estudio Jurídico Vita», «desde la web de Agencia Kocos», «desde la web de Compara Tu Obra Social» y «desde la web de Kocos Marketing». Sin eso el chat entra, pero la fuente queda «No informada».
- Para las redes: usar en cada biografía el enlace con origen del panel (`?origen=instagram` o `?origen=facebook`).

## Landings

Viven en Hostinger Horizons y no están en este repositorio. Los cambios van como prompts listos en `PROMPTS_LANDINGS.md` (marca Vita, CTA de WhatsApp, formularios conectados, redes, header y animaciones de Coberturas). Cada landing se aplica y se revisa por separado.

## Puntos a confirmar antes de publicar

1. **Números**: se usaron las líneas cargadas en el CRM con prefijo 549 + 11. Confirmar que son los que se quieren mostrar. La landing de Kocos Marketing hoy muestra 223 522-3906; por decisión del dueño pasa a 11 7250-2391.
2. **Línea de Marketing en Meta**: la línea de Agencia Kocos figuraba «Pendiente» en Meta (ver CONTEXTO_ACTUAL_CRM.md). Un botón de WhatsApp a un número no verificado no recibe bien los mensajes: verificarlo antes de mover tráfico.
3. **Dominio del formulario**: las landings enviarán a `https://legal-crm-nine.vercel.app/api/landing`. El proyecto tiene la protección de Vercel activa «all_except_custom_domains». Si esa URL pide ingreso de Vercel, el envío falla desde las landings. Probar con un `OPTIONS`/`POST` desde el navegador de una landing o asignar un dominio propio al panel. **No se pudo probar desde la sesión.**
4. **Campo `llegada`**: el CRM lo lee del cuerpo del formulario; el módulo de los prompts lo envía.
5. **Redes**: recibidas el 20/10 (Instagram y Facebook de las 4 marcas, ya incluidos en `LANDINGS_PROMPTS.md`). Metricool informa para Kocos Marketing la página de Facebook con id 1289873537553126, distinta de la que figura en el enlace recibido (61595100234671): confirmar que es la misma página antes de programar contenido.

## Evidencia

1. Implementado: sí, en la rama.
2. Desplegado: **no** (sin PR fusionado; sin Preview verificada desde la sesión).
3. Comprobado automáticamente: 5 pruebas nuevas de `landing-email` pasan con el ejecutor de Node (destinos, asunto sin saltos de línea, escape de HTML, sin clave no envía, envío a Resend y fallos sin excepción). La suite completa, el typecheck y el lint **no se corrieron** (sin npm ni clon del repositorio en la sesión): los corre el programador o la Preview de Vercel.
4. Revisado visualmente: no aplica al CRM; las landings no se tocaron todavía.
5. Probado funcionalmente: **no** (sin envío real de correo ni de formulario).

Rollback: revertir el PR, o dejar vacías `RESEND_API_KEY` y `LANDING_EMAIL_FROM` para apagar el aviso sin cambiar código.
