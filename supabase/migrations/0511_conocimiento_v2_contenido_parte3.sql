-- 25/10 · Contenido de la versión 2 del conocimiento del bot (Biblioteca Maestra de Ventas), parte 3 de 4.
-- Generado por docs/conocimiento/v2/generar.py. Repetible sin error: inserta lo que falta y
-- no pisa ítems que el equipo ya editó (on conflict do nothing).
-- En total 166 ítems: 2 generales, 4 de base por rubro, 12 temas, 148 fichas de objeción (4 inactivas porque las resuelve una regla del sistema). Esta parte: 42.
insert into public.bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden) values
  (2, $k$O067$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Mi usado está financiado$k$, array[$k$usado esta financiado$k$,$k$tiene prenda$k$,$k$prendado$k$,$k$todavia lo estoy pagando$k$]::text[], $k$«Mi usado está financiado». Puede ser: Complejidad de prenda y cancelación.
Para entender (si hace falta): «¿Todavía figura una prenda y conocés el saldo cancelatorio?»
Enfoque, con tus palabras: La operatoria puede requerir cancelar obligaciones y revisar documentación antes de transferir. Un asesor especializado confirma viabilidad y costos.
Evitá: Aceptar automáticamente un auto prendado.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O067$k$, null, true, 66),
  (2, $k$O068$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$No quiero entregar mi auto antes$k$, array[$k$no quiero entregar mi auto$k$,$k$quedarme sin auto$k$,$k$entregar el usado antes$k$]::text[], $k$«No quiero entregar mi auto antes». Puede ser: Temor a quedarse sin movilidad o sufrir incumplimiento.
Para entender (si hace falta): «¿Te preocupa la fecha de entrega del nuevo o la seguridad de la operación?»
Enfoque, con tus palabras: Es razonable coordinar fechas. Las condiciones de entrega de ambos vehículos deberían quedar claras por escrito antes de cualquier compromiso.
Evitá: Exigir entrega anticipada sin contrato claro.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O068$k$, null, true, 67),
  (2, $k$O069$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Vi el mismo auto más barato$k$, array[$k$mismo auto mas barato$k$,$k$lo vi mas barato$k$,$k$en otra concesionaria$k$,$k$en otro lado esta mas barato$k$,$k$mas barato en$k$]::text[], $k$«Vi el mismo auto más barato». Puede ser: Posible diferencia en año, versión, financiación o gastos.
Para entender (si hace falta): «¿Coinciden versión, año-modelo, precio final y gastos incluidos?»
Enfoque, con tus palabras: Puede ser una opción mejor. Comparemos la misma configuración y el precio puesto en la calle, sin descalificar lo que viste.
Evitá: Ocultar patentamiento o gastos para parecer barato.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O069$k$, null, true, 68),
  (2, $k$O070$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿El precio incluye patentamiento?$k$, array[$k$patentamiento$k$,$k$patente$k$,$k$gastos de patentamiento$k$,$k$flete$k$,$k$precio final$k$,$k$puesto en la calle$k$,$k$incluye$k$]::text[], $k$«¿El precio incluye patentamiento?». Puede ser: Busca evitar costos sorpresivos.
Para entender (si hace falta): «¿Querés el precio de la unidad o el costo final de salida?»
Enfoque, con tus palabras: Hay que diferenciar precio del vehículo, inscripción, impuestos y gastos de entrega. Sólo te confirmamos importes vigentes con desglose escrito.
Evitá: Usar precio base como total final.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O070$k$, null, true, 69),
  (2, $k$O071$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿El auto está realmente en stock?$k$, array[$k$en stock$k$,$k$stock$k$,$k$lo tienen$k$,$k$hay disponible$k$,$k$disponibilidad$k$]::text[], $k$«¿El auto está realmente en stock?». Puede ser: Temor a señas sobre unidades inexistentes.
Para entender (si hace falta): «¿Querés verificar una versión y color específicos?»
Enfoque, con tus palabras: La disponibilidad debe confirmarse en el sistema comercial en ese momento. No sería responsable asegurar stock por una foto o publicidad vieja.
Evitá: Afirmar disponibilidad sin consulta real.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O071$k$, null, true, 70),
  (2, $k$O072$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Quiero ese color exacto$k$, array[$k$color$k$,$k$ese color$k$,$k$en blanco$k$,$k$en negro$k$,$k$en gris$k$,$k$en rojo$k$]::text[], $k$«Quiero ese color exacto». Puede ser: Preferencia emocional y temor a sustitución.
Para entender (si hace falta): «¿Es condición excluyente o aceptarías que revisemos plazo para ese color?»
Enfoque, con tus palabras: El color y equipamiento deben constar en la oferta. Si no hay confirmación, prefiero decirlo antes de tomar una reserva.
Evitá: Cambiar color unilateralmente.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O072$k$, null, true, 71),
  (2, $k$O073$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Me aseguran el precio después de señar?$k$, array[$k$si seño$k$,$k$congelar el precio$k$,$k$precio congelado$k$,$k$despues de señar$k$,$k$despues de senar$k$,$k$sena$k$,$k$seña$k$]::text[], $k$«¿Me aseguran el precio después de señar?». Puede ser: Riesgo de variación antes de facturación.
Para entender (si hace falta): «¿La propuesta indica precio cerrado, vigencia y condiciones de la seña?»
Enfoque, con tus palabras: Depende del contrato y de cómo esté instrumentada la operación. Necesitamos revisar la oferta escrita antes de hablar de congelamiento de precio.
Evitá: Prometer congelamiento de palabra.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O073$k$, null, true, 72),
  (2, $k$O074$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$No voy a transferir una seña por WhatsApp$k$, array[$k$transferir$k$,$k$transferencia$k$,$k$cbu$k$,$k$alias$k$,$k$pagar por whatsapp$k$]::text[], $k$«No voy a transferir una seña por WhatsApp». Puede ser: Fraude posible y desconfianza razonable.
Para entender (si hace falta): «¿Preferís verificar datos del concesionario por un canal oficial?»
Enfoque, con tus palabras: Es una precaución apropiada. La identidad del receptor, concepto de seña y condiciones deben verificarse por canales seguros y documentación.
Evitá: Apurar transferencias a cuentas personales.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O074$k$, null, true, 73),
  (2, $k$O075$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Puedo cancelar sin penalidad?$k$, array[$k$cancelar sin$k$,$k$penalidad$k$,$k$si me arrepiento$k$,$k$dar de baja el plan$k$,$k$rescindir$k$]::text[], $k$«¿Puedo cancelar sin penalidad?». Puede ser: Necesita conocer consecuencias económicas.
Para entender (si hace falta): «¿Se trata de crédito, reserva o plan de ahorro?»
Enfoque, con tus palabras: Las reglas de baja varían mucho. Hay que leer condiciones específicas y derechos aplicables para responder de forma responsable.
Evitá: Prometer devolución plena automática.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O075$k$, null, true, 74),
  (2, $k$O076$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿El plan adjudica por sorteo o licitación?$k$, array[$k$sorteo$k$,$k$licitacion$k$,$k$licitar$k$,$k$adjudica$k$,$k$adjudicacion$k$]::text[], $k$«¿El plan adjudica por sorteo o licitación?». Puede ser: Falta de familiaridad con planes de ahorro.
Para entender (si hace falta): «¿Tenés el contrato o propuesta de un plan concreto?»
Enfoque, con tus palabras: Los mecanismos de adjudicación suelen estar definidos contractualmente y sujetos a normativa. Hay que ver cómo funciona ese plan particular.
Evitá: Asegurar adjudicación en determinada cuota.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O076$k$, null, true, 75),
  (2, $k$O077$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Si adelanto cuotas, ¿termino antes?$k$, array[$k$adelantar cuotas$k$,$k$adelanto cuotas$k$,$k$cancelar antes$k$,$k$precancelar$k$]::text[], $k$«Si adelanto cuotas, ¿termino antes?». Puede ser: Confusión sobre amortización y condiciones financieras.
Para entender (si hace falta): «¿Es un préstamo con saldo o un plan administrado?»
Enfoque, con tus palabras: El efecto de adelantar pagos depende de condiciones del crédito o del plan. Se puede analizar si reduce saldo, plazo o cuotas según documentación.
Evitá: Dar resultados de cancelación anticipada universales.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O077$k$, null, true, 76),
  (2, $k$O078$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Puedo elegir cualquier auto con el plan?$k$, array[$k$cualquier auto con el plan$k$,$k$cambiar de modelo$k$,$k$elegir el modelo$k$,$k$otro modelo con el plan$k$]::text[], $k$«¿Puedo elegir cualquier auto con el plan?». Puede ser: Confusión con vehículo tipo y cambio de modelo.
Para entender (si hace falta): «¿Qué modelo contempla el contrato y cuál te gustaría retirar?»
Enfoque, con tus palabras: Los planes tienen reglas de vehículo tipo, sustitución y diferencias de precio. La flexibilidad real depende del contrato vigente.
Evitá: Prometer cambio de modelo sin condiciones.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O078$k$, null, true, 77),
  (2, $k$O079$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Me dijeron que me entregan en cuota tres$k$, array[$k$cuota tres$k$,$k$cuota 3$k$,$k$cuota dos$k$,$k$cuota 2$k$,$k$entrega asegurada$k$,$k$entrega garantizada$k$,$k$me lo entregan en$k$]::text[], $k$«Me dijeron que me entregan en cuota tres». Puede ser: Ancla publicitaria y riesgo de promesa no documentada.
Para entender (si hace falta): «¿Te lo entregaron por escrito con condiciones exactas?»
Enfoque, con tus palabras: Esa promesa debe verificarse en el instrumento contractual. Si depende de adjudicación, integración o cupos, hay que distinguirlo antes de decidir.
Evitá: Repetir entregas garantizadas de publicidad.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O079$k$, null, true, 78),
  (2, $k$O080$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿El seguro lo tengo que contratar con ustedes?$k$, array[$k$el seguro$k$,$k$seguro con ustedes$k$,$k$tengo que asegurar$k$,$k$seguro obligatorio$k$]::text[], $k$«¿El seguro lo tengo que contratar con ustedes?». Puede ser: Duda sobre libertad de elección y financiación.
Para entender (si hace falta): «¿Es compra al contado, crédito prendario o plan?»
Enfoque, con tus palabras: Las condiciones varían con el instrumento y marco regulatorio. Conviene revisar exigencias de cobertura y libertad de elección aplicable.
Evitá: Imponer proveedor sin verificar normativa.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O080$k$, null, true, 79),
  (2, $k$O081$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Cuánto gasta de combustible?$k$, array[$k$combustible$k$,$k$consumo$k$,$k$cuanto gasta$k$,$k$nafta$k$,$k$km por litro$k$,$k$litros$k$]::text[], $k$«¿Cuánto gasta de combustible?». Puede ser: Busca costo de uso real.
Para entender (si hace falta): «¿Te interesa consumo urbano, ruta o mixto y qué motorización?»
Enfoque, con tus palabras: Podemos compartir homologación oficial si está disponible, aclarando que el consumo real depende de conducción, carga y entorno.
Evitá: Inventar kilómetros por litro.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O081$k$, null, true, 80),
  (2, $k$O082$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿La garantía se pierde si hago services afuera?$k$, array[$k$garantia$k$,$k$service$k$,$k$services afuera$k$,$k$taller afuera$k$,$k$pierdo la garantia$k$]::text[], $k$«¿La garantía se pierde si hago services afuera?». Puede ser: Riesgo de costos de mantenimiento y cobertura.
Para entender (si hace falta): «¿Qué marca y condición concreta figura en el manual de garantía?»
Enfoque, con tus palabras: Conviene distinguir garantía legal, comercial del fabricante y exigencias contractuales que sean válidas. Revisamos documentación antes de afirmarlo.
Evitá: Afirmar pérdida automática en todos los casos.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O082$k$, null, true, 81),
  (2, $k$O083$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Es mejor comprar ahora o esperar?$k$, array[$k$comprar ahora o esperar$k$,$k$conviene esperar$k$,$k$van a bajar$k$,$k$van a subir$k$,$k$esperar$k$,$k$es buen momento$k$]::text[], $k$«¿Es mejor comprar ahora o esperar?». Puede ser: Incertidumbre macroeconómica y temor al arrepentimiento.
Para entender (si hace falta): «¿Depende de tu necesidad de movilidad, presupuesto o una promoción documentada?»
Enfoque, con tus palabras: No puedo predecir precios futuros. Lo útil es comparar costo vigente, disponibilidad y costo de esperar para tu situación, sin urgencias ficticias.
Evitá: Pronosticar subas como certeza.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O083$k$, null, true, 82),
  (2, $k$O084$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Me conviene un usado más equipado$k$, array[$k$un usado$k$,$k$usado mas equipado$k$,$k$usado en vez$k$,$k$conviene un usado$k$]::text[], $k$«Me conviene un usado más equipado». Puede ser: Trade-off entre precio, equipamiento, garantía y riesgo.
Para entender (si hace falta): «¿Priorizás garantía, tecnología, costo total o confort?»
Enfoque, con tus palabras: Tiene sentido considerar ambas opciones. Podemos comparar depreciación, mantenimiento, seguro, garantía y equipamiento según unidades concretas.
Evitá: Presentar 0 km como superior en todo.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O084$k$, null, true, 83),
  (2, $k$O085$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Aceptan monotributistas?$k$, array[$k$monotribut*$k$,$k$autonomo$k$,$k$independiente$k$]::text[], $k$«¿Aceptan monotributistas?». Puede ser: Temor a exclusión del crédito.
Para entender (si hace falta): «¿Consultás por compra al contado o financiación?»
Enfoque, con tus palabras: La compra y la elegibilidad crediticia son cosas distintas. Requisitos de financiación dependen de cada entidad y documentación.
Evitá: Prometer financiación por categoría fiscal.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O085$k$, null, true, 84),
  (2, $k$O086$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$No tengo recibo de sueldo$k$, array[$k$no tengo recibo$k$,$k$sin recibo$k$,$k$trabajo en negro$k$,$k$no estoy en blanco$k$,$k$no puedo demostrar ingresos$k$]::text[], $k$«No tengo recibo de sueldo». Puede ser: Acceso a crédito y formas alternativas de acreditar ingresos.
Para entender (si hace falta): «¿Tenés ingresos documentables por actividad independiente?»
Enfoque, con tus palabras: Cada financiadora define pruebas de ingresos admitidas. Podemos explicar requisitos conocidos, pero no una aprobación sin análisis.
Evitá: Recomendar falsificar ingresos.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O086$k$, null, true, 85),
  (2, $k$O087$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Qué pasa si dejo de pagar?$k$, array[$k$dejo de pagar$k$,$k$si no pago$k$,$k$mora$k$,$k$me atraso$k$,$k$atrasarme$k$]::text[], $k$«¿Qué pasa si dejo de pagar?». Puede ser: Miedo a endeudarse y consecuencias legales.
Para entender (si hace falta): «¿Querés revisar riesgos de mora en un crédito o en un plan?»
Enfoque, con tus palabras: Es importante entender mora, intereses, ejecución de garantía y consecuencias contractuales antes de firmar. El contrato y entidad determinan alcance.
Evitá: Minimizar ejecuciones o penalidades.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O087$k$, null, true, 86),
  (2, $k$O088$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Me dan todos los gastos cerrados?$k$, array[$k$gastos cerrados$k$,$k$todos los gastos$k$,$k$gastos sorpresa$k$,$k$gastos ocultos$k$,$k$precio cerrado$k$]::text[], $k$«¿Me dan todos los gastos cerrados?». Puede ser: Ansiedad por cargos sorpresa en el cierre.
Para entender (si hace falta): «¿Querés comparar presupuesto final con patente, flete y administración discriminados?»
Enfoque, con tus palabras: Lo correcto es detallar los conceptos verificables y dejar identificados los que dependan de autoridad registral, provincia o fecha de operación.
Evitá: Inventar un total sin confirmar rubros.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O088$k$, null, true, 87),
  (2, $k$O089$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Tengo obra social, ¿por qué cambiaría?$k$, array[$k$ya tengo obra social$k$,$k$tengo obra social$k$,$k$para que cambiar$k$,$k$por que cambiaria$k$,$k$estoy bien con mi$k$,$k$ya tengo prepaga$k$,$k$tengo prepaga$k$]::text[], $k$«Tengo obra social, ¿por qué cambiaría?». Puede ser: Satisfacción actual o costo de cambio percibido.
Para entender (si hace falta): «¿Qué aspecto estás pensando mejorar, si es que hay alguno?»
Enfoque, con tus palabras: Si tu cobertura funciona, no hay necesidad de cambiar. Comparar puede servir sólo si buscás otra cartilla, atención, costo o cobertura geográfica.
Evitá: Crear miedo sobre la obra social vigente.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O089$k$, null, true, 88),
  (2, $k$O090$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Quiero conservar mi clínica$k$, array[$k$mi clinica$k$,$k$mi sanatorio$k$,$k$mi hospital$k$,$k$conservar la clinica$k$,$k$quiero seguir en$k$,$k$atenderme en$k$]::text[], $k$«Quiero conservar mi clínica». Puede ser: Continuidad asistencial y temor a perder profesionales.
Para entender (si hace falta): «¿Cuál es la institución y en qué sede necesitás atenderte?»
Enfoque, con tus palabras: La cartilla puede variar según plan, sede y fecha. Se debe consultar la versión vigente antes de hablar de cobertura real.
Evitá: Prometer instituciones sin verificar.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O090$k$, null, true, 89),
  (2, $k$O091$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Mi médico está en este plan$k$, array[$k$mi medico$k$,$k$mi doctor$k$,$k$mi doctora$k$,$k$mi pediatra$k$,$k$mi ginecolog*$k$,$k$mi cardiolog*$k$,$k$mi traumat*$k$]::text[], $k$«Mi médico está en este plan». Puede ser: Preferencia por profesional específico.
Para entender (si hace falta): «¿Se trata de un médico y consultorio particulares o de la institución?»
Enfoque, con tus palabras: Que un profesional trabaje con una entidad no significa que atienda todos los planes. Verificamos prestador, especialidad y sede actuales.
Evitá: Generalizar por nombre de prepaga.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O091$k$, null, true, 90),
  (2, $k$O092$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Me cubre una cirugía?$k$, array[$k$cirugia$k$,$k$operacion$k$,$k$operarme$k$,$k$me tengo que operar$k$,$k$intervencion$k$]::text[], $k$«¿Me cubre una cirugía?». Puede ser: Alto impacto en salud y finanzas.
Para entender (si hace falta): «¿Consultás por una prestación prescripta y un plan en particular?»
Enfoque, con tus palabras: La cobertura depende de indicación, normativa, prestaciones y condiciones del plan. Un asesor autorizado puede revisar documentación; yo no puedo garantizar autorizaciones.
Evitá: Dar aprobación médica por WhatsApp.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O092$k$, null, true, 91),
  (2, $k$O093$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Me cubre medicamentos caros?$k$, array[$k$medicamentos$k$,$k$medicamento$k$,$k$remedios$k$,$k$medicacion$k$,$k$tratamiento caro$k$,$k$oncolog*$k$]::text[], $k$«¿Me cubre medicamentos caros?». Puede ser: Costos elevados y posible tratamiento crónico.
Para entender (si hace falta): «¿Tenés el nombre de la cobertura o autorización que te informaron, sin enviar diagnóstico?»
Enfoque, con tus palabras: Hay prestaciones y reglas específicas según programa obligatorio y normativa. Para un caso particular hay que verificar indicación y autorización con el agente de salud.
Evitá: Prometer reintegro total universal.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O093$k$, null, true, 92),
  (2, $k$O094$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Tengo una enfermedad preexistente$k$, array[$k$preexistencia$k$,$k$preexistente$k$,$k$enfermedad previa$k$,$k$tengo diabetes$k$,$k$soy diabetic*$k$,$k$hipertens*$k$,$k$estoy enferm*$k$]::text[], $k$«Tengo una enfermedad preexistente». Puede ser: Miedo a rechazo o discriminación.
Para entender (si hace falta): «¿Querés entender las reglas generales antes de compartir cualquier dato de salud?»
Enfoque, con tus palabras: La Ley 26.682 regula el tratamiento de preexistencias y el proceso no debe manejarse con promesas informales. Un asesor habilitado explica condiciones vigentes con privacidad.
Evitá: Recolectar historia clínica innecesaria.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O094$k$, null, true, 93),
  (2, $k$O095$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Estoy embarazada$k$, array[$k$embarazada$k$,$k$embarazo$k$,$k$estoy esperando un bebe$k$,$k$parto$k$,$k$maternidad$k$]::text[], $k$«Estoy embarazada». Puede ser: Necesidad de continuidad, maternidad y urgencia afectiva.
Para entender (si hace falta): «¿Querés comparar instituciones y prestaciones de maternidad por plan?»
Enfoque, con tus palabras: Hay prestaciones obligatorias y condiciones de plan a verificar. No recomendaría cambiar sólo por un precio sin evaluar continuidad de atención y cartilla.
Evitá: Presionar con miedo por el embarazo.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O095$k$, null, true, 94),
  (2, $k$O096$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Tengo hijos chicos$k$, array[$k$hijos chicos$k$,$k$mis hijos$k$,$k$bebe$k$,$k$nenes$k$,$k$pediatria$k$,$k$chicos$k$]::text[], $k$«Tengo hijos chicos». Puede ser: Prioriza pediatría, urgencias y cercanía.
Para entender (si hace falta): «¿Qué zona y centros pediátricos te resultan importantes?»
Enfoque, con tus palabras: Podemos comparar pediatría, guardias, vacunación y cartillas vigentes por plan. La mejor opción depende de necesidades familiares reales.
Evitá: Prometer guardias en todas las sedes.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O096$k$, null, true, 95),
  (2, $k$O097$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Quiero incluir a mi pareja$k$, array[$k$mi pareja$k$,$k$incluir a mi$k$,$k$sumar a mi$k$,$k$agregar a mi$k$,$k$concubin*$k$,$k$grupo familiar$k$,$k$mi familia$k$]::text[], $k$«Quiero incluir a mi pareja». Puede ser: Desconocimiento de categorías de grupo familiar.
Para entender (si hace falta): «¿Qué vínculo y tipo de contratación están considerando?»
Enfoque, con tus palabras: Los requisitos y costos varían por régimen y entidad. Un asesor confirma documentación y composición aceptada para el caso concreto.
Evitá: Afirmar inclusión automática de cualquier vínculo.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O097$k$, null, true, 96),
  (2, $k$O098$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Trabajo en relación de dependencia$k$, array[$k$relacion de dependencia$k$,$k$en blanco$k$,$k$recibo de sueldo$k$,$k$empleado$k$,$k$trabajo en una empresa$k$,$k$mis aportes$k$]::text[], $k$«Trabajo en relación de dependencia». Puede ser: Dudas sobre aportes y opción de cambio.
Para entender (si hace falta): «¿Querés entender cómo pueden utilizarse tus aportes?»
Enfoque, con tus palabras: La derivación y opción dependen del régimen vigente y agente elegido. Se puede explicar el mecanismo general y verificar elegibilidad real.
Evitá: Prometer que los aportes cubren toda cuota.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O098$k$, null, true, 97),
  (2, $k$O099$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Soy monotributista$k$, array[$k$monotribut*$k$]::text[], $k$«Soy monotributista». Puede ser: Dudas sobre padrón, aceptación y acceso.
Para entender (si hace falta): «¿Querés buscar entidades que acepten tu régimen y tu zona?»
Enfoque, con tus palabras: No todas las opciones funcionan igual para cada categoría. El registro oficial permite conocer agentes habilitados y condiciones.
Evitá: Afirmar que cualquier prepaga acepta cualquier monotributo.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O099$k$, null, true, 98),
  (2, $k$O100$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Puedo usar los aportes para una prepaga?$k$, array[$k$usar los aportes$k$,$k$derivar aportes$k$,$k$derivar mis aportes$k$,$k$con mis aportes$k$,$k$aportes para$k$]::text[], $k$«¿Puedo usar los aportes para una prepaga?». Puede ser: Confusión entre obra social, agente y plan superador.
Para entender (si hace falta): «¿Querés un plan básico o evaluar una diferencia adicional?»
Enfoque, con tus palabras: La aplicación de aportes tiene condiciones regulatorias y comerciales específicas. Hay que verificar agente, inscripción y modalidad vigente.
Evitá: Prometer derivación automática universal.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O100$k$, null, true, 99),
  (2, $k$O101$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Cuánto queda de diferencia?$k$, array[$k$cuanto queda de diferencia$k$,$k$diferencia$k$,$k$cuanto tendria que pagar$k$,$k$cuanto pagaria$k$,$k$cuanto me queda$k$]::text[], $k$«¿Cuánto queda de diferencia?». Puede ser: Busca costo real tras aportes.
Para entender (si hace falta): «¿Conocés tu situación laboral y qué plan querés comparar?»
Enfoque, con tus palabras: El valor final puede depender de aportes, grupo, edades, zona y plan. Sólo se informa un importe cuando se valida cálculo vigente.
Evitá: Inventar cuota neta sin ingresos.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O101$k$, null, true, 100),
  (2, $k$O102$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Me aumentan todos los meses?$k$, array[$k$aumentan$k$,$k$aumento$k$,$k$aumentos$k$,$k$suben todos los meses$k$,$k$me aumenta$k$]::text[], $k$«¿Me aumentan todos los meses?». Puede ser: Ansiedad por inflación de cuota.
Para entender (si hace falta): «¿Consultás por política de actualización de un plan concreto?»
Enfoque, con tus palabras: Conviene distinguir precio inicial de posibles actualizaciones y cómo se informan. Un asesor debe proporcionar condiciones vigentes, no una garantía de estabilidad.
Evitá: Prometer precio fijo sin respaldo.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O102$k$, null, true, 101),
  (2, $k$O103$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Tiene copagos?$k$, array[$k$copagos$k$,$k$copago$k$,$k$coseguro$k$,$k$bono$k$,$k$pagar por consulta$k$]::text[], $k$«¿Tiene copagos?». Puede ser: Diferencia entre cuota mensual y costo de uso.
Para entender (si hace falta): «¿Qué prestaciones usás con mayor frecuencia?»
Enfoque, con tus palabras: Al comparar hay que mirar cuota y copagos por consulta, estudios y prácticas según plan. Una cuota menor no siempre significa costo total menor.
Evitá: Ocultar coseguros en la propuesta.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O103$k$, null, true, 102),
  (2, $k$O104$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Hay reintegros?$k$, array[$k$reintegro$k$,$k$reintegros$k$,$k$me devuelven$k$]::text[], $k$«¿Hay reintegros?». Puede ser: Valora libertad de elección y uso fuera de cartilla.
Para entender (si hace falta): «¿Para qué tipo de consulta o práctica lo necesitás?»
Enfoque, con tus palabras: El reintegro depende de topes, comprobantes, prestaciones y plan. Debe verificarse por escrito.
Evitá: Afirmar reintegro de cualquier médico.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O104$k$, null, true, 103),
  (2, $k$O105$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$No quiero períodos de carencia$k$, array[$k$carencia$k$,$k$periodo de espera$k$,$k$tiempo de espera$k$]::text[], $k$«No quiero períodos de carencia». Puede ser: Temor a quedar desprotegido al cambiar.
Para entender (si hace falta): «¿Qué prestación te preocupa que se interrumpa?»
Enfoque, con tus palabras: Las prestaciones obligatorias y las adicionales pueden seguir reglas diferentes. Vale revisar el PMO y el contrato específico, sin igualar todos los servicios.
Evitá: Decir que toda prestación adicional es inmediata.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O105$k$, null, true, 104),
  (2, $k$O106$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Puedo atenderme desde el primer día?$k$, array[$k$desde el primer dia$k$,$k$desde cuando$k$,$k$atenderme ya$k$,$k$inmediato$k$,$k$cuando empiezo$k$]::text[], $k$«¿Puedo atenderme desde el primer día?». Puede ser: Urgencia asistencial y vigencia de afiliación.
Para entender (si hace falta): «¿Necesitás una prestación PMO o algo de un plan superador?»
Enfoque, con tus palabras: La cobertura obligatoria tiene reglas específicas y la fecha efectiva de afiliación debe comprobarse. No prometemos habilitación operativa sin confirmación.
Evitá: Confundir solicitud con alta efectiva.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O106$k$, null, true, 105),
  (2, $k$O107$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Ya me rechazaron una afiliación$k$, array[$k$me rechazaron$k$,$k$no me aceptaron$k$,$k$rechazaron la afiliacion$k$,$k$no me quisieron$k$]::text[], $k$«Ya me rechazaron una afiliación». Puede ser: Posibles requisitos, errores o controversias.
Para entender (si hace falta): «¿Te indicaron la causa formal y fecha de rechazo?»
Enfoque, con tus palabras: La razón importa para analizar qué normas aplican y qué reclamo podría corresponder. Puede revisarlo un asesor especializado sin emitir conclusiones instantáneas.
Evitá: Afirmar que la entidad siempre actuó ilegalmente.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O107$k$, null, true, 106),
  (2, $k$O108$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Tengo más de 65 años$k$, array[$k$mas de 65$k$,$k$65 años$k$,$k$65 anos$k$,$k$jubilad*$k$,$k$tengo 70$k$,$k$tengo 68$k$,$k$tengo 66$k$,$k$tengo 75$k$,$k$adulto mayor$k$,$k$pami$k$]::text[], $k$«Tengo más de 65 años». Puede ser: Temor a discriminación por edad y aumentos.
Para entender (si hace falta): «¿Buscás conocer criterios de afiliación o comparar cuotas vigentes?»
Enfoque, con tus palabras: La edad puede tener tratamiento normativo y comercial específico. Hay que diferenciar admisión, precio y continuidad, consultando regulación vigente.
Evitá: Dar precio sólo por edad sin más datos.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O108$k$, null, true, 107)
on conflict (version, clave) do nothing;
