# Autos Kocos: piezas fijas del 30/11 al 07/12

32 piezas de Automotores Kocos (8 carruseles, 8 posts y 16 historias), armadas con el motor Atlas (`laminas.py`). Las imágenes están en `.claude/referencias/redes/herramientas/historias-prototipo/atlas/piezas/autos-<ddmm>-<tipo>-<n>.jpg` y las specs en `piezas/specs-autos.json`. Carrusel y post: 1080×1350. Historias: 1080×1920. El carrusel suma solo la lámina final «Escribinos por WhatsApp».

Horas de la grilla (`01-ritmo-y-horarios.md`): post 15:40, carrusel 20:10, historias 10:50 y 19:50. Todos los temas salen de `guiones/autos.json`; ninguno es la `base` de un plan `-a`/`-b`, ninguno repite el tema de los dos reels del día ni de los planes de los 7 días anteriores, y ninguno se repite entre sí.

**Tema de cada pieza:** la columna «Base» es el id del guion; el tema está entre paréntesis. Aviso para la revisión antes de programar: los guiones con fecha propia (por ejemplo `autos-0312-*`) figuran como reels originales de esa fecha en `autos.json`; si una corrida A/B los toma como reel dentro de los 7 días de la pieza, hay que mover una de las dos.

## lunes 30/11

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-3011-car` | 20:10 | Carrusel | El auto queda como garantía del préstamo. | `autos-0212-2` (crédito prendario) |
| `autos-3011-post` | 15:40 | Post | Aguinaldo: no todo al anticipo. | `autos-0212-4` (aguinaldo como anticipo) |
| `autos-3011-his1` | 10:50 | Historia 1 (pregunta) | ¿Ruido nuevo? ¿Lo ignorás? | `autos-0312-g2` (ruidos raros el primer mes) |
| `autos-3011-his2` | 19:50 | Historia 2 (dato) | Ruta: ¿matafuego y balizas? | `autos-0212-1` (primer viaje a la ruta) |

## martes 01/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0112-car` | 20:10 | Carrusel | Faltan tres días para la entrega. | `autos-0312-3` (preparar la entrega) |
| `autos-0112-post` | 15:40 | Post | Licencia vencida: no salgas. | `autos-0312-g1` (licencia vencida) |
| `autos-0112-his1` | 10:50 | Historia 1 (pregunta) | ¿Te enamorás y firmás? | `autos-0312-2` (en el showroom) |
| `autos-0112-his2` | 19:50 | Historia 2 (dato) | Cochera: largo, ancho, alto | `autos-0312-1` (medidas de la cochera) |

## miércoles 02/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0212-car` | 20:10 | Carrusel | ¿Qué trae realmente tu 0 km? | `autos-0412-2` (qué viene incluido) |
| `autos-0212-post` | 15:40 | Post | No aceptes otro color apurado. | `autos-0412-3` (color distinto al pedido) |
| `autos-0212-his1` | 10:50 | Historia 1 (pregunta) | ¿Lo usás para apps? | `autos-0412-g1` (usar el auto para apps) |
| `autos-0212-his2` | 19:50 | Historia 2 (dato) | Auxilio: revisá la presión | `autos-0412-g2` (rueda de auxilio) |

## jueves 03/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0312-car` | 20:10 | Carrusel | El primer service tiene fecha: la del manual. | `autos-0112-1` (primer service) |
| `autos-0312-post` | 15:40 | Post | Prestar el auto: preguntá antes. | `autos-0512-2` (otro conductor y el seguro) |
| `autos-0312-his1` | 10:50 | Historia 1 (pregunta) | ¿Leíste el manual? | `autos-0512-4` (primer mes con el 0 km) |
| `autos-0312-his2` | 19:50 | Historia 2 (dato) | Nafta: mirá el manual | `autos-0612-g2` (combustible del manual) |

## viernes 04/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0412-car` | 20:10 | Carrusel | Antes de arrancar, ajustá estas tres cosas. | `autos-0612-g1` (posición de manejo) |
| `autos-0412-post` | 15:40 | Post | No ignores la luz prendida. | `autos-0612-4` (luces del tablero) |
| `autos-0412-his1` | 10:50 | Historia 1 (pregunta) | ¿Tu perro viaja suelto? | `autos-0112-g2` (viajar con mascota) |
| `autos-0412-his2` | 19:50 | Historia 2 (dato) | Nada valioso a la vista | `autos-0512-g1` (antirrobo) |

## sábado 05/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0512-car` | 20:10 | Carrusel | Vas por tu primer 0 km: llevá esto. | `autos-3011-2` (primer 0 km) |
| `autos-0512-post` | 15:40 | Post | «Todo riesgo» no cubre todo. | `autos-2711-g2` (franquicia del seguro) |
| `autos-0512-his1` | 10:50 | Historia 1 (pregunta) | ¿Le sumás accesorios? | `autos-reserva-1` (accesorios) |
| `autos-0512-his2` | 19:50 | Historia 2 (dato) | Llave de repuesto: en casa | `autos-0212-g1` (llave de repuesto) |

## domingo 06/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0612-car` | 20:10 | Carrusel | El 0 km duerme en la calle. | `autos-2811-g1` (estacionar de noche) |
| `autos-0612-post` | 15:40 | Post | No entregues sin cobrar. | `autos-3011-g2` (papeles del usado sin cobrar) |
| `autos-0612-his1` | 10:50 | Historia 1 (pregunta) | ¿Todos con cinturón atrás? | `autos-0112-g1` (cinturón de seguridad) |
| `autos-0612-his2` | 19:50 | Historia 2 (dato) | Seguro: impreso o en celular | `autos-2711-g1` (póliza digital) |

## lunes 07/12

| Id | Hora | Pieza | Gancho | Base |
|---|---|---|---|---|
| `autos-0712-car` | 20:10 | Carrusel | Lo probaste dos minutos y ya querés firmar. | `autos-2911-3` (prueba de manejo) |
| `autos-0712-post` | 15:40 | Post | «La cuota es fija.» No. | `autos-2811-4` (cuota del plan de ahorro) |
| `autos-0712-his1` | 10:50 | Historia 1 (pregunta) | ¿Seguro barato sin leer? | `autos-2811-g2` (tipo de seguro) |
| `autos-0712-his2` | 19:50 | Historia 2 (dato) | Híbrido: preguntá por la batería | `autos-0112-4` (híbrido: preguntas) |

## Copy de carruseles y posts

### autos-3011-car (30/11 20:10)

```
El auto queda como garantía del préstamo.

✔ El auto queda como garantía del préstamo
✔ Pedí el costo total, no solo la cuota
✔ Mirá qué pasa si cancelás antes

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-3011-post (30/11 15:40)

```
Aguinaldo: no todo al anticipo.

✔ Dejá un resto para imprevistos
✔ Sumá los gastos del retiro
✔ Recién ahí mirá cuánto queda para el anticipo

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0112-car (01/12 20:10)

```
Faltan tres días para la entrega.

✔ Día tres: el seguro, cotizado
✔ Día dos: el lugar en la cochera
✔ Día uno: la documentación lista

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0112-post (01/12 15:40)

```
Licencia vencida: no salgas.

✔ Para circular tenés que estar habilitado
✔ La licencia se lleva encima
✔ Fijate hoy cuándo vence

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

Fuente: Ley 24.449, art. 40, inc. a

### autos-0212-car (02/12 20:10)

```
¿Qué trae realmente tu 0 km?

✔ Preguntá qué versión es
✔ Preguntá qué equipamiento incluye
✔ Preguntá qué accesorios se pagan aparte

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0212-post (02/12 15:40)

```
No aceptes otro color apurado.

✔ Revisá la orden de compra
✔ Pedí una solución por escrito
✔ No lo aceptes apurado

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0312-car (03/12 20:10)

```
El primer service tiene fecha: la del manual.

✔ Hacelo cuando lo indica el manual
✔ Hacelo en un taller autorizado
✔ Guardá el comprobante para la garantía

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0312-post (03/12 15:40)

```
Prestar el auto: preguntá antes.

✔ Preguntá si el seguro cubre a otros conductores
✔ Fijate qué tiene que llevar él para circular
✔ Hacelo antes de prestarlo

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0412-car (04/12 20:10)

```
Antes de arrancar, ajustá estas tres cosas.

✔ Ajustá el asiento
✔ Ajustá los espejos
✔ Poné el apoyacabeza a la altura de la cabeza

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0412-post (04/12 15:40)

```
No ignores la luz prendida.

✔ Mirá en el manual qué significa
✔ No la ignores
✔ Consultá en el service

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0512-car (05/12 20:10)

```
Vas por tu primer 0 km: llevá esto.

✔ La cuota máxima que podés pagar
✔ Cuánto tenés de anticipo
✔ Las preguntas anotadas en el celular

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0512-post (05/12 15:40)

```
«Todo riesgo» no cubre todo.

✔ Muchas pólizas tienen franquicia
✔ Una parte del arreglo la pagás vos
✔ Preguntá cuánto es antes de contratar

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0612-car (06/12 20:10)

```
El 0 km duerme en la calle.

✔ Elegí un lugar iluminado
✔ No dejes nada a la vista
✔ Revisá qué cubre tu seguro

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0612-post (06/12 15:40)

```
No entregues sin cobrar.

✔ No entregues papeles ni llaves sin haber cobrado
✔ Confirmá el pago antes de nada
✔ Primero cobrás, después entregás

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0712-car (07/12 20:10)

```
Lo probaste dos minutos y ya querés firmar.

✔ Pedí una prueba más larga
✔ Probalo en avenida y estacionando
✔ Fijate la posición de manejo

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```

### autos-0712-post (07/12 15:40)

```
«La cuota es fija.» No.

✔ En general, se calcula sobre el precio actual del auto
✔ Si el modelo sube, la cuota sube
✔ Preguntá cómo se actualiza y pedilo por escrito

Escribinos por WhatsApp.

Situación ilustrativa.

#AutomotoresKocos #0km #AutoNuevo #BuenosAires
```
