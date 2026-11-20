// Autos · «0 km: costos que no ves en la lista»: showroom, Mati lee el ticket de Leo; giro: el bombo gigante en la vereda.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: '0 km: costos que<br><em>no ves en la lista</em>', lugar: 'showroom', habla: 'mati', pjs: [{id: 'mati', x: 600, flip: 1}, {id: 'leo', x: 860, flip: -1}], mano: '', objeto: 'ticket', titulo: 'PRESUPUESTO', labels: ['Flete', 'Formularios y patente', 'Sellos'], doc: 'Precio de lista', gobj: 'llave', giro: 'bombo', giroPj: 'leo', grade: 'frio'});
