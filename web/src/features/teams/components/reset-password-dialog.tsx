"use client";

import * as React from "react";
import axios, { isAxiosError } from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Loader2 } from "lucide-react";
import { useTeams } from "../providers/teams.provider";
import { useSWRConfig } from "swr";

export function ResetPasswordDialog() {
  const { state, dispatch } = useTeams();
  const { mutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Ambil state dari reducer
  const { isOpen, userId } = state.modal.resetPassword;

  const handleClose = () => {
    dispatch({ type: "CLOSE_RESET_PASSWORD_USER_MODAL" });
  };

  const handleConfirmReset = async () => {
    if (!userId) return;

    setIsSubmitting(true);
    try {
      // Endpoint sesuai Controller NestJS yang kita buat: PATCH /api/user/:id/reset-password
      await axios.patch(`/api/user/${userId}/reset-password`);
      
      alert("Password berhasil dihapus. User dapat mengatur ulang password saat login.");
      
      mutate("/api/user"); // Refresh data jika diperlukan
      handleClose();
    } catch (error) {
      if (isAxiosError(error)) {
        alert(error.response?.data?.message || "Gagal mereset password");
      } else {
        alert("Terjadi kesalahan yang tidak terduga");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Key className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-xl">Reset Password?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-400 text-sm leading-relaxed">
            Tindakan ini akan **menghapus password** pengguna saat ini. 
            Pengguna yang bersangkutan harus melakukan pengaturan password baru 
            melalui aplikasi desktop saat login berikutnya.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            disabled={isSubmitting}
            className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Mencegah auto-close agar loading terlihat
              handleConfirmReset();
            }}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-25"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Konfirmasi Reset"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}