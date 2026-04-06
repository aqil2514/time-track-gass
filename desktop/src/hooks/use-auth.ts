import { User } from "@/@types/user";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { load, Store } from "@tauri-apps/plugin-store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

let store: null | Store = null;

const getStore = async () => {
  if (!store) store = await load("auth.json");
  return store;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const url = buildUrl("auth/me");

  const navigate = useNavigate();

  const logoutHandler = async () => {
    const store = await getStore();
    await store.delete("accessToken");
    await store.save();
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const store = await getStore();
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

  return { loading, user, logoutHandler };
}
