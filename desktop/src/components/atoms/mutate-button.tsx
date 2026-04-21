import { KeyedMutator } from "swr";
import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { writeLogToDb } from "@/utils/write-log-to-db"; // Pastikan path import benar

interface Props<T> {
  mutate?: KeyedMutator<T>;
  onMutateSuccess?: () => void;
  context?: string;
}

export function MutateButton<T>({
  mutate,
  onMutateSuccess,
  context = "MutateButton"
}: Props<T>) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mutateHandler = async () => {
    if (!mutate) return;

    try {
      setIsLoading(true);
      await mutate();
      onMutateSuccess?.();

    } catch (error) {
      console.error(error);

      await writeLogToDb({
        context: context,
        level: "ERROR",
        message: error instanceof Error ? error.message : "Unknown mutate error",
        metadata: {
          error: error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={isLoading}
      size={"icon"}
      onClick={mutateHandler}
      title="Refresh Data"
      type="button"
    >
      <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
    </Button>
  );
}