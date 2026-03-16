import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TeamsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Team Management</h1>
        <p className="text-slate-500 text-sm">Manage your organization members and their roles.</p>
      </div>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
}