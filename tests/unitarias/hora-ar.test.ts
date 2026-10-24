import { test } from "node:test";
import assert from "node:assert/strict";
import { inicioDelDiaAR } from "@/lib/hora-ar";

test("inicio del día en Argentina", () => {
  // 24/10 22:30 AR = 25/10 01:30 UTC → sigue siendo el 24 en Argentina.
  assert.equal(inicioDelDiaAR(new Date("2026-10-25T01:30:00Z")).toISOString(), "2026-10-24T03:00:00.000Z");
  // 25/10 00:10 AR = 03:10 UTC → ya es el 25.
  assert.equal(inicioDelDiaAR(new Date("2026-10-25T03:10:00Z")).toISOString(), "2026-10-25T03:00:00.000Z");
  // 24/10 02:00 AR = 05:00 UTC.
  assert.equal(inicioDelDiaAR(new Date("2026-10-24T05:00:00Z")).toISOString(), "2026-10-24T03:00:00.000Z");
});
