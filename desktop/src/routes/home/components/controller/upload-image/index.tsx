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
import { UploadImageForm } from "./form";
import { useState } from "react";
import { UploadImageInput } from "@/routes/home/schema/upload-image.schema";
import { load } from "@tauri-apps/plugin-store";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { platform } from "@tauri-apps/plugin-os";

export interface ErrorDataMap {
  filename: string;
  reason: string;
}

export function UploadImage() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [errorData, setErrorData] = useState<ErrorDataMap[]>([]);

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
        buildUrl("image-upload/manual"),
        valuesWithOs,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 422) setErrorData(res.data.invalidImages);
    } catch (error) {
      console.error(error);
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
          <UploadImageForm
            onSubmit={handleUpload}
            selectedSlot={selectedSlot}
            errorData={errorData}
            setErrorData={setErrorData}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
