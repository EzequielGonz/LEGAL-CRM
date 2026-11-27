#!/usr/bin/env bash
# Al arrancar cada sesión: vuelca al contexto lo esencial del cerebro para releer el negocio.
# Orden del dueño (20/11/2026): releer y entender el negocio y sus expectativas siempre,
# aprender y actualizar la memoria constantemente y sumar roles, skills y plugins que sirvan.
RAIZ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
C="$RAIZ/cerebro"
[ -d "$C" ] || exit 0
seccion() { # archivo, título de sección (## ...): imprime desde ese título hasta el siguiente ##
  awk -v t="$2" '$0 ~ "^## "t {p=1; print; next} p && /^## / {exit} p {print}' "$1"
}
echo "=== CEREBRO DEL PROYECTO (se carga solo al arrancar) ==="
echo "Antes de responder: releé cerebro/README.md y cerebro/02-ordenes-vigentes.md completos, y el archivo temático de la tarea."
echo "Durante el trabajo: todo dato, orden o corrección nueva del dueño se anota en el archivo del cerebro que corresponda en el momento."
echo "Al cerrar: 07-estado, 08-pendientes, bitacora; y revisar si conviene sumar roles, skills o plugins en 11-equipo-y-herramientas.md (SearchSkills / SearchPlugins)."
echo "Palabras clave del dueño: «accesos» → skill accesos (cerebro/17); «oficina» → skill oficina (procesar la Oficina de agentes); «memoria» → skill memoria (cargar perfil y memoria en claude.ai desde Chrome)."
echo "ARRANQUE OBLIGATORIO (Claude y subagentes): leer cerebro/00-arranque-para-agentes.md; usar todas las skills, plugins, conectores y agentes que sumen (mapa en cerebro/18); al delegar, pegar esa línea en el pedido."
echo "Mapa de skills, plugins y agentes por escritorio: cerebro/18-mapa-de-skills-y-plugins.md (usar todos los que sumen)."
echo
sed -n '/^# Cerebro/,$p' "$C/README.md" | head -60
echo
seccion "$C/02-ordenes-vigentes.md" "La única restricción"
seccion "$C/02-ordenes-vigentes.md" "Comunicación con"
seccion "$C/02-ordenes-vigentes.md" "Lo que no quiere"
echo
echo "--- Estado verificado: $(grep -m1 '^verificado:' "$C/07-estado-verificado.md" | sed 's/verificado: //') (si tiene más de 24 h, volver a comprobar en la base)"
echo
seccion "$C/08-pendientes-y-plan.md" "P0"
echo
echo "--- Última entrada de la bitácora:"
awk '/^## /{if(p)exit; if($0 ~ /^## [0-9]/)p=1} p{print}' "$C/bitacora.md"
