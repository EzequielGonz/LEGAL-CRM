// Coberturas · cob-aguinaldo-aportes-b (21/11 10:30): Gabriel, en la cocina de los Ferreyra en Villa Urquiza, mira el recibo del aguinaldo
// y ve un descuento que no esperaba. Variante B: abre en el final (plano irreal primero), naipes gigantes que caen, grado oro.
import {armarCob, BOSQUE, heladera} from './cob-base.js';
const recibo = k => `<rect x="-138" y="-188" width="276" height="166" fill="#fffdf6"/><text x="-120" y="-158" font-family="Manrope" font-weight="800" font-size="20" fill="${BOSQUE}">Recibo · Aguinaldo</text>${['Haberes', 'Jubilación', 'Obra social', 'Otros'].map((s, i) => `<rect x="-124" y="${-146 + i * 30}" width="248" height="26" rx="5" fill="${i === 2 && k ? '#bff0d4' : 'transparent'}"/><text x="-116" y="${-127 + i * 30}" font-family="Manrope" font-weight="${i === 2 ? 800 : 600}" font-size="18" fill="#1f2a2a">${s}</text><rect x="40" y="${-138 + i * 30}" width="70" height="10" rx="5" fill="#b3beb8"/>`).join('')}`;
export const armar = V => armarCob(V, {escena: 'cocina', pared: '#f3e3cc', az1: '#f4fbf5', az2: '#d8ead9', alacena: '#8EB69B',
  slot2: heladera({x: 390, c: '#f4f1ea', imanes: 6}),
  enMano: `<g transform="rotate(-62)"><rect x="-6" y="-60" width="100" height="110" rx="4" fill="#fffdf6"/>${[0, 1, 2, 3, 4].map(j => `<rect x="6" y="${-46 + j * 18}" width="${54 + (j % 3) * 12}" height="6" rx="3" fill="${j === 2 ? '#2f9c6a' : '#b3beb8'}"/>`).join('')}</g>`,
  diaSemana: 'sábado', notif: {app: 'Recibo digital', titulo: 'Tu recibo del aguinaldo', texto: 'Ya podés ver el detalle de haberes y descuentos.'},
  carta: {remite: 'Recibo de haberes · Aguinaldo', titulo: 'Haberes y descuentos', l1: 'Descuentos de ley: aporte jubilatorio y', l2: 'aporte a tu obra social, también en el aguinaldo.'},
  doc: 'Recibo del aguinaldo', objeto: 'naipes', pantalla: k => recibo(1)});
