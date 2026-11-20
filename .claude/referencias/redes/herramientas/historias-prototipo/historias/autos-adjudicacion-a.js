// Autos · «Plan de ahorro: sorteo o licitación»: cocina de Villa Crespo, Juli y Mati con dos fichas; giro: la ficha gigante rueda por Av. Corrientes.
import {kit} from './autos-kit.js';
export const armar = V => kit(V, {hook: 'Plan de ahorro:<br><em>sorteo o licitación</em>', lugar: 'cocina', habla: 'mati', pjs: [{id: 'juli', x: 600, flip: 1}, {id: 'mati', x: 880, flip: -1}], mano: '', objeto: 'checklist', titulo: 'ADJUDICACIÓN', labels: ['Sorteo', 'Licitación', 'Requisitos'], doc: 'Plan de ahorro', gobj: 'ficha', giro: 'moneda'});
