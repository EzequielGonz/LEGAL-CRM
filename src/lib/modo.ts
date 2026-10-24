/** Modo de color del panel (24/10). Sin dependencias del navegador: lo usa el layout del servidor. */
export type Modo = "oscuro" | "claro";
export const CLAVE_MODO = "panel-modo";

/** Script en línea para <head>: aplica el modo guardado antes de pintar (oscuro por defecto). */
export const SCRIPT_MODO = `(function(){try{var m=localStorage.getItem("${CLAVE_MODO}");document.documentElement.dataset.modo=m==="claro"?"claro":"oscuro";}catch(e){document.documentElement.dataset.modo="oscuro";}})();`;
