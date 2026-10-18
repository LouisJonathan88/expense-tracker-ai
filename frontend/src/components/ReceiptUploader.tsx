"use client";

import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/Button";

export function ReceiptUploader({ onSelect }: { onSelect: (file: File) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; 
    if (file) onSelect(file);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <input
        ref={cameraRef}
        type="file" 
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <Button type="button" className="sm:hidden" onClick={() => cameraRef.current?.click()}>
        Ambil foto struk
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => galleryRef.current?.click()}
      >
        Pilih dari galeri
      </Button>
    </div>
  );
}