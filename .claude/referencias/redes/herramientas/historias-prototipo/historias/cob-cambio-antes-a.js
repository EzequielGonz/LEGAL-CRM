// Coberturas · cob-cambio-antes-a (21/11 08:50): Lucía, en su departamento de Caballito frente a Parque Rivadavia, con dos folletos
// de prepagas genéricas, está por cambiarse solo por precio. Irreal: Lucía diminuta sobre la cartilla gigante y cae un folleto enorme.
import {armarCob, BOSQUE, cartelPared} from './cob-base.js';
const lista = ok => `<rect x="-138" y="-188" width="276" height="166" fill="#f4fbf5"/><text x="-120" y="-156" font-family="Manrope" font-weight="800" font-size="20" fill="${BOSQUE}">Antes de cambiarme</text>${['Mis médicos', 'Tratamientos', 'Carencias'].map((s, i) => `<rect x="-120" y="${-138 + i * 38}" width="26" height="26" rx="6" fill="${i < ok ? BOSQUE : '#fff'}" stroke="${BOSQUE}" stroke-width="3"/>${i < ok ? `<path d="M${-114},${-125 + i * 38} l6,7 l12,-14" stroke="#fff" stroke-width="4" fill="none"/>` : ''}<text x="-82" y="${-118 + i * 38}" font-family="Manrope" font-weight="700" font-size="20" fill="#1f2a2a">${s}</text>`).join('')}`;
export const armar = V => armarCob(V, {escena: 'depto', pared: '#e8efe4',
  slot2: cartelPared({titulo: 'MI CARTILLA'}),
  mesaExtra: `<g transform="translate(700,1146)"><g transform="rotate(-10)"><rect x="-80" y="-14" width="140" height="14" rx="3" fill="#f4fbf5"/><rect x="-80" y="-14" width="140" height="5" fill="${BOSQUE}"/></g><g transform="rotate(8) translate(50,-6)"><rect x="-80" y="-14" width="140" height="14" rx="3" fill="#fff"/><rect x="-80" y="-14" width="140" height="5" fill="#c45a3b"/></g></g>`,
  enMano: `<g transform="rotate(-62)"><rect x="-6" y="-70" width="92" height="120" rx="6" fill="#f4fbf5"/><rect x="-6" y="-70" width="92" height="22" rx="6" fill="#c45a3b"/>${[0, 1, 2, 3].map(j => `<rect x="6" y="${-38 + j * 20}" width="${50 + (j % 2) * 18}" height="7" rx="3" fill="#a9c9b6"/>`).join('')}</g>`,
  diaSemana: 'sábado', notif: {app: 'Correo', titulo: 'Dos propuestas de planes', texto: 'Mirá las opciones que pediste para comparar.'},
  carta: {remite: 'Folleto · Plan nuevo', titulo: 'Cartilla y condiciones', l1: 'Antes de pasarte, revisá la cartilla, los', l2: 'tratamientos en curso y las carencias.'},
  doc: 'Cartilla nueva', objeto: 'folleto', pantalla: k => lista(k === 1 ? 2 : 3)});
