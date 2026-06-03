import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface TemplateContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}


export function TemplateContainer({children, className,...props}:TemplateContainerProps){
    return <div className={cn("w-full space-y-6 p-8", className)} {...props} >{children}</div>
}