import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contraste, mezclar } from "@/lib/premium/contraste";
import { ACENTO_RUBRO, FONDO_PREMIUM, NOMBRE_RUBRO, TEXTO_PREMIUM, RUBROS_PREMIUM } from "@/lib/premium/rubros";

const css = readFileSync(join(process.cwd(), "src/app/premium.css"), "utf8");
const variable = (nombre: string) => {
  const m = new RegExp(`${nombre}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  assert.ok(m, `falta ${nombre} en premium.css`);
  return m![1].toUpperCase();
};

test("premium · la paleta de rubros.ts coincide con premium.css", () => {
  for (const r of RUBROS_PREMIUM) {
    assert.equal(variable(`--pm-ac-${r}`), ACENTO_RUBRO[r].toUpperCase(), r);
  }
  assert.equal(variable("--pm-fondo"), FONDO_PREMIUM.toUpperCase());
  assert.equal(variable("--pm-texto"), TEXTO_PREMIUM.primario.toUpperCase());
  assert.equal(variable("--pm-texto-2"), TEXTO_PREMIUM.secundario.toUpperCase());
  assert.equal(variable("--pm-texto-3"), TEXTO_PREMIUM.terciario.toUpperCase());
  assert.equal(RUBROS_PREMIUM.length, 4);
  for (const r of RUBROS_PREMIUM) assert.ok(NOMBRE_RUBRO[r]);
});

test("premium · cada rubro tiene su clase de acento en el CSS", () => {
  for (const r of RUBROS_PREMIUM) assert.match(css, new RegExp(`\\.pm-rubro-${r}\\s*\\{`));
});

test("premium · contraste AA: texto y acentos sobre el fondo y sobre la tarjeta", () => {
  const sup1 = variable("--pm-sup-1");
  const sup2 = variable("--pm-sup-2");
  for (const fondo of [FONDO_PREMIUM, sup1, sup2]) {
    assert.ok(contraste(TEXTO_PREMIUM.primario, fondo) >= 7, `primario sobre ${fondo}`);
    assert.ok(contraste(TEXTO_PREMIUM.secundario, fondo) >= 7, `secundario sobre ${fondo}`);
    assert.ok(contraste(TEXTO_PREMIUM.terciario, fondo) >= 4.5, `terciario sobre ${fondo}`);
    for (const r of RUBROS_PREMIUM) assert.ok(contraste(ACENTO_RUBRO[r], fondo) >= 4.5, `${r} sobre ${fondo}`);
  }
  // Texto del botón de acento (fondo oscuro sobre el acento).
  for (const r of RUBROS_PREMIUM) assert.ok(contraste(FONDO_PREMIUM, ACENTO_RUBRO[r]) >= 7, `botón ${r}`);
  for (const estado of ["--pm-ok", "--pm-error", "--pm-atencion", "--pm-info"]) {
    assert.ok(contraste(variable(estado), sup1) >= 4.5, estado);
  }
});

test("premium · AA del texto sobre el vidrio: peor caso con la nube más clara debajo", () => {
  // Capas del vidrio (premium.css): velo oscuro al 62 % y blanco al 10 % arriba (el más claro del degradé).
  const nubes = ["#2A1A5E", "#7A2A5A", "#1F5F5A", "#3A2A8A", "#7A5F5E"]; // la última mezcla lo más claro de las nubes
  assert.match(css, /--pm-velo:\s*rgba\(10, 11, 18, 0\.62\)/);
  assert.match(css, /rgba\(255, 255, 255, 0\.1\), rgba\(255, 255, 255, 0\.05\)/);
  for (const nube of nubes) {
    const conVelo = mezclar("#0A0B12", 0.62, nube);
    const vidrio = mezclar("#FFFFFF", 0.1, conVelo);
    assert.ok(contraste(TEXTO_PREMIUM.primario, vidrio) >= 7, `primario sobre vidrio de ${nube}`);
    assert.ok(contraste(TEXTO_PREMIUM.secundario, vidrio) >= 4.5, `secundario sobre vidrio de ${nube}: ${contraste(TEXTO_PREMIUM.secundario, vidrio).toFixed(2)}`);
    // El acento solo se usa en gráficos (arco, tilde, foco): WCAG 1.4.11 pide 3:1.
    for (const r of RUBROS_PREMIUM) assert.ok(contraste(ACENTO_RUBRO[r], vidrio) >= 3, `${r} sobre vidrio de ${nube}: ${contraste(ACENTO_RUBRO[r], vidrio).toFixed(2)}`);
  }
  // Las nubes del CSS son las del pedido del dueño.
  for (const h of ["#2a1a5e", "#7a2a5a", "#1f5f5a"]) assert.ok(css.includes(h), `falta la nube ${h}`);
});

test("premium · el CSS respeta movimiento reducido y apaga el 3D en táctil", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
  // El relieve 3D y el parallax se apagan con movimiento reducido y en pantallas táctiles.
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{[\s\S]*\.pm-tarjeta--relieve:hover\s*\{\s*transform: none/);
  assert.match(css, /\.pm-fondo__capa,\s*\.pm-encabezado__capa\s*\{\s*transition: none !important; transform: none !important/);
  assert.match(css, /hover: none/);
  // Sombras en capas (contacto + media + larga) en las tarjetas.
  assert.match(css, /--pm-flota:\s*0 1px 2px rgba\(0, 0, 0, 0\.4\), 0 12px 32px -8px rgba\(0, 0, 0, 0\.55\), 0 32px 64px -24px rgba\(0, 0, 0, 0\.5\)/);
  // Blur del vidrio entre 20 y 28 px.
  const blur = /--pm-blur:\s*blur\((\d+)px\)/.exec(css);
  assert.ok(blur && +blur[1] >= 20 && +blur[1] <= 28);
});
