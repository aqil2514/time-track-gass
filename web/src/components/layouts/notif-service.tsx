"use client";

import { useEffect } from "react";

export function NotifService() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => console.log("Service Worker aktif:", reg.scope))
            .catch((err) => console.error("Gagal daftar SW:", err));
        }
      });
    }
  }, []);
  return null;
}
