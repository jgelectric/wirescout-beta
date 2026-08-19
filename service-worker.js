const CACHE="wirescout-v6-recessed-options";
const ASSETS=["./","./index.html","./css/styles.css","./js/config.js","./js/templates.js","./js/db.js","./js/cloud.js","./js/translations.js","./js/app.js","./manifest.json","./icons/icon-192.svg","./icons/icon-512.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match("./index.html"))));});
