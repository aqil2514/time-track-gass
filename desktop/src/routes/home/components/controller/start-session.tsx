import { PrimaryButton } from "@/components/atoms/primary-button";
import { Pause, Play } from "lucide-react";
import { useHomeContext } from "../../store/home.provider";

export function StartSessionButton() {
  const { controllerTime } = useHomeContext();
  const { isRunning, startAutoCapture, stopAutoCapture } = controllerTime;

  const clickHandler = () => {
    isRunning ? stopAutoCapture() : startAutoCapture();
  };

  return (
    <PrimaryButton onClick={clickHandler}>
      {isRunning ? (
        <Pause className="mr-2 h-4 w-4" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      {isRunning ? "Stop Session" : "Start Session"}
    </PrimaryButton>
  );
}
