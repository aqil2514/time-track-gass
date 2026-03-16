import { AuthUser } from "@/@types/auth";
import { TeamControllerState } from "../reducer/reducer-teams.interface";

export function filterData(
  rawData: AuthUser[],
  controllers: TeamControllerState,
) {
  if (!rawData || !Array.isArray(rawData)) return [];

  const { divisionFilter, roleFilter, searchValue: search } = controllers;
  const searchTerm = search.toLowerCase();

  const filteredData = rawData.filter((user) => {
    const fullName = user.full_name?.toLowerCase() || "";
    const email = user.email?.toLowerCase() || "";
    const username = user.username?.toLowerCase() || "";
    const division = user.division || ""; // Fallback ke string kosong

    const matchesSearch =
      fullName.includes(searchTerm) ||
      email.includes(searchTerm) ||
      username.includes(searchTerm);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesDivision =
      divisionFilter === "all" || division === divisionFilter;

    return matchesSearch && matchesRole && matchesDivision;
  });

  return filteredData;
}
