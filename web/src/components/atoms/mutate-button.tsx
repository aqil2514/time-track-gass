import { KeyedMutator } from "swr";
import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

interface Props<T> {
  mutate?: KeyedMutator<T>;
  onMutateSuccess?: () => void;
  size?: ButtonSize;
}

export function MutateButton<T>({ mutate, onMutateSuccess, size = "icon" }: Props<T>) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mutateHandler = async () => {
    if (!mutate) return;

    try {
      setIsLoading(true);
      await mutate();
      onMutateSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={isLoading}
      size={size}
      variant={"outline"}
      onClick={mutateHandler}
      title="Refresh Data"
      type="button"
      className={cn(
        "bg-slate-900/40 border-slate-700 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300",
        isLoading && "opacity-80"
      )}
    >
      <RefreshCcw 
        className={cn(
          "w-4 h-4 transition-transform", 
          isLoading && "animate-spin text-purple-400"
        )} 
      />
    </Button>
  );
}