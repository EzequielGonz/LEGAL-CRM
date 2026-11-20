// Autos · remake de «autos-voto-b»: «¿primer auto 0 km o usado?». Showroom, Mati con la mano en el 0 km y las llaves del gris; giro: el 0 km frena frente a la cámara.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: '¿Primer auto 0 km o usado?<br><em>Elegí en 3 segundos</em>', lugar: 'showroom', habla: 'mati', pjs: [{id: 'mati', x: 720, flip: 1}], mano: 'llave', objeto: 'checklist', titulo: '0 KM O USADO', labels: ['Garantía', 'Lo de entrada', 'Cuánto lo usás'], doc: '0 km o usado', gobj: 'llave', giro: 'frenada', cam: 'empuje', grade: 'oro'});
