# Tanda 1 (28/11 al 02/12): contrato entre guiones y escenas del motor Atlas

Pedido del dueño (27/11): 2 reels nuevos por día y marca, del 28/11 al 02/12, en 40 piezas. Las condiciones:
- ganchos «polémicos» que contradicen una creencia común, siempre con información verdadera;
- voz un poco más rápida (aburría);
- más animación y animaciones distintas;
- cada marca con su estilo;
- todo se programa en Metricool. La tanda 2 (03/12 al 07/12) se hace a las 15:30.

## Plan de cada reel: `atlas/planes/<id>.json`

```json
{
  "id": "vita-2811-a",                  // <marca>-<ddmm de publicación>-<a|b>
  "marca": "vita",                      // vita | coberturas | autos | marketing
  "base": "vita-2711-2",                // id del guion original de la tanda en el que se basa
  "fecha_pub": "2026-11-28", "hora": "11:10",   // hora de Buenos Aires; a = antes de las 14:00, b = después de las 17:00
  "redes": ["instagram", "facebook"],
  "gancho": "Pedir perdón te puede costar el juicio.",   // ≤ 8 palabras, polémico pero verdadero; va escrito dentro de la escena desde el cuadro 1
  "voz": "Texto completo que se graba…",               // 50 a 68 palabras (20–25 s con la voz más rápida). La primera frase es el gancho dicho. La última empalma con la primera (loop).
  "palabra": "NUNCA",                   // palabra del sello o del contenido. YA NO es palabra clave para comentar (cambio del dueño, 27/11)
  "contador": 3,                        // 0 si no hay pasos numerados; 2–4 si los hay
  "beats": [                            // 5 a 8 golpes, en orden, cubriendo toda la voz
    {"palabra": "perdón", "n": 0, "tipo": "gancho", "objeto": "globo", "texto": "«Perdón, fue mi culpa»", "efecto": "rebote"},
    {"palabra": "nunca", "n": 0, "tipo": "giro", "objeto": "sello", "texto": "NUNCA", "efecto": "tachar"},
    {"palabra": "uno", "n": 0, "tipo": "paso", "objeto": "camara", "texto": "Fotos", "efecto": "flash"}
  ],
  "cierre": "Escribinos por WhatsApp",   // SIEMPRE este texto, igual en la voz, en la placa final y en el copy
  "copy": "Texto de la publicación (gancho + 2–3 líneas de valor + «Escribinos por WhatsApp.» + «Situación ilustrativa. Voz generada con IA.» + 3 a 5 hashtags). NUNCA «El botón está en el perfil» (orden del 20/11: ese botón no existe).",
  "fuente": "Ley o norma si el guion base la tenía; si no, vacío"
}
```

- `palabra` del golpe: la primera palabra de la voz donde arranca el golpe, escrita igual que en la voz. `n` es la ocurrencia (0 = la primera vez que aparece esa palabra).
- `tipo`: gancho | problema | giro | paso | dato | cierre.
- `efecto`: golpe (zoom de impacto) | caida | rebote | giro | tachar | sello | flash | apagon | lupa | despiece | barrido | cuenta.
- `texto`: como máximo 5 palabras, escrito dentro de la escena (cartel, cartulina, plastilina, paleta, pantalla). Nada de carteles de aclaración.

## Objetos por marca (la escena sabe dibujar estos y solo estos)

| Marca | Estilo | Objetos |
|---|---|---|
| vita | Teatrito de cartulina de noche (telón, haz de luz, neblina) | auto, choque, documento, firma, celular, almanaque, reloj, casco, ambulancia, testigo, camara, billete, sobre, edificio, sello, nico, globo |
| coberturas | Plastilina stop-motion sobre mesa menta | personaje, orden, receta, celular, credencial, sello, escalera, frasco, almanaque, carpeta, check, pregunta, mostrador, reloj |
| autos | Producto de estudio oscuro (laca, luz que barre, piso espejo) | auto, llave, escudo, lupa, poliza, celular, almanaque, velocimetro, rueda, check, cruz, candado, grieta, documento |
| marketing | Cartel de aeropuerto (paletas que giran) en hall cálido + objetos | cartel, reloj_arena, caja, celular, carta, mostrador, estrella, vidriera, check, cruz, chat, etiqueta |

## Reglas duras
- Fuera los clichés de rubro (dirección de arte v2): balanza y martillo (VITA), estetoscopio (Coberturas), megáfono (Marketing). Se usan objetos de la situación: el papel, el recibo, el chat. Si un plan viejo los pide, la escena dibuja un objeto seguro.
- Rioplatense con voseo. Sin caras reales. Sin «Black Friday». Nunca «Agencia Kocos» (es Automotores Kocos o Autos Kocos) ni «ORVIAN».
- Polémico = desafía una creencia («Pedir perdón después de un choque te puede costar caro»). Nunca falso, nunca ataque a personas, empresas o colegas, nunca promesa de resultado («ganás seguro», «garantizado»).
- Datos legales solo los que ya traen los guiones verificados (campo `fuente`). Coberturas sin cifras de aportes ni cuotas. Autos sin tasas ni precios inventados.
- **Cierre (orden del dueño, 27/11): solo «Escribinos por WhatsApp.»**, en la voz, en la placa final y en el copy. Sin palabra clave, sin «comentá» y sin prometer guías. Los 40 planes de la tanda 1 ya están corregidos.
- Todo lo que hacen las tareas programadas está en `docs/redes/tareas-programadas/` (empezar por el `README.md`).
