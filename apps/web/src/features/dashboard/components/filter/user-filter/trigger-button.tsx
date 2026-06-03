import { ProfileIdAndUsername } from "@/hooks/resources/use-username";
import React, { forwardRef } from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  avatarStack: ProfileIdAndUsername[];
  selectedUser: string;
}

export const UserFilterTriggerButton = forwardRef<HTMLButtonElement, Props>(
  ({ avatarStack, selectedUser, ...props }, ref) => {
    return (
      <button ref={ref} {...props} className="cursor-pointer border border-gray-600 bg-gray-800/80 hover:bg-gray-700 transition rounded-lg px-3 py-2 shadow-sm">
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
    );
  },
);

UserFilterTriggerButton.displayName = "UserFilterTriggerButton"