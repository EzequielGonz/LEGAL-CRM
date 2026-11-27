# Referencia 3D con IA (sunnyshoots) y 3D Atlas: costos y ruta gratis (27/11)

## Qué es la referencia que mandó el dueño

Reel `instagram.com/reel/Dc5_aT6qSY6`, de @sunnyshoots.ai (cuenta de IA, 50 mil seguidores), del 5/9/2026, con 979 me gusta y 10 s de duración. Lo vimos con vidIQ (10 créditos del plan gratis) porque Instagram bloquea la descarga sin sesión.

- **Formato:** pantalla en tres franjas sincronizadas. Arriba, Tripo AI con el modelo. En el medio, el video final «Seedance 2.5 Render». Abajo, la vista previa de Blender: el mismo muñeco gris, sin texturas, caminando.
- **Personaje:** un hombre de sobretodo con la cabeza estilizada (máscara metálica), siempre de perfil y sin cara real. Hace el mismo ciclo de caminata en 4 escenarios:
  - 0–3 s: calle europea con café y luz dorada;
  - 3–5 s: callejón de neón;
  - 5–7 s: plaza futurista de día;
  - 7–10 s: puente con niebla.
- **Cómo se hizo**, según el texto del reel:
  1. Imagen → modelo 3D con **Tripo AI**.
  2. Escena y animación en **Blender**, en gris: la cámara, la caminata y los tiempos.
  3. **Seedance 2.5** toma esa animación gris y la convierte en un video de cine (telas, reflejos, luz, niebla), respetando el movimiento.
- **Qué nos sirve:** el movimiento y la cámara los controla el 3D y la terminación de cine la pone la IA. Así el mismo personaje sale igual en todos los reels.

## Cuánto cuesta (precios públicos del 27/11/2026)

| Pieza | Para qué | Costo | Notas |
| --- | --- | --- | --- |
| Tripo AI | Pasar de imagen a personaje 3D, con esqueleto y animación | Gratis: 200 créditos por mes, pero **no comercial** y el modelo queda de Tripo. **Pro: USD 20/mes** | Con plan pago, el modelo es nuestro. Un mes de Pro alcanza para crear los 4 personajes y después se cancela. Modelo con textura: unos 25 créditos; esqueleto y animación: 20 cada uno |
| Blender | Escena, cámara y animación en gris | Gratis | Lo reemplaza nuestro motor three.js, ya probado, o Blender en la máquina de trabajo |
| Seedance 2.5 (API oficial BytePlus) | Pasar la animación gris a video de cine | ~USD 0,23/s en 720p y ~USD 0,57/s en 1080p | Pide un saldo inicial de ~USD 30. Hay revendedores a ~USD 0,19–0,21/s en 720p (Revana, BeatAPI). fal cobra el doble |
| Seedance 2.5 Flash | Versión rápida y más barata | ~USD 0,15/s en 720p | Menor calidad |
| Dreamina (app de ByteDance) | Uso a mano | USD 15/mes = ~42 s de Seedance 2.5 en 720p | Alcanza para 1 reel y medio por mes. No sirve para nuestro volumen |

### Por reel y por mes

| Escenario | Cálculo | USD/mes |
| --- | --- | --- |
| Un reel de 30 s todo con Seedance | 30 s × 0,23 (720p) / × 0,57 (1080p) | ~7 / ~17 por reel |
| Todo el plan con Seedance (6 por día × 4 marcas) | 720 reels × ~7 | ~5.000 (inviable) |
| 1 reel «estrella» por día, solo VITA, en 720p | 30 × ~7 | ~210 |
| Solo el gancho de 5 s con Seedance en los 6 reels diarios de VITA | 180 × ~1,15 | ~210 |
| Prueba única del boceto de VITA | Tripo Pro 20 + saldo API 30 | 50 por única vez (rinde ~4 intentos del boceto de 33 s en 720p) |

Conectados pero sin saldo: Kling (0 créditos). ElevenLabs Starter tiene video, pero con lo que queda (~1.250 créditos) no alcanza para un reel.

## 3D Atlas (gratis): qué es y qué sirve

- `3datlas.futurialabs.eu`, de @uricurti: 37 estilos 3D hechos por Claude con three.js, la misma técnica de nuestro motor, sin modelos ni texturas.
- Cada estilo trae un prompt de ~113 KB con el código completo, el kit de render y el de sonido. Acepta el SRT de la voz para que cada cosa aparezca cuando se dice.
- Catálogo descargado del sitio: `estilos.json` y planilla de las 37 muestras, en la carpeta temporal de la sesión.
- **Los prompts no se pueden bajar automáticamente.** El sitio los entrega solo con el botón «Copiar prompt», y el filtro de seguridad bloqueó pedirlos directo desde el servidor. Se bajan con Claude in Chrome: prompt listo en la respuesta del 27/11.
- **Límite:** ningún estilo trae personajes realistas. Hay personajes de plastilina (Soft Clay), de cartulina (Spotlight Stage, Paper Pop-Up), inflables (Inflated), de clavija (Tiny Diorama) o de alambre (Blueprint). Low-Poly y Tiny Diorama quedan descartados porque se parecen a la maqueta que el dueño rechazó el 27/11.

### Estilos elegidos para probar, por marca

| Marca | Estilos | Para qué |
| --- | --- | --- |
| VITA | Spotlight Stage, Soft Clay, Paper Pop-Up, Domino Chain | Historias con escena y luz de teatro; personaje de plastilina; «una frase → consecuencias» |
| Kocos Marketing | Studio Product, Device Hero | Producto o pantalla con una sola promesa |
| Compara Tu Obra Social | Glass and Light | Mezclas y cantidades sin cifras |
| Autos Kocos | Exploded View | El 0 km por dentro, por piezas |
| Las 4 marcas | Split-Flap Board | Gancho con lista o ranking |

## Propuesta

Probar las dos rutas con el mismo guion, `vita-2711-1`, con la voz y la música que ya están, y compararlas lado a lado:

1. **Gratis:** motor three.js con el kit del Atlas y el personaje en el material del estilo.
2. **Híbrido, si el dueño autoriza USD 50:** personaje en Tripo, animación gris en nuestro motor sincronizada con la voz y terminación con Seedance 2.5.

Después, el dueño decide la mezcla de producción. Ejemplo: el gancho o un reel estrella por día con IA y el resto con el motor gratis.
