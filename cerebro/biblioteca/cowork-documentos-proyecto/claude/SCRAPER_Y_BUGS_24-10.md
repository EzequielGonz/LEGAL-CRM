# Marketing · extracción de bases y bugs (24/10/2026)

## Lo raro del scraper
1. Hay dos herramientas que hacen lo mismo con Outscraper, con reglas distintas:
   - «Extraer negocios»: arma 1 base por extracción; se analiza recién cuando el negocio acepta.
   - Pestaña «Análisis» (/panel/marketing/captacion): es el viejo «Captación — Google Maps» con «Barrido masivo». Arma 1 base por ciudad y analiza todo enseguida.
2. El 22/10 se corrieron las dos con la misma búsqueda:
   - Barrido de 41 ciudades a las 19:06 AR → 41 bases chicas (de 1 a 11 negocios cada una).
   - Extracción «Toda Argentina» a las 19:48 → 458 encontrados, 253 nuevos, 175 «ya existían» (los había cargado el barrido minutos antes).
   - Los mismos negocios quedaron repartidos en 42 bases, y el selector de bases y «Rol de cada base» se llenan de esas 41.
3. Los 4 rubros van en una sola búsqueda («Inmobiliarias, Constructoras, Estudios jurídicos, Restaurantes,», con coma final). Google mezcla y devuelve pocos por ciudad (11). Conviene una búsqueda por rubro y zona.
4. La pestaña se llama «Análisis» pero es un buscador. Dice «API oficial de Google Maps» pero usa Outscraper.
5. La extracción del 22/10 tardó 3 h (19:48 → 22:53), porque avanza una zona por latido.
6. El tope «disponibles hoy» se calcula con medianoche UTC (se reinicia a las 21:00 AR).
7. «Ejecutar base» usa `kocos_primer_contacto_v2` («Analizamos tu negocio en Google…»), porque `mkt_apertura_propuesta` (aprobada) no está asignada a la línea.
8. 600 negocios extraídos en la semana siguen «sin analizar» (es lo esperado: se analizan al aceptar). Del barrido: 356 analizados (54 alta, 94 media, 208 baja).

## Propuesta
- Una sola herramienta: «Extraer negocios», con una búsqueda por rubro y zona, y opción de varias zonas.
- El barrido queda dentro de ella, no como pestaña aparte; se saca «Análisis».
- Agrupar las 41 bases del 22/10 en una sola «Barrido 22/10» (archivando las chicas con motivo, sin borrar contactos).
- Asignar `mkt_apertura_propuesta` como apertura.
- Tope diario en hora AR. Correr varias zonas por latido para que no tarde horas.

## Errores del servidor (Vercel, 7 días)
- 3 cortes por tiempo (60 s): /api/asistente (22/10), /api/plantillas/enviar-a-meta y el webhook de WhatsApp. El del asistente coincide con el pedido de cosas que no puede hacer.
- ContactDetainedError 23/10: ya corregido en el PR #49.

## Bugs del panel ya listados (se corrigen en el plan)
Ver PLAN_REORGANIZACION_24-10.md y DIAGNOSTICO_PANEL_24-10.md:
- Hora de campaña y accesos corrida; «Finalizada» con envíos pendientes; conteos 542 contra 564.
- «PENAL · Civil»; «asignar» de líneas ajenas; disponibilidad con 10 bloques vacíos.
- /biblioteca-agentes rota; 404 en /redes/* sin ?perfil; el enlace «Probar una conversación» no hace nada; la prueba usa un agente que no responde.
- El aviso de salud aparece en todos los perfiles; «Revisión» e «Incidencias» con los nombres cruzados.
- Chat de Coberturas «0 conversaciones» mientras carga; estado de Marketing que no avanza tras el presupuesto.
