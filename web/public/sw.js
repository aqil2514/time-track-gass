const sendNotification = (title, body) => {
  self.registration.showNotification(title, {
    body: body,
    vibrate: [200, 100, 200],
    tag: "pengingat-supervisor",
  });
};

setInterval(() => {
  const now = new Date();
  const hrs = now.getHours();
  const mins = now.getMinutes();

  const currentTime = `${hrs}:${mins.toString().padStart(2, "0")}`;

  sendNotification("Test Notifikasi", "Ini test notifikasi");
  console.log(currentTime)

  if (currentTime === "11:00") {
    sendNotification(
      "Cek Batch Pagi",
      "Pastikan semua sudah Start Session (min. 2-3 jam).",
    );
  } else if (currentTime === "15:00") {
    sendNotification(
      "Cek Batch Siang",
      "Rawan lupa! Aktifkan sesi setelah istirahat.",
    );
  } else if (currentTime === "17:00") {
    sendNotification(
      "Final Check",
      "Verifikasi akhir sebelum operasional tutup.",
    );
  }
}, 60000);
