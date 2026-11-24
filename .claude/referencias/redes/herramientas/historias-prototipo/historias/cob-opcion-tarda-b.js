// Coberturas · cob-opcion-tarda-b (22/11 10:30): Lucía, en Caballito, pide el cambio de obra social y espera tenerla enseguida.
// Variante B: abre en cenital sobre el papel, paleta clara, celular con funda menta. Irreal: cae una lupa enorme como una ventana.
import {armarCob, BOSQUE, cartelPared} from './cob-base.js';
const linea = k => `<rect x="-138" y="-188" width="276" height="166" fill="#f8fcf9"/><text x="-120" y="-158" font-family="Manrope" font-weight="800" font-size="20" fill="${BOSQUE}">Mi cambio</text><path d="M-110,-110 L110,-110" stroke="#c9dccf" stroke-width="8" stroke-linecap="round"/>${['Pedido', 'En trámite', 'Nueva'].map((s, i) => `<circle cx="${-110 + i * 110}" cy="-110" r="14" fill="${i <= k ? BOSQUE : '#c9dccf'}"/><text x="${-110 + i * 110}" y="-74" font-family="Manrope" font-weight="700" font-size="15" fill="#1f2a2a" text-anchor="middle">${s}</text>`).join('')}<text x="0" y="-40" font-family="Manrope" font-weight="700" font-size="15" fill="#587268" text-anchor="middle">Mientras tanto, seguís con la actual</text>`;
export const armar = V => armarCob(V, {escena: 'depto', pared: '#f4f6ef', funda: '#8EB69B', celuFondo: '#eef8f1',
  slot2: cartelPared({titulo: 'MI CAMBIO', items: 3}),
  diaSemana: 'domingo', notif: {app: 'Tu obra social', titulo: 'Recibimos tu pedido', texto: 'Tu solicitud de cambio está en trámite. Te avisamos cuando rija.', fondo: ['#5c8f7a', '#DAF1DE']},
  carta: {remite: 'Opción de cambio', titulo: 'Tu pedido de cambio', l1: 'El cambio no es inmediato: preguntá desde', l2: 'cuándo rige y seguí usando la actual.', fondo: '#eef8f1'},
  doc: 'Opción de cambio', objeto: 'lupa', gigante: {cielo: ['#7fc9a8', '#2f7a64', '#14463a']}, pantalla: k => linea(k)});
