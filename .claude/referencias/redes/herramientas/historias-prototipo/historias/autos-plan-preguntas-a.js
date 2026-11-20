// Autos · «Plan de ahorro: preguntá esto antes»: showroom, Juli con la lapicera sobre el contrato y Leo; giro: la cuota sube en un ascensor de vidrio.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Plan de ahorro:<br><em>preguntá esto antes</em>', lugar: 'showroom', habla: 'juli', pjs: [{id: 'juli', x: 600, flip: 1}, {id: 'leo', x: 860, flip: -1}], mano: 'lapicera', objeto: 'checklist', titulo: 'ANTES DE FIRMAR', labels: ['Cómo se adjudica', 'Qué incluye la cuota', 'Si te bajás'], doc: 'Contrato del plan', gobj: 'lapicera', giro: 'ascensor'});
