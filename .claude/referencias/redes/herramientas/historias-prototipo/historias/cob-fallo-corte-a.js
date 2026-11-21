// Coberturas · cob-fallo-corte-a (21/11 13:50): Gabriel, en la cocina de los Ferreyra en Villa Urquiza, ve en el celular la noticia
// del fallo de la Corte sobre las prepagas. Irreal: el celular vibra y la heladera suelta los imanes en cámara lenta; cae un mazo gigante.
// Solo lo publicado (fuente en el texto de la publicación). Sin interpretar el alcance ni inventar datos.
import {armarCob, BOSQUE, VERDE, heladera} from './cob-base.js';
const noticia = k => `<rect x="-138" y="-188" width="276" height="166" fill="#fbfbf7"/><rect x="-138" y="-188" width="276" height="30" fill="${VERDE}"/><text x="-124" y="-167" font-family="Manrope" font-weight="800" font-size="17" fill="#DAF1DE">NOTICIAS</text>
  <text x="-124" y="-132" font-family="Manrope" font-weight="800" font-size="19" fill="#1f2a2a">Fallo de la Corte</text><text x="-124" y="-110" font-family="Manrope" font-weight="800" font-size="19" fill="#1f2a2a">sobre las prepagas</text>${[0, 1, 2].map(j => `<rect x="-124" y="${-92 + j * 18}" width="${230 - j * 40}" height="8" rx="4" fill="#b3beb8"/>`).join('')}${k === 2 ? `<rect x="-124" y="-48" width="120" height="22" rx="11" fill="${BOSQUE}"/><text x="-64" y="-32" font-family="Manrope" font-weight="800" font-size="13" fill="#fff" text-anchor="middle">LEER COMPLETA</text>` : ''}`;
export const armar = V => armarCob(V, {escena: 'cocina', pared: '#e9efe8', az1: '#ffffff', az2: '#e3ebe6', alacena: '#c9a77f', imanesCaen: 1,
  slot2: heladera({x: 390, c: '#e9eef0', imanes: 9}), pantalla0: noticia(0),
  enMano: `<g transform="rotate(-60)"><rect x="-10" y="-48" width="96" height="62" rx="10" fill="${BOSQUE}"/><rect x="4" y="-38" width="40" height="8" rx="4" fill="#fff" opacity=".8"/><rect x="4" y="-22" width="64" height="6" rx="3" fill="#fff" opacity=".5"/><rect x="58" y="-2" width="20" height="12" rx="3" fill="#e5c76b"/></g>`,
  diaSemana: 'sábado', notif: {app: 'Noticias', titulo: 'Fallo sobre prepagas', texto: 'La Corte se pronunció sobre la liberación de precios de las prepagas.'},
  carta: {remite: 'Noticias · Lo que dijo la Corte', titulo: 'Fallo sobre prepagas', l1: 'La Corte declaró inconstitucional la liberación', l2: 'de precios de las prepagas. Leé la nota completa.'},
  doc: 'Fallo de la Corte', objeto: 'mazo', pantalla: k => noticia(k)});
