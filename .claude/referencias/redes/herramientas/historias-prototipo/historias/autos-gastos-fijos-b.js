// Autos · «Cuota más seguro, patente y cochera» (B de gastos-fijos): cocina de Villa Crespo; abre por el final; giro: la llave gigante gira y la cámara pasa por el llavero.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Cuota + seguro + patente + cochera:<br><em>hacé la cuenta completa</em>', lugar: 'cocina', habla: 'juli', pjs: [{id: 'juli', x: 720, flip: 1}], mano: 'calculadora', objeto: 'calculadora', titulo: 'CUENTA', labels: ['Seguro', 'Patente', 'Cochera'], doc: 'La cuenta completa', gobj: 'calculadora', giro: 'llavegira', ap: 'final', grade: 'oro'});
