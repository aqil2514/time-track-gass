import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProfileIdAndUsername } from "@/hooks/resources/use-username";
import { useQueryParams } from "@/hooks/use-query-params";
import { SetStateAction } from "react";

interface Props {
  filteredUsers: ProfileIdAndUsername[];
  setHoverName: (value: SetStateAction<string>) => void;
  selectedUser: string
}

export function UserList({ filteredUsers, setHoverName, selectedUser }: Props) {
      const { set } = useQueryParams();
    
  return (
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
                {item.username.slice(0, 2).toUpperCase()}
              </button>
            );
          })
        )}
      </div>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
