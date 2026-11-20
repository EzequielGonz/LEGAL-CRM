// Coberturas · cob-recibo-b-r1 (21/11 16:30, remake de «cob-recibo-b»): Gabriel dobla el recibo de sueldo sin leerlo y la lupa menta
// se lo despliega. Arranca por el final (caída entre hojas), órbita lateral inversa, grado cálido; cae una lupa gigante sobre el recibo.
import {armarCob, BOSQUE} from './cob-base.js';
import {calendario} from '../historia/decor.js';
const recibo = k => `<rect x="-138" y="-188" width="276" height="166" fill="#fffdf6"/><text x="-120" y="-158" font-family="Manrope" font-weight="800" font-size="20" fill="${BOSQUE}">Recibo de sueldo</text>${['Haberes', 'Jubilación', 'Obra social', 'Sindicato'].map((s, i) => `<rect x="-124" y="${-146 + i * 30}" width="248" height="26" rx="5" fill="${i === 2 ? (k === 2 ? '#7fe0a8' : '#bff0d4') : 'transparent'}"/><text x="-116" y="${-127 + i * 30}" font-family="Manrope" font-weight="${i === 2 ? 800 : 600}" font-size="18" fill="#1f2a2a">${s}</text><rect x="40" y="${-138 + i * 30}" width="70" height="10" rx="5" fill="#b3beb8"/>`).join('')}`;
export const armar = V => armarCob(V, {escena: 'cocina', pared: '#f6dcc2', az1: '#fff3e6', az2: '#f1d9c0', alacena: '#c45a3b', mesa: '#a8825c',
  slot2: calendario({x: 400, y: 640, s: 1.0, dia: 'COBRO', mes: 'NOVIEMBRE', acento: '#c45a3b'}),
  enMano: `<g transform="rotate(-58)"><rect x="-6" y="-40" width="100" height="60" rx="4" fill="#fffdf6"/><path d="M-6,-10 L94,-10" stroke="#b3beb8" stroke-width="3"/><rect x="6" y="2" width="60" height="8" rx="3" fill="#2f9c6a"/></g>`,
  diaSemana: 'sábado', notif: {app: 'Recibo digital', titulo: 'Tu recibo de sueldo', texto: 'Ya está disponible. Revisá haberes y descuentos.', fondo: ['#6b3b2a', '#d9a37e']}, celuFondo: '#f6e3cf',
  carta: {remite: 'Recibo de haberes', titulo: 'La línea del aporte', l1: 'Aporte a la obra social: sale de tu sueldo', l2: 'y va a tu cobertura. Fijate a cuál va.', fondo: '#f6e3cf'},
  doc: 'Recibo de sueldo', objeto: 'lupa', caida: {fondo: ['#7a3b2a', '#1f0d08'], raya: '#ffd9b8', acento: '#7fe0a8'}, pantalla: k => recibo(k)});
