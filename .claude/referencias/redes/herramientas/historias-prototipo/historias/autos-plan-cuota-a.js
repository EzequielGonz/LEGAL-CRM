// Autos · «Plan de ahorro: ¿por qué subió la cuota?»: Mati en la vereda de Villa Crespo con «el gris»; giro: el gris sube en el elevador de taller.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Plan de ahorro:<br><em>¿por qué subió la cuota?</em>', lugar: 'vereda', habla: 'mati', autoColor: '#8d939c',
  pjs: [{id: 'mati', x: 700, flip: 1}], mano: 'celu', objeto: 'celular', titulo: 'Resumen del plan',
  labels: ['Valor del modelo', 'Gastos y seguros', 'Cada renglón'], doc: 'Cuota del plan', gobj: 'calculadora', giro: 'elevador'});
