"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  imageFile: File | null;
  imagePreview: string | null;
  onImageSelect: (file: File, preview: string) => void;
  onImageRemove: () => void;
  uploading?: boolean;
}

export function ImageUploader({
  imageFile,
  imagePreview,
  onImageSelect,
  onImageRemove,
  uploading = false,
}: ImageUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelect(file, reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all duration-200 active:scale-[0.98]"
        >
          <Camera size={18} className="text-blue-400" />
          <span className="text-sm font-medium">Capture</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all duration-200 active:scale-[0.98]"
        >
          <Upload size={18} className="text-purple-400" />
          <span className="text-sm font-medium">Upload</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700"
          >
            <img
              src={imagePreview}
              alt="Case image preview"
              className="w-full max-h-48 object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
            {/* Remove button */}
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <X size={14} />
            </button>
            {/* Upload indicator */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950/60 backdrop-blur-sm">
                <Loader2 size={24} className="text-red-400 animate-spin" />
              </div>
            )}
            {/* File info */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-slate-900/80 text-[10px] text-slate-600 dark:text-slate-400">
              <ImageIcon size={10} />
              {imageFile?.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
