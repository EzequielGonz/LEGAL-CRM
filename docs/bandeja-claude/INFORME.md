# Bandeja para Claude · qué se probó y qué no

- **Base real:** tabla creada y verificada (RLS activa, sin permisos para `anon`/`authenticated`, disparadores `bandeja_claude_sin_borrados` y `bandeja_claude_tocar`, 0 filas). Prueba dentro de una transacción revertida: el disparador actualiza `updated_at` y un descarte sin motivo se rechaza. Asesor de seguridad de Supabase: sin avisos nuevos (solo el informativo de «RLS sin políticas», igual que el resto de las tablas, porque se accede con la clave de servicio).
- **Unitarias de la bandeja:** 8/8 (`tests/unitarias/bandeja-claude.test.ts`): validaciones, datos personales, enlaces, descarte, «en espera» deducido, orden, resumen y perfil ↔ rubro.
- **Suite completa, typecheck, lint y build locales:** no se pudieron correr en la sesión (el registro de npm está bloqueado para este entorno). El build de Vercel de la Preview hace el typecheck y el lint de Next.js.
- **Revisión visual y prueba funcional:** pendientes (la sesión no puede ingresar al panel). En la Preview solo se mira: comparte base con producción.
