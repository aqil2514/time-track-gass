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
  const [selectedDivision, setSelectedDivision] = useState("Semua");
  const [search, setSearch] = useState<string>("");

  const allDivisions = [
    "Semua",
    ...Array.from(
      new Set<string>(
        data.map((d) => d.division).filter((d) => d && d.trim() !== ""),
      ),
    ).sort(),
  ];

  const filteredUsers = useMemo(() => {
    return data.filter((user) => {
      const matchesSearch = user.username
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesDivision =
        selectedDivision === "Semua" || user.division === selectedDivision;

      return matchesSearch && matchesDivision;
    });
  }, [search, data, selectedDivision]);

  const avatarStack = useMemo(() => {
    return [
      data.find((u) => u.username === selectedUser),
      ...data.filter((u) => u.username !== selectedUser),
    ]
      .filter((u): u is ProfileIdAndUsername => Boolean(u))
      .slice(0, 3);
  }, [data, selectedUser]);

  return {
    isLoading,
    avatarStack,
    selectedUser,
    search,
    setSearch,
    setHoverName,
    hoverName,
    filteredUsers,
    allDivisions,
    selectedDivision,
    setSelectedDivision,
  };
}
