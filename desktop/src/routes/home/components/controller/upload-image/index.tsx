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

export function UploadImage() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
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
            onSubmit={(values) => {
              alert("Data akan diproses")
              console.log(values);
            }}
            selectedSlot={selectedSlot}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
