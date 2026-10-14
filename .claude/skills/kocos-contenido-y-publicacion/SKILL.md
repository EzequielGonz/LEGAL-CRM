---
name: kocos-contenido-y-publicacion
description: Contenido premium por perfil (brief de marca, biblioteca de hechos, pilares, piezas y variantes por destino, validación editorial y visual) y su programación y publicación automática en landings y redes conectadas dentro de una política habilitada - cola duradera, deduplicación, reconciliación, tokens vencidos, retenciones con motivo y medición. Usar al generar, validar, programar, publicar o medir contenido web o de redes, o al conectar destinos de publicación.
---

# Contenido premium, programación y publicación

Cubre los procedimientos «crm-premium-content» (25.6) y «crm-content-publishing» (25.7) del parche 2.0 y su sección 17. Reglas generales: `.claude/referencias/reglas-comunes.md` (sección 10). El operador no redacta captions, elige hashtags ni sube piezas una por una: pide «Generar contenido para este objetivo» o «Mejorar lo que estamos publicando», ve próximas publicaciones, últimas publicadas, temas, resultados y fallos que necesitan conexión, y puede pausar el calendario.

## Producción por rubro

1. Leer el brief de marca del perfil (logo, paleta, tipografías, servicios, público, zona, tono, objetivos, contactos y afirmaciones autorizadas) y la biblioteca de hechos. Sin brief, se prepara la configuración y se informa qué falta.
2. Elegir un tema útil con su siguiente paso: problemas frecuentes, proceso, preguntas reales, servicios pertinentes, evidencia verificable. No reutilizar una pieza genérica en los cuatro rubros.
3. Redactar y diseñar variantes por destino: landing o artículo (estructura, utilidad, CTA); redes (composición, legibilidad, identidad, primer mensaje, siguiente paso); video (guion, recursos con derecho de uso, subtítulos, versión por formato cuando el proveedor lo permita). Plantillas visuales de buena calidad sin deformar logos ni saturar de texto.
4. Validar claridad, precisión, ortografía, consistencia visual, recorte, contraste, formatos, enlaces y objetivo comercial. Cada afirmación factual se relaciona con conocimiento autorizado; las no fundamentadas se omiten; las especializadas (jurídicas, médicas, comerciales) registran quién las revisó y cuándo. La IA que genera no es la única comprobación.
5. Guardar fuentes y versión. Entregar piezas publicables con sus métricas objetivo.

Nunca: conversaciones privadas o fichas de leads convertidas en contenido, testimonios o clientes ficticios, precios, resultados, credenciales o garantías no autorizados. Los agentes de estrategia, redacción, diseño, validación y publicación son distintos del asistente comercial; comparten hechos del perfil, no conversaciones.

## Política de autopublicación (definida una vez por perfil y canal)

Formatos, frecuencia, temas y alcance autorizados; la puesta en marcha valida biblioteca, plantillas y destinos. Una vez habilitada, las piezas que cumplen se programan y publican **sin aprobación manual individual**. Se **retienen con motivo** y continúan las demás: falta de evidencia, afirmaciones nuevas sensibles, conflicto de marca, incumplimiento de formato. Las incidencias repetidas se agrupan. La habilitación inicial y los cambios fuera del alcance sí requieren una decisión expresa.

## Conexión de destinos

Confirmar perfil, cuenta, permisos, formato y vigencia de cada conexión con una operación real de lectura o prueba; una URL de perfil no concede permiso de publicación. Facebook e Instagram: verificar modalidad de cuenta, permisos, revisión de app y capacidades actuales antes de activar; no simular éxito cuando la API no admite un formato. Autorizaciones por flujos oficiales con secretos en el servidor; registro de permisos, recurso, caducidad y última comprobación; desconexión, pausa y revocación por destino. Ante caducidad, detener ese destino, pedir la reconexión correcta y conservar el borrador; nunca publicar en la cuenta de otro rubro.

## Programador confiable

- Cada publicación persiste perfil, destino, versión, fecha, zona horaria (separada del horario de contactos) y clave de deduplicación. Cola duradera que no depende de una página abierta.
- Reservar el trabajo, publicar, confirmar el identificador o enlace devuelto por el canal y registrar el resultado. Un timeout puede significar que se publicó: reconciliar antes de repetir; sin duplicados por reintento, cambio de proceso o dos trabajadores.
- Publicar una pieza social de noche no autoriza WhatsApp a un frío: calendario editorial y horario de contactos son independientes. Estados reales: preparando, validando, programada, publicando, publicada, retenida, error.

## Medición

Enlaces, consultas, captaciones, alcance e interacciones disponibles; las impresiones no prueban ventas; conversiones relacionadas con evidencia de origen. Sin inventar costos ni atribución.

## Casos de control

A28 (pieza correcta o sensible sin evidencia), A29 (token vencido o publicación incierta) y V13. La prueba se hace con destinos simulados; nada se publica en producción sin la política habilitada por la responsable.
