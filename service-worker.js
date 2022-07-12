const cacheName = "version5";

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      cache.addAll([
        "/my-pwa/",
        "/my-pwa/index.html",
        "/my-pwa/images/images.png",
        "/my-pwa/css/style.css",
        "/my-pwa/manifest.json",
        "/my-pwa/js/script.js",
        "/my-pwa/icons/favicon-32x32.png",
        "/my-pwa/icons/apple-touch-icon-144x144.png",
      ]);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      console.log(cacheNames);
      cacheNames.forEach((element) => {
        if (element !== cacheName) {
          caches.delete(element);
        }
      });
    })
  );
  //send message to all clients
  
});

self.addEventListener("fetch", function (event) {
  if (!event.request.url.startsWith("https://firestore.googleapis.com/")) {
    event.respondWith(
      caches.open(cacheName).then(function (cache) {
        return cache.match(event.request).then(function (cachedResponce) {
          const fetchedResponce = fetch(event.request).then(function (
            networkResponce
          ) {
            cache.put(event.request, networkResponce.clone());
            return networkResponce;
          });

          return cachedResponce || fetchedResponce;
        });
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  let message = "";
  switch (event.action) {
    case "Agree":
      message = "So we both agree on that!";
      break;
    case "Disagree":
      message = "Let's agree to disagree.";
      break;
    case "":
      message = "You've gotta click one button in the notification.";
      break;
  }
  clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
      console.log("Sent: ", message);
    });
  });
});


self.addEventListener("push", (event)=>{
  console.log("SW listens to push event: ", event);
  
  const data = event.data.json();
  console.log("SW listens to push event data: ", data);
  event.waitUntil(
  self.registration.showNotification(data.title, 
    {
      body: data.description,
      icon: data.icon,
      image: data.image
    })
  );
});

