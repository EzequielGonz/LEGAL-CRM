// Autos · «La carpeta del 0 km» (B de documentacion): showroom, Juli y Leo; abre con la llave que gira; giro: bombo gigante en la vereda.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'La carpeta del 0 km:<br><em>lo que no puede faltar</em>', lugar: 'showroom', habla: 'juli',
  pjs: [{id: 'juli', x: 600, flip: 1}, {id: 'leo', x: 860, flip: -1}], mano: 'carpeta', objeto: 'carpeta', titulo: 'CARPETA DEL 0 KM',
  labels: ['Factura y título', 'Cédula y póliza', 'Manual y garantía'], doc: 'Carpeta del 0 km', gobj: 'carpeta', giro: 'bombo', ap: 'llave', cam: 'empuje', grade: 'frio'});
