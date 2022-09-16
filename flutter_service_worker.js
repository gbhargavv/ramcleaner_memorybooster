'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "2a8ea33fc0b1bfa0075da7f883e9cb4d",
"index.html": "9e8d9bb78567df101b0cbd668123169a",
"/": "9e8d9bb78567df101b0cbd668123169a",
"main.dart.js": "d696e75e6c8618c813d8ff021def6925",
"flutter.js": "f85e6fb278b0fd20c349186fb46ae36d",
"favicon.png": "9cef8ef9689b719479cdd57814f0ae3b",
"icons/Icon-192.png": "9e2d3a5275502b813b8839533e531ae0",
"icons/Icon-maskable-192.png": "9e2d3a5275502b813b8839533e531ae0",
"icons/Icon-maskable-512.png": "5ebdfa2179d96f51732033eafa59e819",
"icons/Icon-512.png": "5ebdfa2179d96f51732033eafa59e819",
"manifest.json": "675839352e2e61062296c858de584241",
"assets/AssetManifest.json": "70c5a6d9809f0e5dc8258ec08fecad71",
"assets/NOTICES": "c4f37664d78bd4dea9b4d724a32a4935",
"assets/FontManifest.json": "c2d67bbd8772122598a68156dfe7d894",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/shaders/ink_sparkle.frag": "4beb5ad835d2684fb3e013e8f071088e",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/assets/images/ss_7.png": "467aab789a11bbb9c1acb5bf31b4692b",
"assets/assets/images/ss_6.png": "b044c980bfdecab0bdbf78b588b5b79a",
"assets/assets/images/ss_4.png": "1373638fd17e8023bf39bcfd71730dbb",
"assets/assets/images/ss_5.png": "1b01c63b4b4c4522f2fa43028a4a064e",
"assets/assets/images/ss_1.png": "4686a143142b400c6ab0ed9f2a6ae06b",
"assets/assets/images/ss_play_store_1.jpg": "ed4b093ed182522239dd3df4c4bb7573",
"assets/assets/images/ic_cleaner.png": "ec403914b6f13efa09373ecadb7cb93e",
"assets/assets/images/ss_2.png": "73c350b00398ed44ae278ab82644cf44",
"assets/assets/images/ss_3.png": "3eae7511d98904d5338073a5f7fe19c0",
"assets/assets/images/ic_info.png": "ec974b863c97d810fb0c21d5551e1e1e",
"assets/assets/images/ic_boost.png": "a9e3c8619233fc5848564b6a9e6bc60a",
"assets/assets/images/ic_app_icon.png": "0bc01647a49f91b2a436effd052957b5",
"assets/assets/images/playstore.png": "bfcaa9d1f13760156db17166ebd9fb43",
"assets/assets/images/ic_battery.png": "4e7dd9f74f1066d52ce98bb7162bd5da",
"assets/assets/images/ic_banner.jpg": "362e438dad007fd9d0ca9280d2a9f321",
"assets/assets/fonts/proxima_nova_regular.otf": "410504d49238e955ba7dc23a7f963021",
"assets/assets/fonts/proxima_nova_bold.otf": "62d4d7d369292a9bf23762465ec6d704",
"assets/assets/fonts/proxima_nova_thin.otf": "8f0bc01ce5e5becef482d277cb72b728",
"canvaskit/canvaskit.js": "2bc454a691c631b07a9307ac4ca47797",
"canvaskit/profiling/canvaskit.js": "38164e5a72bdad0faa4ce740c9b8e564",
"canvaskit/profiling/canvaskit.wasm": "95a45378b69e77af5ed2bc72b2209b94",
"canvaskit/canvaskit.wasm": "bf50631470eb967688cca13ee181af62"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
