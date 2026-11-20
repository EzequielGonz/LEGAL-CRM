// Coberturas · cob-preexistencia-b-r1 (21/11 19:20, remake de «cob-preexistencia-b»): de noche, en la cocina de Villa Urquiza, Gabriel
// le lee a su mamá por teléfono la respuesta de la prepaga y frunce la frente. Abre con el celular, cámara que empuja, grado noche.
// Irreal: Gabriel diminuto sobre la respuesta gigante y cae una moneda enorme (sin cifras).
import {armarCob, BOSQUE} from './cob-base.js';
import {calendario} from '../historia/decor.js';
const resp = k => `<rect x="-138" y="-188" width="276" height="166" fill="#f4fbf5"/><text x="-120" y="-158" font-family="Manrope" font-weight="800" font-size="20" fill="${BOSQUE}">Antes de elegir</text>${['Declarar todo', 'Valor por escrito', 'Comparar planes'].map((s, i) => `<circle cx="-108" cy="${-128 + i * 38}" r="13" fill="${i <= k ? BOSQUE : '#c9dccf'}"/><text x="-86" y="${-121 + i * 38}" font-family="Manrope" font-weight="700" font-size="20" fill="#1f2a2a">${s}</text>`).join('')}`;
export const armar = V => armarCob(V, {escena: 'cocina', vista: 'noche', pared: '#d9dccf', piso: '#6b5040', az1: '#e9eee9', az2: '#cfdcd2', alacena: '#5c8f7a',
  slot2: calendario({x: 400, y: 640, s: 1.0, dia: 'MAMÁ', mes: 'LLAMAR', acento: BOSQUE}),
  luz: 'background:radial-gradient(circle at 55% 35%,rgba(255,214,150,.35),transparent 55%),linear-gradient(180deg,rgba(10,20,50,.25),transparent 50%,rgba(0,20,30,.3))',
  diaSemana: 'sábado', notif: {hora: 'Mamá', app: 'Mensajes', titulo: 'Mamá', texto: '¿Me leés lo que contestó la prepaga? No entiendo la letra chica.', fondo: ['#1d2b4a', '#2a5a50']},
  carta: {remite: 'Respuesta de la prepaga', titulo: 'Tu solicitud', l1: 'La declaración de salud se evalúa y puede', l2: 'definir un valor distinto para tu plan.'},
  doc: 'Respuesta de la prepaga', objeto: 'moneda', gigante: {cielo: ['#2a3d7a', '#121c3d', '#070b18']}, pantalla: k => resp(k)});
