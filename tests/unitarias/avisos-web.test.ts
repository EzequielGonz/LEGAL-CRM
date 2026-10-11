import test from "node:test";
import assert from "node:assert/strict";
import { createDecipheriv, createECDH, createHmac, generateKeyPairSync, randomBytes, verify } from "node:crypto";

import { b64urlDecode, b64urlEncode, encryptPayload, vapidJwt, vapidConfig } from "@/lib/webpush";

// Vectores del RFC 8291, apéndice A.
const RFC = {
  plaintext: "When I grow up, I want to be a watermelon",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  uaPublic: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  authSecret: "BTBZMqHH6r4Tts7J_aSIgg",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  message:
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};

test("avisos web: cifrado igual al ejemplo del RFC 8291", () => {
  const out = encryptPayload(Buffer.from(RFC.plaintext), RFC.uaPublic, RFC.authSecret, {
    asPrivate: b64urlDecode(RFC.asPrivate),
    salt: b64urlDecode(RFC.salt),
  });
  assert.equal(b64urlEncode(out), RFC.message);
});

function hmac(key: Buffer, data: Buffer) {
  return createHmac("sha256", key).update(data).digest();
}

test("avisos web: el dispositivo descifra lo que se envía (ida y vuelta)", () => {
  const ua = createECDH("prime256v1");
  ua.generateKeys();
  const auth = randomBytes(16);
  const msg = JSON.stringify({ title: "Aviso de prueba", url: "/telefono" });
  const body = encryptPayload(Buffer.from(msg), b64urlEncode(ua.getPublicKey()), b64urlEncode(auth));

  // Lado del navegador (RFC 8291/8188).
  const salt = body.subarray(0, 16);
  assert.equal(body.readUInt32BE(16), 4096);
  const idlen = body.readUInt8(20);
  const asPublic = body.subarray(21, 21 + idlen);
  const ct = body.subarray(21 + idlen);
  const shared = ua.computeSecret(asPublic);
  const ikm = hmac(hmac(auth, shared), Buffer.concat([Buffer.from("WebPush: info\0"), ua.getPublicKey(), asPublic, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01", "binary")).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0\x01", "binary")).subarray(0, 12);
  const d = createDecipheriv("aes-128-gcm", cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  assert.equal(plain[plain.length - 1], 2, "delimitador de último registro");
  assert.equal(plain.subarray(0, plain.length - 1).toString(), msg);
});

test("avisos web: el JWT de VAPID se verifica con la clave pública", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwk = privateKey.export({ format: "jwk" }) as any;
  const pub = Buffer.concat([Buffer.from([4]), b64urlDecode(jwk.x), b64urlDecode(jwk.y)]);
  const cfg = { publicKey: b64urlEncode(pub), privateKey: jwk.d, subject: "https://panel.ejemplo" };
  const jwt = vapidJwt("https://fcm.googleapis.com", cfg, 1_800_000_000);
  const [h, p, s] = jwt.split(".");
  assert.deepEqual(JSON.parse(b64urlDecode(h).toString()), { typ: "JWT", alg: "ES256" });
  const claims = JSON.parse(b64urlDecode(p).toString());
  assert.equal(claims.aud, "https://fcm.googleapis.com");
  assert.equal(claims.exp, 1_800_000_000 + 12 * 3600);
  assert.ok(verify("sha256", Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, b64urlDecode(s)));
});

test("avisos web: sin claves la función queda deshabilitada y dice qué falta", () => {
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.VAPID_SUBJECT;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const r = vapidConfig();
  assert.equal(r.config, null);
  assert.deepEqual(r.missing, ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT (mailto: o https:)"]);
});
