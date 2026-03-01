import { cn } from "../../lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function MainContainer({
  children,
  className,
  ...props
}: ContainerProps) {
  return (
    <div className={cn("w-full min-h-screen bg-slate-100 p-4",className)} {...props}>
      {children}
    </div>
  );
}
