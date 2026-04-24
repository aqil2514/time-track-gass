import { PrimaryButton } from "@/components/atoms/primary-button";
import { Loader2, Pause, Play } from "lucide-react";
import { useHomeContext } from "../../store/home.provider";
import { buildUrl } from "@/utils/build-url";
import api from "@/lib/api";
import { getToken } from "@/utils/get-token";
import { useState } from "react";

export function StartSessionButton() {
  const {
    controllerTime,
    fetcher: { mutate },
  } = useHomeContext();
  const { isRunning, startAutoCapture, stopAutoCapture } = controllerTime;
  const [isloading, setIsLoading] = useState(false);

  const handleStartSession = async () => {
    const token = await getToken();
    const url = buildUrl("work-session/start");
    try {
      setIsLoading(true);
      await api.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      await mutate();

      startAutoCapture();
    } catch (error) {
      console.error("Failed to start session:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSession = async () => {
    const token = await getToken();
    const url = buildUrl("work-session/end");
    try {
      setIsLoading(true);
      await api.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await mutate();

      stopAutoCapture();
    } catch (error) {
      console.error("Failed to start session:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clickHandler = async () => {
    isRunning ? await handleStopSession() : await handleStartSession();
  };

  return (
    <PrimaryButton onClick={clickHandler} disabled={isloading}>
      {isloading ? (
        <Loader2 className="animate-spin" />
      ) : isRunning ? (
        <Pause className="mr-2 h-4 w-4" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      {isRunning ? "Stop Session" : "Start Session"}
    </PrimaryButton>
  );
}
