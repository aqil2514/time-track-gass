"use client";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useQueryParams } from "@/hooks/use-query-params";
import { ProfileIdAndUsername, useUsername } from "@/hooks/resources/use-username";
import { LoadingSpinner } from "@/components/atoms/loading-spinner";

export function DashboardUserFilter() {
  const { data, isLoading } = useUsername();
  const { get, set } = useQueryParams();

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

  if(isLoading) return <LoadingSpinner />

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="cursor-pointer border border-gray-600 bg-gray-800/80 hover:bg-gray-700 transition rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Avatar Stack */}
            <div className="flex -space-x-2">
              {avatarStack.slice(0, 3).map((item, i) => (
                <div
                  key={item.username}
                  className="size-8 flex items-center justify-center rounded-full bg-green-500 border-2 border-gray-900 text-white transition-all duration-300 capitalize"
                  style={{ zIndex: 10 - i }}
                >
                  {item.username[0]}
                </div>
              ))}
            </div>

            {/* Selected User */}
            <div className="text-white text-sm font-medium">
              {!!selectedUser ? selectedUser : "No Selected"}
            </div>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="bg-gray-800 border border-gray-600 w-[320px] space-y-4 p-4">
        <PopoverHeader>
          <PopoverTitle className="text-white">Filter by User</PopoverTitle>

          <PopoverDescription className="text-gray-400">
            Select a user to see their activity.
          </PopoverDescription>
        </PopoverHeader>

        <Separator className="bg-gray-700" />
        <Input
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
        />

        {/* Scroll User */}
        <ScrollArea className="pb-4">
          <div className="flex gap-3 py-2">
            {filteredUsers.length === 0 ? (
              <p className="text-gray-300 font-semibold">User not found</p>
            ) : (
              filteredUsers.map((item) => {
                const isSelected = selectedUser === item.username;

                return (
                  <button
                    key={item.username}
                    onClick={() => set("user", item.username)}
                    onMouseEnter={() => setHoverName(item.username)}
                    onMouseLeave={() => setHoverName(selectedUser)}
                    className={`cursor-pointer size-10 flex items-center justify-center rounded-full border-2 text-white font-semibold transition-all duration-200
                  ${
                    isSelected
                      ? "border-green-400 scale-110 bg-green-500"
                      : "border-gray-600 bg-gray-700 hover:scale-105 hover:bg-gray-600"
                  }
                  `}
                  >
                    {item.username.slice(0,2).toUpperCase()}
                  </button>
                );
              })
            )}
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Separator className="bg-gray-700" />

        {/* Hover Name */}
        <p className="text-center text-white font-semibold text-sm tracking-wide">
          {hoverName}
        </p>
      </PopoverContent>
    </Popover>
  );
}
