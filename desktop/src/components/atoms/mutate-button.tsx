import { KeyedMutator } from "swr";
import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface Props<T> {
  mutate?: KeyedMutator<T>;
  onMutateSuccess?: () => void;
}

export function MutateButton<T>({
  mutate,
  onMutateSuccess
}: Props<T>) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mutateHandler = async () => {
    if (!mutate) return;

    try {
      setIsLoading(true);
      await mutate();
      onMutateSuccess?.()

    } catch (error) {
      console.error(error);
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
      <RefreshCcw className={cn(isLoading && "animate-spin")} />
    </Button>
  );
}
