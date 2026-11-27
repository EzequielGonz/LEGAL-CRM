# Alojar y programar en Metricool

## Alojar

| Marca | Repo de la landing | Dominio |
|---|---|---|
| VITA | `estudio-juridico-vita-final` | https://www.estudiojuridicovita.com |
| Coberturas | `coberturas-sociales-landing` | https://www.comparatuobrasocial.com |
| Autos | `0km-kocos-agencia` | https://www.autoskocos.com |
| Marketing | `agencia-kocos-mkt` | https://www.kocosmkt.com |

1. Copiar a `apps/web/public/redes/<ddmm>/` del repo de la marca: el mp4, la tapa jpg y las imágenes. `<ddmm>` es el día de publicación.
2. Commit y push: primero `git push origin HEAD:main` y después la rama `claude/brave-hawking-nzsr60`.
3. Esperar el despliegue de Vercel y comprobar que cada archivo responda 200:

```bash
curl -sI https://www.estudiojuridicovita.com/redes/<ddmm>/<archivo>
```

Sin 200 no se programa.

## Programar

1. Antes: `getScheduledPosts` de la marca para ese día, con `America/Argentina/Buenos_Aires`, para no duplicar.
2. `createScheduledPost` con:
   - el `blogId` de la marca (VITA 7549864 · Coberturas 7549939 · Autos 7552104 · Marketing 7242607);
   - fecha y hora de la grilla (`01`), zona `America/Argentina/Buenos_Aires`;
   - el copy del plan;
   - la URL pública del archivo.

| Formato | `instagramData.type` | `facebookData.type` | Media |
|---|---|---|---|
| Reel | REEL (con `isAiGenerated: true`) | REEL | 1 video |
| Post | POST | POST | 1 imagen |
| Carrusel | POST | POST | varias imágenes |
| Historia | STORY | STORY | 1 imagen |

- VITA: los reels que no entran en el escalón de Instagram del día (`01`) van solo con `facebook` en los providers.
3. Registrar cada pieza en `docs/redes/programadas.jsonl` (marca, fecha, tipo, pieza e id de Metricool).
4. Después de un corte, consultar `getScheduledPosts` antes de reintentar.
