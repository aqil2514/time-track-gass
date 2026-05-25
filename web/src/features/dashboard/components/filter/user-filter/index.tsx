"use client";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { UserFilterTriggerButton } from "./trigger-button";
import { UserList } from "./user-list";
import { useUserFilter } from "./logics";
import { DivisionFilter } from "./division-filter";

export function DashboardUserFilter() {
  const {
    isLoading,
    avatarStack,
    hoverName,
    search,
    selectedUser,
    setHoverName,
    setSearch,
    filteredUsers,
    allDivisions,
    selectedDivision,
    setSelectedDivision,
  } = useUserFilter();

  if (isLoading) {
    return (
      <div className="flex w-fit items-center border border-gray-600 bg-gray-800/80 rounded-lg px-3 py-2">
        <div className="size-6 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <UserFilterTriggerButton
          avatarStack={avatarStack}
          selectedUser={selectedUser}
        />
      </PopoverTrigger>

      <PopoverContent className="bg-gray-800 border border-gray-600 w-[320px] space-y-4 p-4">
        <PopoverHeader>
          <PopoverTitle className="text-white">Filter by User</PopoverTitle>

          <PopoverDescription className="text-gray-400">
            Select a user to see their activity.
          </PopoverDescription>
        </PopoverHeader>

        <Separator className="bg-gray-700" />
        <div className="space-y-1">
          <DivisionFilter
            allDivisions={allDivisions}
            selectedDivision={selectedDivision}
            setSelectedDivision={setSelectedDivision}
          />
          <Input
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
          />
        </div>

        <UserList
          filteredUsers={filteredUsers}
          selectedUser={selectedUser}
          setHoverName={setHoverName}
        />

        <Separator className="bg-gray-700" />

        <p className="text-center text-white font-semibold text-sm tracking-wide">
          {hoverName}
        </p>
      </PopoverContent>
    </Popover>
  );
}
