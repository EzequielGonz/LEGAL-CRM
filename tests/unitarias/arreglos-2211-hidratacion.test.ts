import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { duracionCuenta, numeroDeCifra, textoDeCuenta } from "../../src/lib/cifras-animadas";

// Hidratación (22/11): el contador de cifras y el HTML válido del rediseño.

test("la cuenta se escribe con separador de miles argentino, igual que el servidor", () => {
  assert.equal(textoDeCuenta(1234, 1), "1.234");
  assert.equal(textoDeCuenta(1234, 1), (1234).toLocaleString("es-AR"));
  assert.equal(textoDeCuenta(1234567, 1), "1.234.567");
  assert.equal(textoDeCuenta(50, 0), "0");
  assert.equal(textoDeCuenta(10, 0.5), "5");
});

test("solo cuentan las cifras limpias", () => {
  assert.equal(numeroDeCifra("12"), 12);
  assert.equal(numeroDeCifra(" 1.234 "), 1234);
  assert.equal(numeroDeCifra("0"), null);
  assert.equal(numeroDeCifra("—"), null);
  assert.equal(numeroDeCifra("12 %"), null);
  assert.equal(numeroDeCifra("1.23"), null);
  assert.equal(numeroDeCifra("10000000"), null);
});

test("la duración queda entre 420 y 900 ms", () => {
  assert.ok(duracionCuenta(1) >= 420);
  assert.equal(duracionCuenta(9_999_999), 900);
});

test("el contador no agrega nodos ni reescribe texto dentro de lo que maneja React", () => {
  const fuente = readFileSync(join(__dirname, "../../src/components/ui/efectos-vidrio.tsx"), "utf8");
  assert.ok(!/appendChild|createElement|textContent\s*=/.test(fuente), "debe tocar solo atributos y clases, nunca hijos ni texto");
});

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const r = join(dir, n);
    return statSync(r).isDirectory() ? archivos(r) : n.endsWith(".tsx") ? [r] : [];
  });
}

test("ningún <p> envuelve a un Kicker (que ya es un <p>): <p> dentro de <p> es HTML inválido", () => {
  const malos = archivos(join(__dirname, "../../src")).filter((f) =>
    readFileSync(f, "utf8")
      .split("\n")
      .some((l) => {
        const i = l.indexOf("<Kicker");
        if (i < 0) return false;
        const antes = l.slice(0, i);
        // hay un <p abierto en la misma línea, antes del Kicker, sin cerrar
        return (antes.match(/<p[\s>]/g) ?? []).length > (antes.match(/<\/p>/g) ?? []).length;
      }),
  );
  assert.deepEqual(malos, []);
});
