"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTeams } from "../providers/teams.provider";
import { TitleAndSub } from "@/components/atoms/title-and-sub";

export function TeamsHeader() {
  const { dispatch } = useTeams();


  return (
    <div className="flex items-center justify-between">
      <TitleAndSub title="Team Management" sub="Manage your organization members and their roles." />

      <Button
        onClick={() => dispatch({ type: "OPEN_ADD_USER_MODAL" })}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
}
