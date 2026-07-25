self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title ?? "Preis-Alarm";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? "",
      data: { url: data.url ?? "/dashboard/watchlist" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard/watchlist";
  event.waitUntil(clients.openWindow(url));
});
