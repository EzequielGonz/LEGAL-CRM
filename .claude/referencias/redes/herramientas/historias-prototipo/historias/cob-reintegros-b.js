// Coberturas · «Reintegros» B (20/11 16:30): dato primero (el ticket bajo la lupa), después el caso de Vero en la cocina de Villa Urquiza.
// Giro irreal: la valija gigante cae sobre la cartilla; cámara de empuje rápido.
import {armarCob, BOSQUE} from './cobkit.js';
const ok = (y, w) => `<circle cx="-110" cy="${y}" r="14" fill="${BOSQUE}"/><path d="M-117,${y} l6,6 l11,-12" stroke="#fff" stroke-width="4" fill="none"/><rect x="-86" y="${y - 7}" width="${w}" height="14" rx="7" fill="#587268"/>`;
export const armar = V => armarCob(V, {pj: 'vero', q: 'vero', orden: 'dato', cam: 'empuje', grade: 'calido',
  hook: 'Ese ticket de la consulta:<br><em>¿pediste el reintegro?</em>',
  lugar: {tipo: 'cocina', cal: 'PLAZO'},
  doc: {tipo: 'ticket', remite: 'CONSULTORIO', titulo: 'Consulta médica', chico: ['Conservá este comprobante', 'para pedir tu reintegro.'], lupa: [470, 915]},
  prop: `<g transform="rotate(-70)"><path d="M-6,-50 L50,-50 L50,30 l-7,6 l-7,-6 l-7,6 l-7,-6 l-7,6 l-7,-6 l-8,6 Z" fill="#f7f6f1"/><rect x="2" y="-40" width="38" height="6" rx="3" fill="#888"/><rect x="2" y="-26" width="28" height="6" rx="3" fill="#888"/><rect x="2" y="-12" width="34" height="6" rx="3" fill="#888"/></g>`,
  pantallas: ['', '', ok(-150, 160) + ok(-110, 120) + ok(-70, 180)],
  gdoc: 'Cartilla', obj: 'valija'});
