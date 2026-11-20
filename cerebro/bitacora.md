---
description: Diario de sesiones y aprendizajes. Lo más nuevo arriba. Una entrada corta por vuelta de trabajo.
---

# Bitácora

## 20/11/2026 · 09:00–09:30 · Aprendizaje continuo y preguntas

- **Órdenes nuevas:** releer y entender el negocio en cada sesión, aprender y actualizar el cerebro en el momento, sumar roles/skills/plugins solos. Nombres: Kocos Marketing (sin ORVIAN); autos «Automotores Kocos» o «Autos Kocos», nunca «Agencia Kocos». Pasar a main el cerebro y las ramas de documentos. Por ahora, entender; las instrucciones vienen después.
- **Hecho:** hook de arranque (`.claude/settings.json` + `.claude/hooks/cerebro-al-arrancar.sh`) que carga el cerebro solo; protocolo de aprendizaje continuo en `README.md`; 51 preguntas en `12-preguntas-para-entender.md` y en Word.
- **Aprendido:** un build puede fallar por la descarga de fuentes de Google en el entorno (`next/font`); reintentar antes de culpar al cambio.

## 20/11/2026 · 05:45–06:30 · Armado del cerebro

- **Pedido:** cruzar el contexto de Fase 1 (Cowork) y Fase 2 (Code), armar memoria/cerebro, preguntar lo necesario, recorrer el panel, conectar repos y ramas, quitar restricciones salvo pagos.
- **Hecho:** cerebro en `cerebro/` (12 archivos); cruce con 19 contradicciones resueltas; estado verificado en base, Vercel, Metricool y DNS; CLAUDE.md actualizado a «única restricción: pagos».
- **Respuestas de la responsable:** destacadas ya armadas a mano; campañas las lanza ella siempre; cerebro en LEGAL-CRM; Search Console «no sé» → comprobado por DNS: verificadas.
- **Aprendido:** la doc del 20/11 coincidía con la base en los 9 puntos chequeados, pero no decía que la campaña en curso no había enviado nada, que el calendario se corta el 24/11 en 3 marcas, ni el 26 % de fallas de entrega en Jurídico.
- **Recorrido del panel (105 pantallas, solo lectura):** todo responde; línea de Meta de Marketing «sin acceso al número»; 11 bugs anotados en el pendiente 15. `/telefono` ya redirige.
- **Inventario de ramas:** 82 integradas, 6 con trabajo propio (rescatar `gracious-volta`, publicar `pensive-galileo` como 0635, PR #40 de Resend); adjuntar PDF ya estaba en producción; main 585/586 pruebas (falla el catálogo del asistente).
- **Documentos viejos** con aviso arriba que remite al cerebro.
- **Quedó:** producción del cronograma doble (P0), línea de Marketing, integrar ramas de documentos a main, rama del 19/11, medición. Ver `08-pendientes-y-plan.md`.

## Aprendizajes permanentes

- Antes de informar «encendido», mirar la base: la documentación puede estar bien y aun así omitir lo importante.
- Una campaña creada fuera de la franja 8–21 queda «en curso» sin enviar hasta la próxima ventana.
- Metricool muestra Europe/Madrid: siempre consultar y programar en Buenos Aires.
- La rama de trabajo asignada a cada sesión puede venir muy atrasada respecto de main (43 commits el 20/11): integrar main antes de tocar código o migraciones.
- La responsable prefiere decisiones tomadas con una recomendación clara, no menús largos.
- Salud del panel puede decir «en orden» con una línea sin acceso: para saber si una línea anda, mirar `/meta/lineas` (consulta en vivo a Meta), no solo Salud.
- El clon de la sesión puede venir superficial (10 commits): `git fetch --unshallow` antes de comparar ramas.
