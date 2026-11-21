# Cambios de las 4 landings · prompts para Hostinger Horizons

Fecha: 20/10/2026. Cada bloque se pega en el editor de Horizons de esa landing, de a uno. Los datos salen de las respuestas de la responsable y del CRM; no queda ningún dato pendiente en este documento.

## Datos comunes

| Rubro | Dominio | Perfil del CRM | WhatsApp (formato wa.me) | Correo de aviso |
|---|---|---|---|---|
| Estudio Jurídico Vita | estudiojuridicovita.com | `juridico` | 5491138582311 | estudiojuridicointegralvita@gmail.com |
| Agencia Kocos (0 km) | autoskocos.com | `agencia_0km` | 5491140674772 | autoskocos@hotmail.com |
| Compara Tu Obra Social | comparatuobrasocial.com | `coberturas_medicas` | 5491172900587 | comparatuobrasocial@hotmail.com |
| Kocos Marketing | kocosmkt.com | `marketing` | 5491172502391 | agenciakocos@hotmail.com |

- Los números son los de las líneas cargadas en el CRM (1138582311, 1140674772, 1172900587 y 1172502391), escritos con 549 + característica 11. **Confirmar que son CABA/GBA y que son los números que se quieren mostrar.** La landing de Kocos Marketing hoy muestra otro número (223 522-3906); por decisión de la responsable pasa a ser el del CRM.
- Redes (enviadas por la responsable el 20/10):

| Marca | Instagram | Facebook |
|---|---|---|
| Estudio Jurídico Vita | https://www.instagram.com/estudiojuridicovita/ | https://www.facebook.com/profile.php?id=61594866784547 |
| Agencia Kocos (0 km) | https://www.instagram.com/autoskocos/ | https://www.facebook.com/profile.php?id=61594687512414 |
| Compara Tu Obra Social | https://www.instagram.com/comparatuobrasocial/ | https://www.facebook.com/profile.php?id=61594606546289 |
| Kocos Marketing | https://www.instagram.com/kocosmkt/ | https://www.facebook.com/profile.php?id=61595100234671 |
- Los formularios envían al CRM: `https://legal-crm-nine.vercel.app/api/landing?perfil=<perfil>`. El programador confirma que ese dominio responde sin ingreso de Vercel (ver ENTREGA.md).

## Pieza común (pegar primero en cada landing)

> Agregá este módulo al sitio y usalo en todos los botones de WhatsApp y en el envío de formularios. No cambies el diseño de la página.

```js
const ORIGENES = { instagram: "Instagram", facebook: "Facebook", google: "Google", tiktok: "TikTok" };

// Red desde la que llegó la visita: ?origen=instagram|facebook|google|tiktok o, si no, el referrer.
export function origenVisita() {
  try {
    let o = (new URLSearchParams(window.location.search).get("origen") || "").toLowerCase();
    if (!ORIGENES[o]) {
      const ref = (document.referrer || "").toLowerCase();
      o = ref.includes("instagram.com") ? "instagram"
        : ref.includes("facebook.com") || ref.includes("fb.com") ? "facebook"
        : ref.includes("google.") ? "google"
        : ref.includes("tiktok.com") ? "tiktok" : "";
    }
    if (ORIGENES[o]) { window.sessionStorage.setItem("origen", o); return o; }
    const guardado = window.sessionStorage.getItem("origen");
    return ORIGENES[guardado || ""] ? guardado : null;
  } catch { return null; }
}

// Enlace de WhatsApp con mensaje prearmado; agrega «(llegué desde X)» si se conoce la red.
export function enlaceWhatsApp(numero, mensaje) {
  const o = origenVisita();
  const texto = o ? `${mensaje} (llegué desde ${ORIGENES[o]})` : mensaje;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

// Envío al CRM. Devuelve true si se guardó; si falla, mostrar el error y dejar el botón de WhatsApp.
export async function enviarFormulario(perfil, datos) {
  const r = await fetch(`https://legal-crm-nine.vercel.app/api/landing?perfil=${perfil}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...datos, origen: window.location.pathname, llegada: origenVisita() }),
  });
  if (!r.ok) throw new Error("No se pudo enviar");
  return true;
}
```

Campos que acepta el CRM: `nombre`, `apellido`, `telefono`, `email`, `tipo` (qué busca), `descripcion` (todo lo demás, una respuesta por línea con su pregunta), `origen` y `llegada`. Los campos extra de cada formulario van dentro de `descripcion`; el CRM no guarda campos sueltos que no conoce.

## Google Analytics 4 (IDs recibidos el 20/10)

| Landing | ID de medición |
|---|---|
| Estudio Jurídico Vita | G-R1RL5L36L5 |
| Agencia Kocos (0 km) | G-PKGLJLZGNG |
| Compara Tu Obra Social | G-6JPYRX8218 |
| Kocos Marketing | G-1381XE2GJ4 |

> En cada landing, pegá el código de seguimiento de Google (gtag.js) con su ID en el `<head>` de todas las páginas, una sola vez. Después agregá los eventos de abajo.

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Reemplazar `G-XXXXXXXXXX` por el ID de esa landing. Eventos para medir de dónde viene cada contacto:

```js
// Usar junto con el módulo de arriba.
export function medir(evento, params = {}) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", evento, { red_origen: origenVisita() || "directo", pagina: window.location.pathname, ...params });
    }
  } catch {}
}
// Al hacer clic en cualquier botón de WhatsApp: medir("clic_whatsapp", { boton: "hero" | "header" | "pie" | "flotante" })
// Al enviar el formulario con éxito:            medir("formulario_enviado", { formulario: "home" | "interna" })
// Al hacer clic en un CTA que lleva al formulario: medir("clic_cta_formulario", { boton: "texto del botón" })
```

En Analytics, marcar `clic_whatsapp` y `formulario_enviado` como eventos clave (conversiones). Sin datos personales en los eventos: no enviar nombre, teléfono, correo ni el texto de la consulta.

## Mensajes prearmados (uno por rubro y página)

Cada mensaje lleva una frase fija que el CRM usa para identificar la landing. Esas frases se cargan en el perfil del CRM como textos identificadores con fuente «Landing» (Configuración, mensajes prearmados) y no se cambian sin avisar.

| Rubro | Frase fija (identificador) | Mensaje de la home |
|---|---|---|
| Jurídico | desde la web de Estudio Jurídico Vita | Hola, quiero hacer una consulta. Escribo desde la web de Estudio Jurídico Vita |
| 0 km | desde la web de Agencia Kocos | Hola, quiero consultar por un 0 km. Escribo desde la web de Agencia Kocos |
| Coberturas | desde la web de Compara Tu Obra Social | Hola, quiero que me asesoren sobre prepagas y obras sociales. Escribo desde la web de Compara Tu Obra Social |
| Marketing | desde la web de Kocos Marketing | Hola, quiero consultar por un proyecto para mi marca. Escribo desde la web de Kocos Marketing |

En páginas internas se cambia la primera oración y se conserva la frase fija, por ejemplo: «Hola, leí la guía de accidentes de tránsito y quiero consultar mi caso. Escribo desde la web de Estudio Jurídico Vita». Con origen conocido queda «… (llegué desde Instagram)».

---

## 1. Estudio Jurídico Vita (estudiojuridicovita.com)

```
Cambios puntuales, sin tocar el diseño general:

1) Marca. El nombre «Estudio Jurídico Vita» tiene que aparecer en varios lugares, como nombre principal:
- Logo del header: texto «Estudio Jurídico Vita» (hoy dice solo «Estudio Jurídico»).
- Hero: una línea chica sobre el título con «Estudio Jurídico Vita».
- Sección «Nuestro enfoque» y «Cómo trabajamos»: mencionar «En Estudio Jurídico Vita…» en al menos un párrafo de cada una (sin agregar promesas ni resultados).
- Bloque de contacto: «Escribinos a Estudio Jurídico Vita».
- Pie: «© 2026 Estudio Jurídico Vita. Todos los derechos reservados.»
- Título de la pestaña de la home: «Abogados de accidentes de tránsito y laborales | Estudio Jurídico Vita». En las páginas internas (accidentes de tránsito, accidentes laborales, guías, calculadora), el título termina en «| Estudio Jurídico Vita».
- Meta description, og:site_name y datos estructurados (nombre de la organización): «Estudio Jurídico Vita».
- Alt del logo: «Logo de Estudio Jurídico Vita».
Usá «Vita Abogados» solo como apoyo en algún texto, nunca como nombre principal.

2) WhatsApp. Todos los botones «Consultar por WhatsApp» (hero, contacto, pie y páginas internas) hoy no tienen número. Que abran https://wa.me/5491138582311?text=<mensaje> con el módulo enlaceWhatsApp. Mensaje de la home: «Hola, quiero hacer una consulta. Escribo desde la web de Estudio Jurídico Vita». En /accidentes-de-transito: «Hola, leí la guía de accidentes de tránsito y quiero consultar mi caso. Escribo desde la web de Estudio Jurídico Vita». En /accidentes-laborales: «Hola, quiero consultar por un accidente laboral. Escribo desde la web de Estudio Jurídico Vita».

3) Formularios («Enviar consulta» y «Quiero que me contacten»): usar enviarFormulario("juridico", {...}) con nombre, apellido, telefono, email, tipo (el select) y descripcion. Al enviar, mostrar «Recibimos tu consulta. Te contactamos a la brevedad.»; si falla, mostrar «No pudimos enviarla. Escribinos por WhatsApp» con el botón.

4) Redes. En el pie, íconos con enlace a Instagram (https://www.instagram.com/estudiojuridicovita/) y Facebook (https://www.facebook.com/profile.php?id=61594866784547).

Google Analytics: instalar el código con el ID G-R1RL5L36L5 en todas las páginas y agregar los eventos clic_whatsapp, clic_cta_formulario y formulario_enviado (ver sección «Google Analytics 4»). Abrir en pestaña nueva con rel="noopener noreferrer" y aria-label.
```

## 2. Agencia Kocos · 0 km (autoskocos.com)

```
Sin tocar el diseño general:

1) WhatsApp. Los botones «Consultar por WhatsApp» (header, hero y secciones) hoy no tienen enlace. Que abran https://wa.me/5491140674772?text=<mensaje> con enlaceWhatsApp. Home: «Hola, quiero consultar por un 0 km. Escribo desde la web de Agencia Kocos». En /financiacion/plan-de-ahorro: «Hola, quiero consultar por un plan de ahorro. Escribo desde la web de Agencia Kocos». En /financiacion: «Hola, quiero consultar por financiación. Escribo desde la web de Agencia Kocos».

2) Formulario «Hacé tu consulta»: conectarlo con enviarFormulario("agencia_0km", {...}): nombre, apellido, telefono, tipo = «¿Qué estás buscando?» y descripcion con una línea por respuesta (unidad que le interesa, anticipo, usado para entregar, cuándo quiere cambiar, consulta). Agregar un campo Email opcional. Mismo mensaje de éxito y de error que el resto.

3) Redes en el pie con íconos a Instagram (https://www.instagram.com/autoskocos/) y Facebook (https://www.facebook.com/profile.php?id=61594687512414).

Google Analytics: instalar el código con el ID G-PKGLJLZGNG en todas las páginas y agregar los eventos clic_whatsapp, clic_cta_formulario y formulario_enviado (ver sección «Google Analytics 4»).
```

## 3. Compara Tu Obra Social (comparatuobrasocial.com)

```
Sin cambiar el estilo general:

1) WhatsApp. Los «Consultar por WhatsApp» hoy apuntan a #contacto. Cambiarlos para que abran https://wa.me/5491172900587?text=<mensaje> con enlaceWhatsApp. Home: «Hola, quiero que me asesoren sobre prepagas y obras sociales. Escribo desde la web de Compara Tu Obra Social». En /prepagas: «Hola, quiero comparar prepagas. Escribo desde la web de Compara Tu Obra Social». En /obras-sociales: «Hola, quiero consultar por obras sociales. Escribo desde la web de Compara Tu Obra Social».
Agregar el botón «Consultar por WhatsApp» además en: el hero (junto al CTA actual), al final de «Cómo funciona», al final de «Preguntas frecuentes», en cada página de /prepagas y /obras-sociales, y en el pie. Los demás CTA («Quiero asesorarme», etc.) siguen llevando al formulario.

2) Botón de WhatsApp del header, más visible. Dejarlo como botón sólido con el color de acento que ya usa la landing, ícono de WhatsApp a la izquierda, texto en blanco con contraste de al menos 4,5:1, borde redondeado, sombra suave y, al pasar el mouse, una leve elevación. En celular, además del header, un botón flotante de WhatsApp abajo a la derecha, que no tape el contenido ni el formulario.

3) Header con la sección activa marcada. El ítem de la página actual (Inicio, Prepagas, Obras sociales) queda con subrayado de 2 px en el color de acento. En la home, el ítem activo cambia según la sección visible (Inicio, Cómo funciona, Preguntas frecuentes, Contacto). Al pasar el mouse, el subrayado aparece con una transición de 200 ms. Todos los ítems con estado de foco visible para teclado.

4) Animaciones más suaves. Reemplazar las actuales por una sola: aparecer con desplazamiento vertical corto (16 a 24 px) y opacidad, de 400 a 500 ms con easing suave, una única vez cuando el bloque entra en pantalla (IntersectionObserver), con un retraso escalonado de máximo 80 ms entre elementos de una misma fila. Sin parallax, sin rebotes ni rotaciones, sin animar el texto letra por letra. Respetar prefers-reduced-motion: sin animación. Que nada salte de lugar al cargar (reservar el alto de imágenes).

5) Formulario «Quiero recibir asesoramiento»: dejar el aviso de costo como está (decisión de la responsable, 20/10) y conectarlo con enviarFormulario("coberturas_medicas", {...}): nombre, apellido, telefono, email, tipo = «¿Qué estás buscando?» y descripcion con una línea por respuesta (para quién, cuántas personas, cobertura actual y, en /prepagas, situación laboral y zona).

6) Redes en el pie: íconos a Instagram (https://www.instagram.com/comparatuobrasocial/) y Facebook (https://www.facebook.com/profile.php?id=61594606546289).

Google Analytics: instalar el código con el ID G-6JPYRX8218 en todas las páginas y agregar los eventos clic_whatsapp, clic_cta_formulario y formulario_enviado (ver sección «Google Analytics 4»).
```

## 4. Kocos Marketing (kocosmkt.com)

```
Sin tocar el diseño general:

1) CTA principal. Reemplazar el botón «Ver planes» por «Consultar por WhatsApp». Abre https://wa.me/5491172502391?text=<mensaje> con enlaceWhatsApp. Mensaje de la home: «Hola, quiero consultar por un proyecto para mi marca. Escribo desde la web de Kocos Marketing». El acceso a la sección de planes sigue disponible desde el ítem «Planes» del menú.

2) Los botones «Hablar por WhatsApp» y el enlace «WhatsApp» del pie pasan al número 5491172502391 (hoy usan 5492235223906) con enlaceWhatsApp. En /servicios: «Hola, vi la sección de Servicios y quiero consultar por un proyecto. Escribo desde la web de Kocos Marketing». En los planes, «Quiero este plan» puede sumar un botón secundario «Consultar por WhatsApp» con: «Hola, quiero consultar por el plan <nombre del plan>. Escribo desde la web de Kocos Marketing».

3) Dominio único: usar kocosmkt.com sin www en el logo, el menú, el sitemap y la canonical (hoy se mezclan con www).

4) Formularios («Enviar consulta» en home y /servicios): conectarlos con enviarFormulario("marketing", {...}) usando los campos que ya acepta el CRM: full_name, whatsapp, email, business, industry, instagram, need, budget y message.

5) Redes en el pie con íconos a Instagram (https://www.instagram.com/kocosmkt/) y Facebook (https://www.facebook.com/profile.php?id=61595100234671). Quitar «PRÓXIMAMENTE» de «Trabajos» si no hay casos reales para mostrar (sin inventar casos).

6) Google Analytics: instalar el código con el ID G-1381XE2GJ4 en todas las páginas y agregar los eventos clic_whatsapp, clic_cta_formulario y formulario_enviado (ver sección «Google Analytics 4»).
```

## Cómo se prueba cada landing

1. Los botones de WhatsApp abren el número correcto con el texto prearmado; con `?origen=instagram` el texto termina en «(llegué desde Instagram)».
2. El formulario envía, muestra el mensaje de éxito y la consulta aparece en el CRM con fuente «Landing» y página de origen.
3. Llega el correo a la casilla del rubro (cuando el programador haya cargado la clave de Resend).
4. Jurídico: «Estudio Jurídico Vita» visible en header, hero, pie y título de la pestaña. Coberturas: botón de WhatsApp del header visible, subrayado del ítem activo y animaciones sin saltos, en celular y en computadora.
