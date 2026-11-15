# Laboratorio del bot · qué se probó y qué no (15/11)

## Probado

- `npm run typecheck` y `npx tsc -p tests/tsconfig.json --noEmit`: sin errores.
- Pruebas unitarias: 537 de 537 (27 nuevas en `tests/unitarias/laboratorio-bot.test.ts`), entre ellas:
  - sin A/B ni roles del laboratorio, el plan es vacío, no fuerza versión ni modelo, y el pedido completo (reglas + criterio + conocimiento + rol) es idéntico al de hoy para charlas ficticias de tres perfiles; el pedido al modelo es el mismo objeto, sin claves nuevas;
  - asignación A/B determinística y reparto cercano al 20 %; solo charlas nuevas de esa campaña; vencida o cortada no rige; una campaña no puede tener dos pruebas;
  - precedencia: A/B > rol de campaña o base > tipo de consulta > perfil;
  - validaciones de versión, proveedor (nunca una clave), modelo, casos sintéticos sin teléfonos ni correos, evaluación de casos (precio, promesas, instrucciones, capa fija, contestador);
  - migraciones: repetibles, RLS, sin permisos públicos, sin borrados ni cambios de datos existentes.
- eslint del proyecto (`.eslintrc.json`) sobre `src` y `tests`: sin avisos. `npm run lint` en esta copia choca con la configuración de la carpeta principal (complemento de Next cargado dos veces porque la copia vive dentro del repositorio): es del entorno, no del código.
- `npm run build`: correcto.
- Migraciones 0630 y 0631 en un Postgres 16 local descartable (dos pasadas, función de creación, cifras A/B, permisos).

## No probado

- Recorrido en el navegador (claro, oscuro, 375 px, lector de pantalla). Revisado por lectura del código; falta mirarlo.
- Contra la base real: las migraciones no se aplicaron (las aplica el coordinador).
- Llamadas reales a Gemini: listar modelos y las simulaciones (gastan tokens) no se corrieron.
- Una charla real atendida por una variante A/B: requiere migraciones aplicadas y una prueba creada a mano.
- Mostrar en la ficha del chat qué variante respondió: no se hizo (queda registrado en `bot_lab_ab_asignaciones` para sumarlo después).
