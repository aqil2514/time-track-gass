import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface CardContainerProps {
  title: string;
  children?: React.ReactNode;
  description?: string;
}

export function CardContainer({
  title,
  children,
  description,
}: CardContainerProps) {
  return (
    <Card className="w-full max-w-md bg-slate-800 border border-slate-700 shadow-xl rounded-2xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold text-white">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-slate-400">
            Login to enter Time Track Supervisor
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-slate-300 text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}
