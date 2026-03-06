import { User } from "@/@types/user";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { useEffect, useState } from "react";

export function useAuth() {
  const token = localStorage.getItem("accessToken");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const url = buildUrl("auth/me");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data.user);
      })
      .catch((err) => {
        console.error(err);
        setUser(null);
        localStorage.removeItem("accessToken");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return { loading, user };
}
