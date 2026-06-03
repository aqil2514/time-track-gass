"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivity } from "../provider/activity.provider";
import { buildUrl } from "@/utils/build-url";
import { useFetch } from "@/hooks/use-fetch";
import { AIScreenReportPopulateUserAndS3Image } from "@/features/dashboard/interface/ai-screen-db.interface";
import { webUrl } from "@/constants/server-url";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon, ZoomIn, X } from "lucide-react";

export function DetailDialog() {
  const { state, dispatch } = useActivity();
  const [isZoomed, setIsZoomed] = useState(false);

  const open = state.modal.openedModal === "detail";
  const activityId = state.modal.activityId;

  const url = activityId
    ? buildUrl(`/api/user-activity-tracker/${activityId}`, webUrl)
    : null;

  const { data, isLoading } =
    useFetch<AIScreenReportPopulateUserAndS3Image>(url);

  const handleCloseDetail = (open: boolean) => {
    if (!open) {
      dispatch({ type: "UPDATE_OPENED_MODAL", payload: { state: null } });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseDetail}>
        <DialogContent className="sm:max-w-2xl bg-[#0b0b14] border-slate-800 text-slate-200 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold text-slate-100">
              Detail Aktivitas
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Informasi lengkap mengenai aktivitas layar yang tercatat.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh] px-6 pb-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full bg-slate-800" />
                <Skeleton className="h-4 w-3/4 bg-slate-800" />
                <Skeleton className="h-4 w-1/2 bg-slate-800" />
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Image Section with Zoom Trigger */}
                <div
                  className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 min-h-50 flex items-center justify-center cursor-zoom-in"
                  onClick={() => setIsZoomed(true)}
                >
                  {data.image_url ? (
                    <>
                      <Image
                        src={data.image_url}
                        alt={data.window_title}
                        width={800}
                        height={450}
                        className="w-full h-auto object-contain max-h-100 transition-transform duration-300 group-hover:scale-[1.02]"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+ZNPQAIXwM4ihps7wAAAABJRU5ErkJggg=="
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-black/60 p-2 rounded-full backdrop-blur-sm border border-white/10">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-600">
                      <ImageIcon className="w-12 h-12 opacity-20" />
                      <p className="text-xs italic">
                        Tangkapan layar tidak tersedia
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                      Aplikasi
                    </p>
                    <p className="font-medium text-purple-400">
                      {data.app_name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                      Kategori
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                      {data.category}
                    </span>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                      Judul Jendela
                    </p>
                    <p className="text-slate-300 italic">
                      &quot;{data.window_title}&quot;
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                      Waktu
                    </p>
                    <p>
                      {format(
                        new Date(data.created_at),
                        "eeee, dd MMMM yyyy HH:mm",
                        { locale: id },
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">
                      User
                    </p>
                    <p>
                      {data.user.full_name}{" "}
                      <span className="text-slate-600">
                        ({data.user.division})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="p-3 rounded-md bg-slate-900/80 border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">
                    Ringkasan AI
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {data.summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">
                Data tidak ditemukan
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- LIGHTBOX DIALOG --- */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Tampilan Penuh Gambar</DialogTitle>
            <DialogDescription>
              Menampilkan detail tangkapan layar dari {data?.window_title}
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>

          {data?.image_url && (
            <div
              className="relative w-full h-[90vh] flex items-center justify-center cursor-zoom-out"
              onClick={() => setIsZoomed(false)}
            >
              <Image
                src={data.image_url}
                alt="Zoomed Screenshot"
                fill
                className="object-contain"
                quality={100}
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
