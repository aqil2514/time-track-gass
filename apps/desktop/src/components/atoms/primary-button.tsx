import { ButtonHTMLAttributes } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function PrimaryButton({ className, ...props }: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        "bg-purple-600 hover:bg-purple-700 text-white active:scale-95 duration-200 transition",
        className,
      )}

      {...props}
    ></Button>
  );
}
