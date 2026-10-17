/*
 * Service worker del panel (bloque 1.9): app instalable y avisos web.
 * No guarda en caché datos del CRM (fichas, conversaciones, cifras): solo
 * una página "sin conexión" para cuando no hay red. Los avisos se muestran
 * aunque la página esté cerrada (según lo que permita cada sistema) y al
 * tocarlos se abre el registro correcto; si la sesión se cerró, el panel
 * pide el PIN y después continúa hacia ese registro.
 */
const OFFLINE_CACHE = "panel-sin-conexion-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Solo las navegaciones: si falla la red, se muestra la página sin conexión.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.open(OFFLINE_CACHE).then((cache) => cache.match(OFFLINE_URL)))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Panel", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Panel";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || undefined,
      icon: "/marca/icono-192.png",
      badge: "/marca/insignia-96.png",
      data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/telefono" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/telefono";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if ("focus" in w && "navigate" in w) {
          return w.navigate(url).then((nw) => (nw || w).focus());
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
