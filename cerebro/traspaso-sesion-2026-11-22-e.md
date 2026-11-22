# Traspaso 22/11 (e) · quinta vuelta en curso (para retomar después de compactar)

Pedido del dueño: «todo es decoración; que TODO sea funcional, accesible, premium, con animaciones, tipografía y sombras; el cerebro tiene que sumar conocimiento y hacer cosas; Oficina como el reel DfJiHrmipzE (edificio 3D isométrico de noche en corte, salas, agentes caminando con cartel de nombre, panel lateral; las tareas se llevan al Cerebro); acelerar la carga; pulir de punta a punta desde el login hasta abrir un chat».

## Agentes lanzados (sonnet, cada uno en su worktree desde main `4a20bce`, sin push)
| Worktree | Rama | Tarea | Estado al compactar |
|---|---|---|---|
| /home/user/w1 | rediseno4/parte1 | Oficina 3D edificio estilo reel (salas por sector, Cerebro al centro, agentes llevan tareas, panel lateral, sin filas de botones) | corriendo |
| /home/user/w2 | rediseno4/parte2 | Contactos y Citas funcionales (recuperar lo perdido: buscar, filtros, ficha, chat, mover etapa, derivar, agendar, lote, CSV; citas crear/mover/cancelar/asistió) | corriendo |
| /home/user/w3 | rediseno4/parte3 | Resumen accionable + estética nueva en secciones de «Más» | corriendo |
| /home/user/w4 | rediseno4/parte4 | Jarvis (acciones por pantalla, hoja perezosa, historial), Laboratorio (simulador, comparar roles, publicar con código), Cerebro (base de conocimiento: migración `0650_cerebro_conocimiento.sql` SIN aplicar, «Enseñale algo», «Preguntale al cerebro») | corriendo |
| /home/user/w5 | rediseno4/parte5 | Rendimiento: **terminado** (63ba73e: CSS del fondo separado, caché 60 s de rubros, optimizePackageImports; JS ya en el piso). Encima, pulido ultra premium de login, perfiles, hoy, marco, chats, conversación, campañas | pulido corriendo |

## Al retomar (orden)
1. Esperar las notificaciones de los agentes; leer sus informes.
2. Integrar en `/home/user/crm-main` rama `integracion/rediseno-2211` (= main): merge de parte5, parte1, parte2, parte3, parte4; resolver conflictos (probables en CSS globales y `next.config.mjs`).
3. Aplicar la migración 0650 con `mcp__Supabase__apply_migration` (proyecto `enhgkeqiqcuwafsedaza`, sin begin/commit externos) y verificar con `execute_sql`.
4. typecheck + tests + build; push a main; humo `scratchpad/humo2.js` (ajustar `const rutas=`) con `PANEL_CODE` solo como variable de entorno; medir carga en producción (TTFB por pantalla) y atacar lo lento.
5. Revisión independiente rápida (accesibilidad y código) si alcanza el crédito; actualizar `07`, `08`, bitácora.

## Reglas que siguen
- El código del panel nunca en archivos (solo variable `PANEL_CODE`). Nada se borra. Rubros separados. Nada se paga sin OK. Sin capturas al dueño. Estética clásica sin fondo raro. Jarvis hace TODO con confirmación reforzada.
- Graphify: instalado en los 5 repos y en el entorno; mapa en `cerebro/mapa-codigo/`. Los agentes lo usan.
- PR de Graphify en los repos de landings (#2 en cada uno): solo mirar; el PR #80 de LEGAL-CRM queda para después (desuscripto).
- Pendiente de OK del dueño: granja de teléfonos (mini PC + hub, DeviceFarmer, Evolution API) — `biblioteca/propuesta-lineas-codigo-agentes-2211.md`.
