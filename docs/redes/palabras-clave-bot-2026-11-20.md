# Palabras clave de redes en el rol del bot · tanda del 20/11/2026

Pedido de la responsable (20/11): sumar las palabras clave nuevas del calendario del 25/11 al 04/12 **sin pisar nada**. Cada bloque se agregó al final de `ai_agents.system_prompt`; el resto del texto quedó igual.

| Área | Palabras |
| --- | --- |
| civil (VITA) | DESPIDO, LIQUIDACION, AGUINALDO, REGISTRO, REFORMA, TELEGRAMA, CERTIFICADO, PENAL |
| penal (VITA) | PENAL |
| coberturas_medicas | BAJA, CORTE |
| agencia_0km | ENERO |
| marketing | CHECKLIST |

- **Copia del texto anterior:** en `ai_agent_prompt_history`, con la nota «Antes de sumar las palabras clave de redes del 20/11/2026».
- **Registro del cambio:** en `ops_change_log`, con la acción `agregar_palabras_clave_redes`; el bloque agregado figura en `after.agregado_al_final`.
- **Para quitarlo:** borrar el bloque del final de las instrucciones desde el panel, o restaurar la copia previa.
- **Comprobado:** los 5 bots siguen activos. El largo de las instrucciones aumentó solo en lo agregado: agencia_0km pasó de 5.592 a 6.108 caracteres, civil de 8.019 a 9.530, coberturas_medicas de 5.837 a 6.504 y marketing de 16.308 a 16.881. Penal quedó en 2.056.
