// Autos · «Retiro del 0 km: revisá antes de firmar»: showroom el día del retiro, Juli con la linterna; giro: el showroom se da vuelta.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Retiro del 0 km:<br><em>revisá antes de firmar</em>', lugar: 'showroom', habla: 'juli', pjs: [{id: 'juli', x: 620, flip: 1}, {id: 'leo', x: 880, flip: -1}], mano: 'linterna', manoAlivio: 'lapicera', objeto: 'checklist', titulo: 'ANTES DE FIRMAR', labels: ['Chasis y motor', 'Chapa y pintura', 'Accesorios y kit'], doc: 'Contrato de entrega', gobj: 'lapicera', giro: 'invertido'});
