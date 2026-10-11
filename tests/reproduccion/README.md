# Reproducción de la revisión del 10/10 contra la versión anterior

`entrega-anterior.test.ts` confirma, con la versión que se revisó
(`kocos-pipeline-etapa1.zip` aplicado sobre `7c721bf`), cada uno de los 6
puntos encontrados. Cada prueba **pasa si el error existía**. Usa la misma
base de pruebas (datos inventados) y la misma red simulada que
`tests/integracion`: no se envía nada real.

```bash
# 1) La versión anterior en otra carpeta
git worktree add ../crm-anterior 7c721bf
(cd ../crm-anterior && unzip -o /ruta/a/kocos-pipeline-etapa1.zip)

# 2) Desde este repositorio, con las dependencias instaladas (npm ci) y Docker
bash tests/reproduccion/correr.sh ../crm-anterior
```

Para los puntos que dependen de la hora (envíos de campaña), la prueba fija
el reloj en un martes a las 12 (Argentina), porque la versión anterior no
permite indicar la hora de referencia.

Con la versión corregida, las mismas situaciones están cubiertas por
`tests/unitarias` y `tests/integracion` (ver `tests/README.md`).
