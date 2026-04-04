import { useForm } from "react-hook-form";
import { addUserSchema, AddUserSchema } from "../../schema/user-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FieldGroup,
} from "@/components/ui/field";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldSelect } from "@/components/forms/form-field-select";
import { DivisionForm } from "./division-form";
import { FormFieldPassword } from "@/components/forms/form-field-password";

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
      division: "2",
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
          <FormFieldText name="fullName" form={form} label="Full Name" />
          <FormFieldText name="username" form={form} label="Username" />
        </div>

        {/* Email */}
        <FormFieldText name="email" form={form} label="Email" />

        {/* Role & Division */}
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSelect
            form={form}
            name="role"
            label="Role"
            options={[
              {
                label: "Worker",
                value: "worker",
              },
              {
                label: "Supervisor",
                value: "supervisor",
              },
            ]}
          />
          <DivisionForm form={form} />
        </div>

        {/* Password Section - Only for New User */}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <FormFieldPassword
              form={form}
              name="password"
              label="Password"
              showForgotPassword={false}
            />
            <FormFieldPassword
              form={form}
              name="confirmPassword"
              label="Confirm Password"
              showForgotPassword={false}
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
