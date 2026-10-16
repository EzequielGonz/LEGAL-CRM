---
name: kocos-agentes-entrenamiento-y-evaluacion
description: Agentes de IA del CRM (principal y cuatro derivados, versiones, herencia, modos, herramientas validadas en el servidor, datos no confiables), entrenamiento comercial con ejemplos originales, simulador y evaluación (T01-T50, H01-H24, C01-C12, rúbricas comercial y de naturalidad), y fine tuning supervisado (corpus, exportador, validación, trabajo, comparación, registro, gasto). Usar al tocar prompts, herramientas del agente, el simulador, evaluaciones, datasets o cualquier ajuste del modelo.
---

# Agentes: entrenamiento, evaluación y fine tuning

Cubre los procedimientos «crm-sales-training» (25.3) y «crm-fine-tuning» (25.4) del parche 2.0 y sus secciones 13 y 14. La Etapa 3 no empieza hasta que se indique; mientras tanto, los cambios en los agentes actuales se limitan a los bloques autorizados. Reglas generales: `.claude/referencias/reglas-comunes.md`.

## Estructura

- Un **agente principal** de ventas (escucha, venta fría, descubrimiento, objeciones, valor, cierre por aceptación, memoria, respeto y detención) y **cuatro derivados** (Jurídico, Coberturas médicas, Autos, Marketing) que agregan rol, servicios autorizados, datos útiles, fases y restricciones. Un agente nuevo usa una versión explícita del principal más sus diferencias.
- Modos Frío, Consulta actual, Seguimiento e Investigación de marketing son configuraciones operativas, no modelos distintos. Civil, Penal, Laboral y Tránsito son especialidades jurídicas, no rubros.
- Guardar, probar, publicar y activar son acciones distintas. Un cambio del principal crea una versión candidata y no modifica solo los derivados en uso. Duplicar un agente no copia clientes, conversaciones, archivos, claves ni tareas. Los cinco prompts anteriores son historial de solo lectura.
- Identidad, línea y landing salen del perfil en ejecución. Nada fijo en prompts, código ni pesos.

## Seguridad del agente

Capas: reglas obligatorias, rol, hechos, resumen y mensajes. Las herramientas permitidas por perfil se validan en el servidor; una acción no permitida se rechaza aunque el modelo la pida; confirmar una cita exige el resultado real de la herramienta. Mensajes, transcripciones, OCR, documentos y páginas son datos no confiables. Salidas estructuradas; idempotencia; respuestas obsoletas descartadas; si llega una pausa o una toma humana mientras redacta, el mensaje no sale (A31). Política entrante 24 h y conversaciones simultáneas según la referencia (sección 4).

## Trato y habilidades comerciales (procedimiento de entrenamiento)

1. Leer solo los capítulos de entrenamiento y las reglas pertinentes; identificar la conducta deseada y el fallo observado.
2. Escribir ejemplos originales de varios turnos (la persona cuenta más de un dato, corrige uno, objeta y acepta o rechaza) con aceptación o detención verificables; respuesta útil, memoria, pocas preguntas pertinentes, naturalidad y próximo paso; voseo; sin repetir nombres ni empatía automática; sin urgencia, escasez, credenciales, testimonios ni resultados inventados; sin diagnósticos de personalidad como reglas.
3. Marketing: análisis individual del negocio con fuentes públicas, hallazgos con URL y fecha, hechos separados de hipótesis, propuesta proporcionada; una web que no cargó no demuestra que no exista.
4. Vincular cada derivado a su versión del principal; evaluar herramientas y tono por separado; no dar por entrenados los pesos por guardar instrucciones ni publicar sin comparación.

## Evaluación

- Todo en el **simulador**: una corrida no crea contactos, mensajes ni contadores reales y deja informe con fallos críticos y costo.
- Batería: T01 a T50, H01 a H24, C01 a C12, 12 pruebas de plantillas y casos de humanización; A24 a A26 para versiones y ajuste.
- Rúbricas separadas: comercial (16 puntos) y naturalidad (14). Puerta de aprobación propuesta: ningún fallo crítico en baja, perfil, promesas, captación y envíos, y preferencia humana por el candidato en al menos el 60 % de comparaciones ciegas, con número de casos, empates y variabilidad informados. No se usa al mismo modelo como único juez.
- Tres referencias: agente actual, mismo modelo base con instrucciones actualizadas y modelo ajustado con esas instrucciones, sobre los mismos casos reservados y herramientas.

## Fine tuning (bloque actual del plan, Etapa 3)

- **Ruta técnica propuesta**: ajuste supervisado administrado en Google Cloud (la documentación de Vertex AI redirige hoy a Gemini Enterprise Agent Platform); candidato inicial `gemini-3.5-flash` con ajuste supervisado y function calling; comparar un candidato de menor costo. Gemini API y AI Studio no ofrecen ese ajuste. No asumir que el modelo configurado en código es ajustable; verificar identificador, cuenta, región de ajuste e inferencia, cuotas y SDK. OpenAI no se propone sin comprobar disponibilidad. Referencias F01 a F06 del parche.
- **Un modelo principal ajustado sirve a los cuatro roles**; un ajuste especializado solo ante una brecha demostrada, con objetivo y costo. Tres capas separadas: pesos (conducta), conocimiento actualizado y reglas deterministas del servidor.
- **Corpus**: el Word es especificación y fuente de ejemplos, no un dataset. Conversaciones sintéticas originales revisadas, ejemplos aprobados del simulador y reales corregidas solo con autorización y tratamiento adecuado (anonimización revisada sobre toda la conversación). Objetivo inicial: 600 de entrenamiento, 100 de validación y 160 reservadas de evaluación, repartidas entre rubros y entradas frías y actuales; excluir captación sin aceptación, promesas, precios, origen no comprobado, agresión comercial, envíos a bajas y mezcla de datos; etiquetar correcciones.
- **Registro**: cada ejemplo con identificador, escenario, rol, modo, versión de reglas, procedencia, estado de revisión y resultado esperado; dataset interno versionado; división por conversación, persona y familia de escenario sin fuga; evaluación reservada congelada.
- **Exportador** al formato del proveedor (`systemInstruction` y `contents` con turnos `user` y `model`; herramientas con los nombres y contratos reales del proyecto), validando cada línea JSONL, contando tokens y estimando costo antes de subir.
- **Trabajo**: preparación, validación, subida privada, creación de un único trabajo por versión aprobada, seguimiento por identificador (sin función web abierta durante el proceso), registro del modelo resultante; parámetros recomendados por el proveedor y piloto acotado; estados en el panel: Preparando ejemplos, Listo para entrenar, Entrenando, En evaluación, Aprobado, Rechazado.
- **Antes del primer trabajo pago**: modelo compatible comprobado, cuenta y región, corpus, comparación prevista y presupuesto máximo presentados y aprobados. Nada se declara entrenado por guardar prompts o instalar skills. Modelo de recuperación aprobado y compatible; los prompts históricos no sirven de fallback.

## Métricas

Por agente, versión y modo, con conjunto, unidad y denominador; coinciden con consultas directas a la base; al llegar al límite de consumo, pausa o atención humana sin cambiar de modelo ni ampliar el gasto solo.
