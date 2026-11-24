// Coberturas · cob-cartilla-guardia-a (22/11 13:50): Vero, de madrugada, en la sala de espera de una guardia genérica de Villa Urquiza,
// descubre que esa guardia no está en su cartilla. Irreal: Vero diminuta sobre la cartilla gigante y cae un reloj enorme. Cámara en mano, grado frío.
import {armarCob, BOSQUE} from './cob-base.js';
const mapa = k => `<rect x="-138" y="-188" width="276" height="166" fill="#e6efe9"/>${[...Array(7)].map((_, i) => `<path d="M${-138 + i * 46},-188 l16,166" stroke="#fff" stroke-width="6"/>`).join('')}<path d="M-138,-120 L138,-96" stroke="#fff" stroke-width="8"/><circle cx="-20" cy="-100" r="11" fill="#e8574a" stroke="#fff" stroke-width="3"/>${[[-90, -150], [60, -70], [100, -150]].map(([a, b], i) => `<circle cx="${a}" cy="${b}" r="16" fill="${k === 2 && i === 0 ? BOSQUE : '#8EB69B'}"/><path d="M${a - 7},${b} l14,0 M${a},${b - 7} l0,14" stroke="#fff" stroke-width="4"/>`).join('')}${k === 2 ? `<path d="M-20,-100 L-90,-150" stroke="${BOSQUE}" stroke-width="5" stroke-dasharray="8 6"/>` : ''}`;
export const armar = V => armarCob(V, {escena: 'guardia', funda: '#5c8f7a', celuFondo: '#cfe0e3',
  luz: 'background:linear-gradient(180deg,rgba(220,245,255,.25),transparent 40%,rgba(0,30,40,.3))',
  diaSemana: 'madrugada', notif: {hora: 'Guardia', app: 'Tu cobertura', titulo: 'Fuera de cartilla', texto: 'Esta guardia no figura en tu plan. Buscá la más cercana en tu cartilla.', fondo: ['#0f2a3a', '#2a5a50']},
  carta: {remite: 'Tu cartilla · Guardias', titulo: 'Guardias de tu plan', l1: 'Buscá por dirección la guardia más cercana', l2: 'a tu casa y agendala antes de necesitarla.', fondo: '#cfe0e3'},
  doc: 'Tu cartilla', objeto: 'reloj', gigante: {cielo: ['#1d3550', '#0d1a2c', '#050a14']}, caida: {fondo: ['#1d3550', '#050a14']}, pantalla: k => mapa(k)});
