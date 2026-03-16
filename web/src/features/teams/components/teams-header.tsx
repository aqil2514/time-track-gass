"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserFormDialog } from "./user-form-dialog";
import { AddUserSchema } from "../schema/user-schema";
import { useSWRConfig } from "swr";
import axios, { isAxiosError } from "axios";

export function TeamsHeader() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { mutate } = useSWRConfig();

  const handleAddUser = async (data: AddUserSchema) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/user", data);

      if (response.status === 200 || response.status === 201) {
        mutate("/api/user"); 
        setIsOpen(false);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to create user";
        console.error("Add user error:", errorMessage);
      } else {
        console.error("An unexpected error occurred:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Team Management</h1>
        <p className="text-slate-500 text-sm">Manage your organization members and their roles.</p>
      </div>

      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>

      <UserFormDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        onSubmit={handleAddUser}
        isLoading={isSubmitting}
      />
    </div>
  );
}