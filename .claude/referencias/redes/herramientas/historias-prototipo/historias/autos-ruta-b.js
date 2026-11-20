// Autos · «Primera ruta con el 0 km» (B de ruta): vereda de Villa Crespo cargando el auto; abre en el primer plano de la lista; giro: la póliza avión de papel.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Primera ruta con el 0 km:<br><em>revisá antes de cargar el baúl</em>', lugar: 'vereda', habla: 'mati', autoColor: '#1f6fc2',
  pjs: [{id: 'mati', x: 620, flip: 1}, {id: 'juli', x: 820, flip: -1}], mano: 'linterna', manoAlivio: '', objeto: 'checklist', titulo: 'ANTES DE SALIR',
  labels: ['Papeles y póliza', 'Luces y niveles', 'Cubiertas y auxilio'], doc: 'Antes de salir', gobj: 'poliza', giro: 'avion', giroPj: 'juli', ap: 'objeto', cam: 'mano', grade: 'calido'});
