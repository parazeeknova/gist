self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    // ignore parse errors
  }

  const title = data.title ?? "Verso";
  const options = {
    badge: "/verso.png",
    body: data.body ?? "",
    icon: "/verso.png",
    tag: "verso-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return self.clients.openWindow("/home");
    })(),
  );
});
