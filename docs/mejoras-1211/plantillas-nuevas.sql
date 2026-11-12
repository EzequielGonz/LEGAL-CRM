-- 12/11 · Plantillas nuevas de Wasender, INACTIVAS, para que la responsable las revise.
-- No modifica ninguna plantilla existente. Repetible sin error (no duplica por nombre).
-- Cada una trae 4 textos distintos (el principal y 3 variantes): es el mínimo que pide
-- el ritmo nuevo para salir en una campaña. «…_segundo_intento» es la que usa el segundo
-- intento a quien nunca respondió.
with nuevas(slug, nombre, cuerpo, variantes) as (values
  ('juridico', 'jur_primer_contacto_v3',
   'Hola {{nombre}}, ¿cómo estás? Soy {{asesor}}, del Estudio Jurídico VITA. Te escribo porque revisamos casos de accidentes de trabajo con ART. ¿Tuviste alguno en los últimos años?',
   '["Buenas, {{nombre}}. Te habla {{asesor}}, del Estudio Jurídico VITA. Trabajamos con personas que tuvieron un accidente laboral y quedaron con alguna secuela. ¿Te pasó algo así?","Hola {{nombre}}, soy {{asesor}} del Estudio Jurídico VITA. Muchas veces la ART da el alta o paga sin que nadie revise si corresponde algo más. ¿Vos tuviste un accidente de trabajo?","{{nombre}}, buen día. Soy {{asesor}}, del Estudio Jurídico VITA. Una consulta corta: ¿alguna vez tuviste un accidente en el trabajo o yendo al trabajo?"]'::jsonb),
  ('juridico', 'jur_segundo_intento',
   'Hola {{nombre}}, soy {{asesor}} del Estudio Jurídico VITA. Te escribí hace unos días por el tema de accidentes de trabajo. Si te sirve que lo revisemos, contame y lo vemos. Y si no es para vos, avisame y no te escribo más.',
   '["{{nombre}}, ¿cómo va? Te había escrito por los accidentes laborales con ART. No te quiero molestar: si tuviste alguno, respondeme con un «sí» y te cuento. Si no, decime y listo.","Buenas, {{nombre}}. Paso de nuevo por acá, soy {{asesor}} del Estudio Jurídico VITA. ¿Llegaste a ver mi mensaje sobre accidentes de trabajo? Si no te interesa, avisame y no insisto.","Hola {{nombre}}. Último mensaje de mi parte: en el Estudio Jurídico VITA revisamos si a alguien le corresponde algo más por un accidente laboral. ¿Querés que veamos tu caso? Si no, no te escribo más."]'::jsonb),
  ('agencia_0km', 'autos_primer_contacto_v3',
   'Hola {{nombre}}, ¿cómo estás? Soy {{asesor}}, de Automotores Kocos. Trabajamos con 0 km financiados. ¿Estás pensando en cambiar el auto este año?',
   '["Buenas, {{nombre}}. Te escribe {{asesor}}, de Automotores Kocos. ¿Tenés auto hoy o estás buscando tu primer 0 km?","Hola {{nombre}}, soy {{asesor}} de Automotores Kocos. Ayudamos a llegar al 0 km con financiación. ¿Qué modelo te gustaría tener?","{{nombre}}, buen día. Soy {{asesor}}, de Automotores Kocos. Una consulta: ¿te interesa ver opciones para sacar un 0 km en cuotas?"]'::jsonb),
  ('agencia_0km', 'autos_segundo_intento',
   'Hola {{nombre}}, soy {{asesor}} de Automotores Kocos. Te escribí hace unos días por el 0 km. Si seguís con la idea, contame qué modelo mirás. Y si no es el momento, avisame y no te escribo más.',
   '["{{nombre}}, ¿cómo va? Paso de nuevo: ¿llegaste a ver mi mensaje sobre los 0 km financiados? Si no te interesa, decime y listo.","Buenas, {{nombre}}. No te quiero molestar: si en algún momento pensás en cambiar el auto, respondeme y te paso opciones. Si no, avisame y no insisto.","Hola {{nombre}}. Último mensaje de mi parte, soy {{asesor}} de Automotores Kocos. ¿Querés que te cuente cómo sería la financiación de un 0 km? Si no, no te escribo más."]'::jsonb),
  ('coberturas_medicas', 'cob_primer_contacto_v3',
   'Hola {{nombre}}, ¿cómo estás? Soy {{asesor}}, de Compara tu Obra Social. Ayudamos a comparar prepagas y obras sociales. ¿Hoy tenés cobertura médica?',
   '["Buenas, {{nombre}}. Te escribe {{asesor}}, de Compara tu Obra Social. ¿Estás conforme con lo que pagás por tu cobertura médica?","Hola {{nombre}}, soy {{asesor}} de Compara tu Obra Social. Mucha gente paga de más por su prepaga sin saberlo. ¿Querés que comparemos la tuya?","{{nombre}}, buen día. Soy {{asesor}}, de Compara tu Obra Social. Una consulta corta: ¿la cobertura es para vos o para tu grupo familiar?"]'::jsonb),
  ('coberturas_medicas', 'cob_segundo_intento',
   'Hola {{nombre}}, soy {{asesor}} de Compara tu Obra Social. Te escribí hace unos días por tu cobertura médica. Si querés comparar opciones, contame qué tenés hoy. Y si no te sirve, avisame y no te escribo más.',
   '["{{nombre}}, ¿cómo va? ¿Llegaste a ver mi mensaje sobre prepagas y obras sociales? Si no te interesa, decime y listo.","Buenas, {{nombre}}. No te quiero molestar: si en algún momento querés pagar menos o mejorar tu cobertura, respondeme y lo vemos. Si no, avisame y no insisto.","Hola {{nombre}}. Último mensaje de mi parte, soy {{asesor}} de Compara tu Obra Social. ¿Querés que te pase una comparación para tu caso? Si no, no te escribo más."]'::jsonb),
  ('marketing', 'mkt_primer_contacto_v3',
   'Hola, ¿cómo estás? Soy {{asesor}}, de Kocos Marketing. Estuve viendo tu negocio en Google y encontré un par de cosas para mejorar. ¿Te las cuento?',
   '["Buenas, te escribe {{asesor}} de Kocos Marketing. Miramos cómo aparece tu negocio en Google y armamos una propuesta corta. ¿Con quién puedo hablarlo?","Hola, soy {{asesor}}, de Kocos Marketing. Una consulta: ¿hoy les llegan clientes por Google o por redes, o sobre todo por recomendación?","¿Qué tal? Soy {{asesor}} de Kocos Marketing. Vi la ficha de tu negocio en Google y creo que puede traer más consultas. ¿Te interesa que te cuente cómo?"]'::jsonb),
  ('marketing', 'mkt_segundo_intento',
   'Hola, soy {{asesor}} de Kocos Marketing. Te escribí hace unos días por la ficha de tu negocio en Google. Si te interesa ver la propuesta, avisame. Y si no, decime y no te escribo más.',
   '["Buenas, paso de nuevo: ¿llegaste a ver mi mensaje sobre tu negocio en Google? Si no es el momento, decime y listo.","¿Qué tal? No quiero molestar: si en algún momento querés más consultas por Google, respondeme y te paso la propuesta. Si no, avisame y no insisto.","Hola. Último mensaje de mi parte, soy {{asesor}} de Kocos Marketing. ¿Querés que te mande la propuesta para tu negocio? Si no, no te escribo más."]'::jsonb)
)
insert into public.wasender_plantillas (rubro_id, nombre, uso, cuerpo, variantes, activa, origen)
select r.id, n.nombre, 'campana', n.cuerpo, n.variantes, false, 'panel'
  from nuevas n join public.rubros r on r.slug = n.slug
 where not exists (select 1 from public.wasender_plantillas p where p.rubro_id = r.id and p.nombre = n.nombre)
returning nombre, activa;
