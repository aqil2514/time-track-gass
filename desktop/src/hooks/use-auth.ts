import { User } from "@/@types/user";
import { buildUrl } from "@/utils/build-url";
import axios from "axios";
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

    axios
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
