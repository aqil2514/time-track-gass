import { PrimaryButton } from "@/components/atoms/primary-button";
import { Upload, ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HourSlot } from "./hour-slot";
import { UploadImageForm, UploadImageFormProps } from "./form";
import React, { useMemo, useState } from "react";
import { UploadImageInput } from "@/routes/home/schema/upload-image.schema";
import { load } from "@tauri-apps/plugin-store";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { platform } from "@tauri-apps/plugin-os";
import { useFetch } from "@/hooks/use-fetch";
import { RightSideHaveData } from "./right-have-data";
import { RightNoSlotId } from "./right-no-slot-id";
import { RightLoadingState } from "./right-loading-state";
import { RightErrorState } from "./right-error-state";
import { RightSideProgress } from "./right-side-progress-state";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { isAxiosError } from "axios";

export interface ErrorDataMap {
  filename: string;
  reason: string;
}

type ProgressStatus = "verified" | "progress" | "not-found";

export function UploadImage() {
  const {
    fetcher: { date },
  } = useHomeContext();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [errorData, setErrorData] = useState<ErrorDataMap[]>([]);

  const isCanFetch = useMemo(
    () => !!date && selectedSlot !== null,
    [date, selectedSlot],
  );

  const url = useMemo(
    () =>
      isCanFetch
        ? buildUrl(
            `image-upload/manual?slotId=${selectedSlot}&date=${date?.toISOString()}`,
          )
        : null,
    [isCanFetch, selectedSlot, date],
  );

  const { data, isLoading, isValidating, error, mutate } = useFetch<{
    status: ProgressStatus;
  }>(url);

  const status: ProgressStatus = useMemo(
    () => (data?.status ? data.status : "not-found"),
    [data],
  );

  const handleUpload = async (values: UploadImageInput) => {
    setErrorData([]);
    const store = await load("auth.json");
    const token = await store.get<string>("accessToken");
    const os = platform();

    if (!token) {
      throw new Error("Access token not found");
    }

    const valuesWithOs = {
      ...values,
      os,
    };

    try {
      const res = await api.postForm(
        buildUrl(`image-upload/manual?date=${date?.toISOString()}`),
        valuesWithOs,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 422) return setErrorData(res.data.invalidImages);
      await mutate();
    } catch (error) {
      if (isAxiosError(error)) {
        console.error(error.message);
      }
      throw error;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <PrimaryButton>
          <Upload className="mr-2 h-4 w-4" /> Upload Image
        </PrimaryButton>
      </DialogTrigger>

      <DialogContent className="bg-[#0f172a] border-slate-800 text-slate-200 sm:max-w-7xl rounded-xl shadow-2xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white font-bold flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-purple-500" />
            Upload Activity Screen
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Unggah bukti aktivitas kerja kamu secara manual untuk mode tracker
            non-otomatis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[25%_auto] gap-4 flex-1 min-h-0">
          <HourSlot
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
          />
          <FlexSideContent
            status={status}
            selectedSlot={selectedSlot}
            errorData={errorData}
            onSubmit={handleUpload}
            setErrorData={setErrorData}
            error={error}
            isLoading={isLoading}
            isValidating={isValidating}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const FlexSideContent: React.FC<
  {
    selectedSlot: number | null;
    status: ProgressStatus;
    isLoading: boolean;
    isValidating: boolean;
    error: any;
  } & UploadImageFormProps
> = ({
  selectedSlot,
  status,
  error,
  isLoading,
  isValidating,
  ...formProps
}) => {
  if (isLoading || isValidating) return <RightLoadingState />;
  if (error) return <RightErrorState />;
  if (selectedSlot !== null) {
    if (status === "verified")
      return <RightSideHaveData slotId={selectedSlot} />;
    else if (status === "progress")
      return <RightSideProgress slotId={selectedSlot} />;

    return <UploadImageForm selectedSlot={selectedSlot} {...formProps} />;
  }

  return <RightNoSlotId />;
};
