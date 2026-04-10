"use client";

import { useEffect } from "react";

export function NotifService() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    const requestPermission = async () => {
      if (Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
    };

    requestPermission();

    const sendNotification = (title: string, body: string, tag:string) => {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          tag,
        });
      }
    };

    const interval = setInterval(() => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();

      const currentTime = `${hrs}:${mins.toString().padStart(2, "0")}`;

      if (currentTime === "11:00") {
        sendNotification(
          "Cek Batch Pagi",
          "Pastikan semua sudah Start Session (min. 2-3 jam).",
          "check-morning"
        );
      } else if (currentTime === "15:00") {
        sendNotification(
          "Cek Batch Siang",
          "Rawan lupa! Aktifkan sesi setelah istirahat.",
          "check-afternoon"
        );
      } else if (currentTime === "17:00") {
        sendNotification(
          "Final Check",
          "Verifikasi akhir sebelum operasional tutup.",
          "final-check"
        );
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
