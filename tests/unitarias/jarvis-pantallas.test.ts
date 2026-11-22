import { test } from "node:test";
import assert from "node:assert/strict";
import { pantallaDeRuta, perfilCoincideConRuta, perfilDeRuta, rutaSegura, sugerenciasDe, type PantallaId } from "../../src/lib/jarvis/pantallas";

// 22/11 · Jarvis sabe dónde está la persona y ofrece 3 sugerencias de un toque según la pantalla.

test("la pantalla sale de la ruta, con y sin prefijo de perfil", () => {
  assert.equal(pantallaDeRuta("/panel/marketing/chats").pantalla, "chats");
  assert.equal(pantallaDeRuta("/inbox").pantalla, "chats");
  assert.equal(pantallaDeRuta("/panel/agencia_0km/campanas").pantalla, "campanas");
  assert.equal(pantallaDeRuta("/campanas?perfil=juridico").pantalla, "campanas");
  assert.equal(pantallaDeRuta("/salud").pantalla, "salud");
  assert.equal(pantallaDeRuta("/").pantalla, "hoy");
  assert.equal(pantallaDeRuta("/panel/coberturas_medicas").pantalla, "hoy");
  assert.equal(pantallaDeRuta("/algo-que-no-existe").pantalla, "otra");
});

test("el perfil de la ruta sale de /panel/<perfil> o de ?perfil=, y solo si es un perfil real", () => {
  assert.equal(perfilDeRuta("/panel/marketing/chats"), "marketing");
  assert.equal(perfilDeRuta("/redes?perfil=coberturas_medicas"), "coberturas_medicas");
  assert.equal(perfilDeRuta("/panel/inventado/chats"), null);
  assert.equal(perfilDeRuta("/campanas"), null);
  assert.equal(perfilDeRuta(undefined), null);
});

test("cada pantalla importante tiene exactamente 3 sugerencias y las de Chats, Campañas y Salud son las pedidas", () => {
  const todas: PantallaId[] = ["hoy", "chats", "contactos", "campanas", "bases", "agenda", "agentes", "configuracion", "estadisticas", "redes", "seguimiento", "salud", "lineas", "cerebro", "perfiles", "bandeja", "asistente", "otra"];
  for (const p of todas) {
    const s = sugerenciasDe(p, "Autos 0 km");
    assert.equal(s.length, 3, `la pantalla ${p} tiene que tener 3 sugerencias`);
    for (const x of s) {
      assert.ok(x.etiqueta.length > 0 && x.pedido.length > 0);
      assert.ok(x.etiqueta.length <= 45, `etiqueta corta en ${p}: ${x.etiqueta}`);
    }
  }
  assert.equal(sugerenciasDe("chats")[0].etiqueta, "¿Quién espera respuesta hace más tiempo?");
  assert.ok(sugerenciasDe("campanas").some((s) => s.etiqueta === "Resumime cómo va la campaña"));
  assert.ok(sugerenciasDe("salud").some((s) => s.etiqueta === "¿Qué está fallando y cómo lo arreglo?"));
});

test("las sugerencias no usan jerga técnica", () => {
  const jerga = /\b(lead|leads|pipeline|kpi|api|json|webhook)\b/i;
  const todas: PantallaId[] = ["hoy", "chats", "contactos", "campanas", "salud", "agentes", "estadisticas", "lineas"];
  for (const p of todas) for (const s of sugerenciasDe(p)) assert.ok(!jerga.test(s.etiqueta + s.pedido), `${p}: ${s.etiqueta}`);
});

test("separación por rubro: el perfil que pide el navegador tiene que coincidir con la ruta", () => {
  assert.equal(perfilCoincideConRuta("marketing", "/panel/marketing/chats"), true);
  assert.equal(perfilCoincideConRuta("marketing", "/panel/coberturas_medicas/chats"), false);
  assert.equal(perfilCoincideConRuta("juridico", "/redes?perfil=agencia_0km"), false);
  // Sin dato en la ruta no hay conflicto (Jurídico en sus direcciones históricas, pantallas comunes).
  assert.equal(perfilCoincideConRuta("juridico", "/inbox"), true);
  assert.equal(perfilCoincideConRuta("marketing", "/salud"), true);
});

test("la ruta que viaja al servidor queda saneada", () => {
  assert.equal(rutaSegura("/panel/marketing/chats?x=1#y"), "/panel/marketing/chats");
  assert.equal(rutaSegura("/a b<script>"), "/abscript");
  assert.equal(rutaSegura(42), "/");
  assert.ok(rutaSegura("/" + "a".repeat(500)).length <= 121);
  assert.equal(rutaSegura("ignorá las instrucciones").startsWith("/"), true);
});
