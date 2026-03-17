import {
  ProfileIdAndUsername,
  useUsername,
} from "@/hooks/resources/use-username";
import { useQueryParams } from "@/hooks/use-query-params";
import { useMemo, useState } from "react";

export function useUserFilter() {
  const { data, isLoading } = useUsername();
  const { get } = useQueryParams();

  const selectedUser = get("user") ?? "";
  const [hoverName, setHoverName] = useState<string>(selectedUser);
  const [search, setSearch] = useState<string>("");

  const filteredUsers = useMemo(() => {
    return data.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, data]);

  const avatarStack = useMemo(() => {
    return [
      data.find((u) => u.username === selectedUser),
      ...data.filter((u) => u.username !== selectedUser),
    ]
      .filter((u): u is ProfileIdAndUsername => Boolean(u))
      .slice(0, 3);
  }, [data, selectedUser]);

  return {isLoading, avatarStack, selectedUser, search, setSearch, setHoverName,hoverName, filteredUsers}
}
