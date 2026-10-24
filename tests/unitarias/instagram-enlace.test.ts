import { test } from "node:test";
import assert from "node:assert/strict";
import { usuarioDeInstagram } from "@/lib/redes/instagram-enlace";

test("Instagram por enlace: acepta enlace o @usuario", () => {
  assert.equal(usuarioDeInstagram("https://www.instagram.com/Kocos.Marketing/?hl=es"), "kocos.marketing");
  assert.equal(usuarioDeInstagram("instagram.com/estudio_vita"), "estudio_vita");
  assert.equal(usuarioDeInstagram("@autos0km"), "autos0km");
  assert.equal(usuarioDeInstagram("https://www.instagram.com/p/ABC123/"), null);
  assert.equal(usuarioDeInstagram("https://facebook.com/x"), null);
  assert.equal(usuarioDeInstagram(""), null);
});
