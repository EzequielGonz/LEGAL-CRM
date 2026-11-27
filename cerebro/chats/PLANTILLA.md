# Plantilla única para volcar un chat (Code, Cowork o Claude común)

Archivo: `cerebro/chats/AAAA-MM-DD-<origen>-<tema-corto>.md` (fecha de inicio del chat; origen = code, cowork o claude).

1. **Encabezado:** título del chat, fechas de inicio y fin, origen (Code / Cowork / Claude común), id de sesión si hay, marcas o perfiles que toca.
2. **Objetivo:** qué pidió el dueño y para qué.
3. **Órdenes y decisiones del dueño**, TEXTUALES entre comillas, cada una con fecha. Si una reemplazó a otra: «reemplaza a …».
4. **Correcciones** que hizo (lo que no le gustó y qué quería en su lugar).
5. **Qué se hizo**, paso a paso, con estado: especificado / implementado / probado / publicado / habilitado.
6. **Todo lo concreto:** archivos y rutas, repos y ramas, commits, PR, ids de Metricool, publicaciones programadas (fecha, hora, marca), campañas, plantillas, enlaces a documentos y artefactos, cambios en Meta, Business Suite, Instagram, Google o Vercel.
7. **Datos del negocio** que aparecieron (precios, procesos, roles del equipo, horarios, cuentas, proveedores).
8. **Pendiente, a medias o bloqueado**, y por qué.
9. **Aprendizajes:** qué funcionó, qué no, errores y cómo se resolvieron.
10. **Preguntas abiertas.**
11. **Ramas y cambios (explícito):** cada repo y rama que usó el chat: para qué se creó, qué tiene, de qué rama salió, si está integrada a main o no, si tiene PR (número y estado) y qué habría que hacer con ella (integrar, rescatar, archivar). Lista de commits con hash corto, fecha y qué cambió cada uno. Archivos tocados por carpeta. Migraciones (número, si se aplicó en la base y cuándo). Despliegues (qué se publicó, cuándo, en qué proyecto). Cambios de configuración fuera del código (variables de Vercel solo por nombre, ajustes en Supabase, Meta, Metricool, Google, redes). Qué quedó encendido o apagado por ese chat.
12. **CONTRADICE:** todo lo que choque con otra información conocida.

Reglas: sin claves, tokens, contraseñas ni códigos de acceso (poner «[secreto: <qué era> — hay que cambiarlo]» sin el valor); sin datos personales de prospectos o clientes (solo cantidades y casos sin identificar); no inventar («(no confirmado)» si hay duda). En español rioplatense.
