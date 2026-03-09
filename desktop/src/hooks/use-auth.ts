import { User } from "@/@types/user";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { load } from "@tauri-apps/plugin-store";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const url = buildUrl("auth/me");

useEffect(() => {
  const fetchUser = async () => {
    try {
      const store = await load("auth.json");
      const token = await store.get<string>("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      api
        .get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data.user))
        .catch(async (err) => {
          console.error(err);
          setUser(null);
          await store.delete("accessToken");
          await store.save();
        })
        .finally(() => setLoading(false));

    } catch (err) {
      // Tauri Store tidak tersedia (misal di browser)
      console.error("Store error:", err);
      setLoading(false); // ✅ pastikan loading berhenti
    }
  };

  fetchUser();
}, []);

  return { loading, user };
}