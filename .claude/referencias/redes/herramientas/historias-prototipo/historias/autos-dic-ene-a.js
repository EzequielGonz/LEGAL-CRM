// Autos · «0 km: ¿diciembre o enero?»: cocina de Villa Crespo, Juli y Mati; giro: el 0 km sale del showroom en cámara lenta y frena frente a la cámara.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: '0 km:<br><em>¿diciembre o enero?</em>', lugar: 'cocina', habla: 'mati', pjs: [{id: 'mati', x: 620, flip: 1}, {id: 'juli', x: 880, flip: -1}], mano: '', objeto: 'calendario', titulo: 'PARA DECIDIR', labels: ['El año del modelo', 'Propuestas', 'Cuándo lo usás'], doc: 'Diciembre o enero', gobj: 'llave', giro: 'frenada', grade: 'oro'});
