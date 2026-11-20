// Autos · remake de «autos-anticipo-b»: la calculadora queda en blanco. Cocina de Villa Crespo, Juli; cámara en mano; giro: las hojas forman el 0 km.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Anticipo grande o cuota baja:<br><em>la calculadora decide</em>', lugar: 'cocina', habla: 'juli', noche: true, pjs: [{id: 'juli', x: 700, flip: 1}], mano: 'calculadora', objeto: 'calculadora', titulo: '= ?', labels: ['Lo de hoy', 'Cuota cómoda', 'Costo total'], doc: 'Anticipo o cuota', gobj: 'calculadora', giro: 'hojas', cam: 'mano', grade: 'noche'});
