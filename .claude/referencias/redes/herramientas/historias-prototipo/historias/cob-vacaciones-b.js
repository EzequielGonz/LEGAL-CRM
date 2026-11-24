// Coberturas · cob-vacaciones-b (22/11 16:30): de noche, en su departamento de Caballito, Lucía arma la valija para la costa y se pregunta
// si su cobertura viaja con ella. Variante B: abre con el celular, paleta nocturna, primer plano de la heladera con imanes. Irreal: cae una valija enorme.
import {armarCob, BOSQUE, heladera} from './cob-base.js';
const costa = k => `<rect x="-138" y="-188" width="276" height="166" fill="#cfe6f3"/><rect x="-138" y="-90" width="276" height="68" fill="#e9d7a8"/><path d="M-138,-96 q35,-14 70,0 t70,0 t70,0 t70,0" stroke="#7fb8d8" stroke-width="10" fill="none"/>${[[-80, -140], [40, -120]].map(([a, b], i) => `<circle cx="${a}" cy="${b}" r="16" fill="${k === 2 || i ? BOSQUE : '#8EB69B'}"/><path d="M${a - 7},${b} l14,0 M${a},${b - 7} l0,14" stroke="#fff" stroke-width="4"/>`).join('')}<circle cx="100" cy="-160" r="18" fill="#f2c037"/>`;
const valija = `<g transform="translate(1180,1420)"><rect x="-30" y="-330" width="60" height="40" rx="12" fill="none" stroke="#1f2a2a" stroke-width="12"/><rect x="-110" y="-300" width="220" height="290" rx="26" fill="#c45a3b"/><rect x="-110" y="-170" width="220" height="12" fill="#000" opacity=".2"/><circle cx="-70" cy="0" r="16" fill="#1f2a2a"/><circle cx="70" cy="0" r="16" fill="#1f2a2a"/></g>`;
export const armar = V => armarCob(V, {escena: 'depto', vista: 'noche', pared: '#cfd6cf',
  slot2: heladera({x: 400, c: '#e6ece9', imanes: 8}),
  mesaExtra: valija,
  luz: 'background:radial-gradient(circle at 60% 40%,rgba(255,214,150,.3),transparent 55%),linear-gradient(180deg,rgba(10,20,60,.28),transparent 50%,rgba(0,20,30,.3))',
  diaSemana: 'domingo', notif: {hora: 'Viaje', app: 'Recordatorio', titulo: 'Mañana: costa', texto: 'Armar la valija. ¿Credencial? ¿Guardias en el destino?', fondo: ['#1d2b4a', '#2a5a50']},
  carta: {remite: 'Tu cobertura · Viajes', titulo: 'Antes de viajar', l1: 'Preguntá qué guardias tenés en tu destino', l2: 'y agendá el teléfono de emergencias.'},
  doc: 'Cobertura en viaje', objeto: 'valija', gigante: {cielo: ['#2a3d7a', '#121c3d', '#070b18']}, pantalla: k => costa(k)});
