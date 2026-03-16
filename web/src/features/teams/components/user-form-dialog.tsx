"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addUserSchema, AddUserSchema } from "../schema/user-schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddUserSchema) => void;
  initialData?: Partial<AddUserSchema>;
  isLoading?: boolean;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: UserFormDialogProps) {
  const isEdit = !!initialData?.username;

  const form = useForm<AddUserSchema>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      role: "worker",
      division: "Unsetting",
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(isEdit ? {
        ...initialData,
        password: "",
        confirmPassword: "",
      } : {
        fullName: "",
        username: "",
        email: "",
        role: "worker",
        division: "",
        password: "",
        confirmPassword: "",
      });
    }

    if(isEdit){
      form.setValue("password", "EditValue123")
      form.setValue("confirmPassword", "EditValue123")
    }
  }, [open, isEdit, initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEdit ? "Update user details." : "Register a new organization member."}
          </DialogDescription>
        </DialogHeader>

        <form id="user-form" onSubmit={form.handleSubmit(onSubmit, (e) => console.error(e))}>
          <FieldGroup className="space-y-4 py-4">
            {/* Row 1: Name & Username */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input {...field} placeholder="John Doe" aria-invalid={fieldState.invalid} className="bg-slate-700 border-slate-800" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Username</FieldLabel>
                    <Input {...field} placeholder="johndoe" disabled={isEdit} aria-invalid={fieldState.invalid} className="bg-slate-700 border-slate-800" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Email */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Email</FieldLabel>
                  <Input {...field} type="email" placeholder="john@example.com" aria-invalid={fieldState.invalid} className="bg-slate-700 border-slate-800" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Role & Division */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Role</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-700 border-slate-800">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-800 text-white">
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="division"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Division</FieldLabel>
                    <Input {...field} placeholder="Engineering" aria-invalid={fieldState.invalid} className="bg-slate-700 border-slate-800" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Password Section - Only for New User */}
            {!isEdit && (
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Password</FieldLabel>
                      <Input {...field} type="password" aria-invalid={fieldState.invalid} className="bg-slate-700 border-slate-800" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Confirm Password</FieldLabel>
                      <Input {...field} type="password" aria-invalid={fieldState.invalid} className="bg-slate-700 border-slate-800" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            )}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-800 text-slate-400">
            Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
            {isLoading ? "Saving..." : isEdit ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}