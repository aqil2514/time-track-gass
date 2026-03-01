import React from "react";
import {cn} from "../../lib/utils"

interface TitleProps extends React.HTMLAttributes<HTMLParagraphElement>{
    title:string
}
export function Title({ title, className, ...props }: TitleProps) {
  return <h1 className={cn('text-2xl font-semibold',className)} {...props} >{title}</h1>;
}
