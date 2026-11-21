# Estrategia SEO · cuatro landings (21/10)

Base: las cuatro ya tienen silos de contenido (Jurídico 64 páginas, Coberturas 66, Autos 79, Marketing 45), datos estructurados y sitemap. Lo que falta no es más contenido sino **activar, medir y convertir**. Este plan va en ese orden.

## 1. Activación técnica (semana 1, una vez publicadas)

| Paso | Jurídico | Coberturas | Autos | Marketing |
|---|---|---|---|---|
| Dominio canónico (`SITE_URL`) | estudiojuridicovita.com ✔ | comparatuobrasocial.com ✔ | autoskocos.com ✔ | kocosmkt.com ✔ |
| Google Search Console: verificar y cargar `/sitemap.xml` | pendiente | pendiente | pendiente | pendiente |
| Bing Webmaster + clave IndexNow (`INDEXNOW_KEY`) | pendiente | pendiente | pendiente | pendiente |
| Perfil de Empresa de Google (mismo nombre, teléfono y web que la landing) | **prioridad** | sí | **prioridad** | sí |
| Redirección única www → sin www (o al revés) | verificar en el hosting | idem | idem | idem |

Los códigos de verificación se pegan en `VERIFICATION` de cada `brand.ts`/`site.ts`; no hace falta tocar código.

## 2. Palabras clave prioritarias (intención de contratar)

| Landing | Foco principal | Long tail con mejor conversión | Zona |
|---|---|---|---|
| VITA Abogados | abogado accidente de tránsito, abogado ART | «me chocaron y no tengo seguro», «accidente in itinere qué hacer», «la ART me dio el alta y sigo con dolor» | Tránsito: AMBA · Laboral: país |
| Compara tu Obra Social | comparar prepagas, cambiar de obra social | «derivar aportes a prepaga», «prepaga para familia con hijos», «prepaga más barata en [zona]» | AMBA |
| Autos Kocos | 0 km financiado, plan de ahorro 0 km | «0 km tasa 0%», «entregar usado como parte de pago», «[modelo] 0 km precio y cuotas» | AMBA, prioridad CABA |
| Kocos Marketing | agencia de marketing digital, chatbot WhatsApp con IA | «automatizar WhatsApp para mi negocio», «CRM para [rubro]», «página web para [rubro]» | Nacional |

Regla: cada página tiene **una** intención principal; si dos páginas compiten por la misma búsqueda, se fusionan o se enlazan con jerarquía clara (pilar → guía).

## 3. Conversión (ya aplicado en esta entrega)

- WhatsApp con **mensaje distinto por sección**: el agente del CRM sabe de entrada qué le interesa a la persona.
- Llamados a la acción entre secciones en las cuatro home y botón flotante.
- Formularios al CRM, con primer WhatsApp automático a los 5 minutos (Jurídico y Marketing ya; Autos y Coberturas cuando Meta apruebe sus plantillas).
- Datos de contacto completos y consistentes (NAP) en footer y schema: clave para SEO local.

## 4. Autoridad y señales locales (semanas 2 a 4)

1. **Reseñas en Google**: pedir reseña a cada cliente cerrado (mensaje desde el CRM al cerrar). Es la señal local que más mueve.
2. **Citaciones**: mismo nombre, teléfono y web en directorios del rubro (guías jurídicas, comparadores de salud, directorios automotores, Clutch/Sortlist para Marketing).
3. **Enlaces cruzados con criterio**: Kocos Marketing puede mostrar a VITA, Coberturas y Autos como casos (portfolio con enlace). No enlazar entre las otras tres: son rubros sin relación.
4. **Redes**: perfil de Instagram y Facebook con el enlace a la landing y destacadas que lleven a las guías más útiles (se arma en la estrategia de contenido).

## 5. Visibilidad en buscadores con IA

- Las preguntas frecuentes ya tienen schema FAQPage: responder en la primera oración, con dato concreto.
- Sumar `llms.txt` en la raíz con el resumen del servicio y las URLs pilar (tarea corta para el programador).
- Firmar los artículos legales con el profesional que revisa (`REVIEWER` en `brand.ts`) en cuanto esté definido: suma confianza (E-E-A-T) en temas legales y de salud.

## 6. Medición

| Qué | Dónde | Meta a 60 días |
|---|---|---|
| Impresiones y clics por silo | Search Console | Crecimiento sostenido semana a semana |
| Formularios por landing | CRM (fuente «landing», con página de origen) | Al menos 1 por semana en cada rubro |
| Conversaciones de WhatsApp desde la web | CRM (mensaje inicial de sección) | Medir cuál sección convierte más |
| Captados desde web | CRM (fuente «landing») | Primer captado por rubro |

Revisión quincenal: páginas con impresiones y pocos clics → mejorar título y descripción; páginas con clics y sin consultas → reforzar el llamado a la acción.
