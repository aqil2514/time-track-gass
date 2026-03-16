import { Controller, useForm } from "react-hook-form";
import { addUserSchema, AddUserSchema } from "../../schema/user-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  defaultValues?: Partial<AddUserSchema>;
  onSubmit: (values: AddUserSchema) => Promise<void> | void;
}

export function UserForm({ defaultValues, onSubmit }: Props) {
  const isEdit = !!defaultValues;
  const form = useForm<AddUserSchema>({
    resolver: zodResolver(addUserSchema),
    defaultValues: defaultValues ?? {
      fullName: "",
      username: "",
      email: "",
      role: "worker",
      division: "Unsetting",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isEdit) {
      // Supaya bypass client side validation
      form.setValue("password", "EditValue123");
      form.setValue("confirmPassword", "EditValue123");
    }
  }, [isEdit, form]);

  const isLoading = form.formState.isSubmitting;

  return (
    <form
      id="user-form"
      onSubmit={form.handleSubmit(onSubmit, (e) => console.error(e))}
    >
      <FieldGroup className="space-y-4 py-4">
        {/* Row 1: Name & Username */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Full Name</FieldLabel>
                <Input
                  {...field}
                  placeholder="John Doe"
                  aria-invalid={fieldState.invalid}
                  className="bg-slate-700 border-slate-800"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Username</FieldLabel>
                <Input
                  {...field}
                  placeholder="johndoe"
                  disabled={isEdit}
                  aria-invalid={fieldState.invalid}
                  className="bg-slate-700 border-slate-800"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
              <Input
                {...field}
                type="email"
                placeholder="john@example.com"
                aria-invalid={fieldState.invalid}
                className="bg-slate-700 border-slate-800"
              />
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="division"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Division</FieldLabel>
                <Input
                  {...field}
                  placeholder="Engineering"
                  aria-invalid={fieldState.invalid}
                  className="bg-slate-700 border-slate-800"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                  <Input
                    {...field}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-700 border-slate-800"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    className="bg-slate-700 border-slate-800"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        )}
        <Button
          type="submit"
          form="user-form"
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </Button>
      </FieldGroup>
    </form>
  );
}
