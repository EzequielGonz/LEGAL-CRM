// Coberturas · cob-plan-uso-a (21/11 20:50, reemplazo aprobado del tema del aumento): Gabriel, en el comedor de los Ferreyra en Villa Urquiza,
// cuenta con la lupa las prestaciones que la familia nunca usó. Irreal: cae un celular gigante sobre la lista del plan.
import {armarCob, BOSQUE} from './cob-base.js';
const ICON = ['Consultas', 'Guardia', 'Odontología', 'Óptica', 'Kinesio', 'Cirugía', 'Psicología', 'Viajes'];
const panel = k => `<rect x="-138" y="-188" width="276" height="166" fill="#f4fbf5"/>${ICON.map((s, i) => { const x = -128 + (i % 2) * 134, y = -178 + Math.floor(i / 2) * 39; const usa = [0, 1, 2, 6].includes(i);
  return `<rect x="${x}" y="${y}" width="124" height="32" rx="8" fill="${k === 2 ? (usa ? BOSQUE : '#e6ebe8') : '#cfe6da'}"/><text x="${x + 62}" y="${y + 22}" font-family="Manrope" font-weight="700" font-size="15" fill="${k === 2 && !usa ? '#9aa79f' : (k === 2 ? '#fff' : '#1f2a2a')}" text-anchor="middle">${s}</text>`; }).join('')}`;
export const armar = V => armarCob(V, {escena: 'comedor', pared: '#e4ead9', sofa: '#8EB69B',
  slot2: `<g transform="translate(400,640)"><rect x="-150" y="-170" width="300" height="340" rx="14" fill="#fbfaf6"/><rect x="-150" y="-170" width="300" height="60" rx="14" fill="${BOSQUE}"/><text x="0" y="-130" font-family="Manrope" font-weight="800" font-size="26" fill="#fff" text-anchor="middle">LO QUE USAMOS</text>${[0, 1, 2, 3].map(j => `<rect x="-120" y="${-80 + j * 60}" width="34" height="34" rx="6" fill="none" stroke="${BOSQUE}" stroke-width="4"/>${j < 2 ? `<path d="M-114,${-64 + j * 60} l8,9 l16,-18" stroke="${BOSQUE}" stroke-width="5" fill="none"/>` : ''}<rect x="-70" y="${-70 + j * 60}" width="${150 - j * 20}" height="14" rx="7" fill="#b3beb8"/>`).join('')}</g>`,
  diaSemana: 'sábado', notif: {app: 'Tu cobertura', titulo: 'Resumen de tu plan', texto: 'Mirá todo lo que incluye tu plan y lo que usaste este año.'},
  carta: {remite: 'Tu plan · Prestaciones', titulo: 'Qué incluye tu plan', l1: 'Consultas, guardia, estudios, odontología,', l2: 'óptica, kinesiología, viajes y más servicios.'},
  doc: 'Lo que incluye tu plan', objeto: 'celu', pantalla: k => panel(k)});
