# Auditoría del 15/11: qué se probó y qué no

## Estado

| | Bloque 1 (bots) | Bloque 2 (seguridad) | Bloque 3 (panel) | Bloque 4 (negocio) |
|---|---|---|---|---|
| Especificado | sí | sí | sí | sí |
| Implementado | sí | sí | sí | sí |
| Probado | pruebas unitarias y sondeos con textos inventados | pruebas unitarias; funciones de la base probadas en transacciones deshechas | typecheck, lint y build; cifras de las funciones nuevas comparadas con la lectura directa | pruebas unitarias |
| Publicado | ver el cierre de la vuelta en `docs/ESTADO.md` | ídem | ídem | ídem |
| Habilitado | no cambia nada encendido: pausas, agentes y campañas siguen como estaban | el código de 8 números rige al cambiarlo; el de 6 sigue sirviendo | sí, al publicar | el entrenamiento rige en las campañas nuevas; nada se lanza solo |

## Comprobaciones

- Typecheck, typecheck de pruebas, lint y build: pasan.
- Pruebas unitarias: 510 de 510.
- Revisión cruzada con dos revisores independientes (uno de seguridad y uno de lógica del bot y del negocio, con modelos distintos). Todo lo que marcaron como verificado se corrigió, con prueba:
  - Seguridad:
    - La pausa general de intentos se podía usar para dejar afuera a la responsable. Ahora un dispositivo conocido o una sesión abierta no queda frenado (0624).
    - Si falla la base, el límite de intentos ya no se apaga: se frena.
    - Las confirmaciones con PIN (pausa, cerrar sesiones y seguimiento) también reservan el intento.
    - El tope de 3 automáticos también lo respeta el seguimiento. Cuenta por teléfono, en todos los perfiles, y si no puede leer, frena.
    - El rescate ya no repite un turno en el que falló el envío, para no duplicar un mensaje.
    - Las disculpas no salen con el agente del área apagado.
    - Dos chats ya no pueden tomar el mismo horario.
    - El origen del ingreso se toma del encabezado que escribe Vercel (en IPv6, por red /64).
  - Lógica:
    - El validador ahora frena «30 mil pesos», «cuarenta y cinco mil», «veinte lucas», «30.000» y «el treinta por ciento», y deja pasar «aproximadamente 50 casos» y «alrededor de las 16:30».
    - La llave de aceptación ya no rechaza «sí, me interesa, pero hoy no tengo tiempo».
    - Una amenaza que viene junto con un pedido de baja también avisa.
    - Crisis ahora reconoce «quiero morirme» y «me mato», y deja de tomar como crisis «no quiero vivir en esa zona».
    - Enojo deja de tomar como enojo con nosotros «mi jefe es un hdp» y «no me molestes ahora, escribime mañana».
    - El freno por respuesta solo mira envíos de hace más de 24 h.
    - El entrenamiento cuenta desde el primer lanzamiento.
    - Hoy cuenta todos los captados que esperan, no solo los de la primera página.

## Qué no se probó

- Nada se probó con personas reales ni con envíos: está prohibido y no hacía falta.
- El bot real con la IA (Gemini) no se volvió a correr después de los cambios. La capa fija, la llave de aceptación y el validador sí están probados.
- Accesibilidad: se revisó con lectores automáticos del código. La revisión visual en el celular, en claro y en oscuro, se hace en el recorrido de producción.

## Decidido después de publicar (15/11)

- **No hay pausa general.** Comprobado en la base: la pausa general está apagada desde el 16/10, los 5 bots están activos, el seguimiento está encendido en los 4 perfiles y la tarea de campañas está activa. Los bots responden siempre los mensajes entrantes; el seguimiento y lo programado siguen normal. Lo único que no arranca solo son las campañas con bases o publicidades: salen cuando se lanzan.
- **Crisis:** las líneas de ayuda salen siempre, también si una persona del equipo ya había tomado el chat (0625, probado en una transacción que se deshizo: el permiso sirve una sola vez).
- **Accesibilidad:** los dos detalles que quedaban (zonas con desplazamiento que no se podían recorrer con el teclado y enlaces chicos en «Perfiles») quedaron corregidos.
