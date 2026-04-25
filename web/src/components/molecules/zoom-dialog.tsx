/* eslint-disable @next/next/no-img-element */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";

interface ZoomDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  imageSrc: string;
  altText?: string; 
  title?: string; 
}

export function ZoomDialog({
  isOpen,
  onClose,
  imageSrc,
  altText = "Pratinjau Gambar",
  title = "Lihat Detail Gambar",
}: ZoomDialogProps) {
  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] md:max-w-[90vw] lg:max-w-7xl border-none bg-transparent p-0 shadow-none outline-none flex items-center justify-center z-100"
        onClick={() => onClose(false)}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{altText}</DialogDescription>

        <div className="relative cursor-zoom-out flex items-center justify-center w-full h-full">
          <img
            src={imageSrc}
            alt={altText}
            className="h-auto max-h-[95vh] w-auto rounded-lg object-contain shadow-2xl transition-transform duration-200"
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
